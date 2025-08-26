// Focus Tuin - Modular Entry Point
// Creative Coding Installatie met oogtracking en generatieve planten

import './ui/styling/base.css'
import './ui/styling/components.css'

import { FocusTuinApplicatie } from './core/applicatie.js'
import { InterfaceManager } from './ui/interface_manager.js'
import { SchermController } from './ui/scherm_controller.js'
import { gebeurtenisManager } from './core/gebeurtenissen.js'
import { APPLICATIE_CONFIG, validateConfig } from './core/configuratie.js'
import { SchermFlowManager } from './screens/scherm_flow_manager.js'
import { ASCIIKunst } from './tuin/ascii_kunst.js'
import { AfleidingSysteem } from './tuin/afleiding_systeem.js'
import { audioManager } from './audio/audio_manager.js'

// Hoofdklasse die alle modules samenbrengt
class FocusTuin {
  constructor() {
    // Core systemen
    this.applicatie = null;
    this.interfaceManager = null;
    this.schermController = null;
    this.schermFlowManager = null;
    
    // Initialisatie staat
    this.isGeinitialiseerd = false;
    this.isHoofdApplicatieGestart = false;
    this.initialisatieFouten = [];
    
    console.log('Focus Tuin Creative Installatie Start...');
    
    // Setup global access
    this.setupGlobalAccess();
    
    this.initialiseerMetStartScherm();
  }
  
  // Make instance available globally for debugging if needed
  setupGlobalAccess() {
    window.focusTuin = this;
  }
  
  async initialiseerMetStartScherm() {
    try {
      // Clear any persisted session state to ensure fresh start
      sessionStorage.clear();
      
      // Clear any localStorage keys that might affect session flow
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('directToEyeTracking') || key.includes('session') || key.includes('flow'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Session state cleared - starting fresh from start screen');
      
      // Valideer configuratie
      if (!validateConfig()) {
        throw new Error('Configuratie validatie gefaald');
      }
      
      // Debug modus indien nodig
      if (APPLICATIE_CONFIG.debug.enableGebeurtenisDebug) {
        gebeurtenisManager.setDebugModus(true);
      }
      
      // Verberg installatie UI tot hoofdapplicatie start
      this.verbergHoofdUI();
      
      // Setup scherm flow manager
      this.schermFlowManager = new SchermFlowManager();
      this.schermFlowManager.setHoofdApplicatie(this);
      
      // Setup flow gebeurtenissen
      this.setupSchermFlowGebeurtenissen();
      
      // Start met start scherm
      await this.schermFlowManager.startFlow();
      
      console.log('✅ Start scherm actief - wacht op gebruikers interactie...');
      console.log('⚠️  RELOAD PROTECTION: Session will always start from start screen');
      
    } catch (fout) {
      console.error('Kritieke fout tijdens start scherm initialisatie:', fout);
      this.initialisatieFouten.push(fout);
      this.handleInitialisatieFout(fout);
    }
  }
  
  async initialiseerHoofdApplicatie() {
    if (this.isHoofdApplicatieGestart) {
      return; // Al geinitialiseerd
    }
    
    try {
      // Initialiseer core applicatie EERST
      this.applicatie = new FocusTuinApplicatie();
      await this.applicatie.initialiseer();
      
      // Initialiseer UI systemen MET de applicatie referentie
      this.interfaceManager = new InterfaceManager(this.applicatie);
      this.schermController = new SchermController();
      
      // Wacht tot UI gereed is
      await this.wachtOpUIGereed();
      
      // Setup globale gebeurtenis handlers
      this.setupGlobaleGebeurtenissen();
      
      // Setup kalibratie communicatie
      this.setupKalibratieHandlers();
      
      // Markeer als geinitialiseerd
      this.isGeinitialiseerd = true;
      this.isHoofdApplicatieGestart = true;
      
      // Maak globaal beschikbaar voor debugging
      window.focusTuin = this;
      
      // Expose oogDetectie voor camera switching
      if (this.applicatie && this.applicatie.oogDetectie) {
        window.focusTuin.oogDetectie = this.applicatie.oogDetectie;
      } else {
        console.warn('OogDetectie niet beschikbaar voor global reference');
      }
      
      console.log('Focus Tuin hoofdapplicatie volledig geinitialiseerd!');
      
    } catch (fout) {
      console.error('Kritieke fout tijdens hoofdapplicatie initialisatie:', fout);
      this.initialisatieFouten.push(fout);
      this.handleInitialisatieFout(fout);
    }
  }
  
  async wachtOpUIGereed() {
    return new Promise((resolve) => {
      const checkUI = () => {
        if (this.interfaceManager && this.interfaceManager.isUIGereed) {
          resolve();
        } else {
          setTimeout(checkUI, 100);
        }
      };
      checkUI();
    });
  }
  
  verbergHoofdUI() {
    // Verberg installatie UI elementen tijdens start scherm en tutorial
    const installatieUI = document.getElementById('installation-ui');
    const installatieContainer = document.getElementById('installation-container');
    const p5CanvasContainer = document.getElementById('p5-canvas-container');
    const deathOverlay = document.getElementById('death-overlay');
    
    if (installatieUI) {
      installatieUI.style.display = 'none';
      installatieUI.style.opacity = '0';
    }
    
    if (installatieContainer) {
      installatieContainer.classList.remove('active'); // Use CSS transition
    }
    
    if (p5CanvasContainer) {
      p5CanvasContainer.classList.remove('active'); // Hide P5.js canvas
    }
    
    // Verberg death overlay
    if (deathOverlay) {
      deathOverlay.style.display = 'none';
      deathOverlay.style.opacity = '0';
      deathOverlay.style.visibility = 'hidden';
    }
  }
  
  setupSchermFlowGebeurtenissen() {
    // Luister naar tutorial scherm gebeurtenissen - NOT start scherm
    gebeurtenisManager.voegListenerToe('tutorialSchermVoltooid', async (data) => {
      console.log('ontvangst tutorialSchermVoltooid event in main.js', data);
      await this.startHoofdErvaring();
    });
  }
  
  async startHoofdErvaring() {
    console.log('Start hoofdervaring...');
    
    // Prevent duplicate initialization
    if (this.isHoofdApplicatieGestart) {
      console.log('Hoofdapplicatie already started, skipping duplicate initialization');
      return;
    }
    
    // Initialiseer hoofdapplicatie als nog niet gedaan
    if (!this.isHoofdApplicatieGestart) {
      await this.initialiseerHoofdApplicatie();
    }
    
    // Toon hoofdapplicatie UI
    this.toonHoofdUI();
    
    // Start ambient music
    audioManager.enableAudioAfterUserInteraction();
    audioManager.startAmbientMusic();
    console.log('Ambient music started for main experience');
    
    // Start applicatie als deze bestaat
    if (this.applicatie) {
      this.applicatie.startHoofdErvaring?.();
    }
  }
  
  toonHoofdUI() {
    // Toon installatie UI elementen na tutorial voltooiing
    const installatieUI = document.getElementById('installation-ui');
    const installatieContainer = document.getElementById('installation-container');
    const p5CanvasContainer = document.getElementById('p5-canvas-container');
    
    // Add a small delay to coordinate with tutorial screen transition
    setTimeout(() => {
      if (installatieUI) {
        installatieUI.style.display = 'block';
        installatieUI.style.opacity = '1';
      }
      
      if (installatieContainer) {
        installatieContainer.classList.add('active'); // Use CSS transition
      }
      
      if (p5CanvasContainer) {
        p5CanvasContainer.classList.add('active'); // Show P5.js canvas
      }
    }, 300); // Delay to ensure tutorial transition completes
  }
  
  setupGlobaleGebeurtenissen() {
    // Luister naar kalibratie gebeurtenissen van UI
    gebeurtenisManager.voegListenerToe('startKalibratie', () => {
      if (this.applicatie) {
        const success = this.applicatie.startKalibratie();
        if (!success) {
          this.interfaceManager.toonNotificatie(
            'Kalibratie kan niet worden gestart',
            'waarschuwing'
          );
        }
      }
    });
    
    // Luister naar export gebeurtenis
    document.addEventListener('exportASCIIArt', () => {
      if (this.applicatie) {
        const success = this.applicatie.exporteerASCIIKunst();
        if (success) {
          this.interfaceManager.toonNotificatie(
            'ASCII kunstwerk geëxporteerd!',
            'succes'
          );
        } else {
          this.interfaceManager.toonNotificatie(
            'Exporteren mislukt',
            'fout'
          );
        }
      }
    });
    
    // Luister naar restart gebeurtenis
    document.addEventListener('restartSession', () => {
      this.herstartSessie();
    });
    
    // Luister naar configuratie wijzigingen
    document.addEventListener('configuratieUpdate', (event) => {
      console.log('Configuratie update ontvangen:', event.detail);
    });
    
    // Window/document event handlers
    this.setupWindowEventHandlers();
    
    // Error handling
    this.setupErrorHandling();
  }
  
  // Methode om de sessie te herstarten
  herstartSessie() {
    // Verberg death overlay
    const deathOverlay = document.getElementById('death-overlay');
    if (deathOverlay) {
      deathOverlay.style.display = 'none';
      deathOverlay.style.opacity = '0';
      deathOverlay.style.visibility = 'hidden';
    }
    
    // Herstart audio manager - CRITICAL FIX for restart audio
    if (audioManager) {
      // Re-enable audio system completely
      audioManager.enableAudioAfterUserInteraction();
      audioManager.startAmbientMusic();
      
      // Force audio re-initialization after user interaction
      document.addEventListener('click', () => {
        audioManager.startAmbientMusic();
      }, { once: true });
      
      console.log('Audio manager herstart voor nieuwe sessie');
    }
    
    // Toon hoofdapplicatie UI opnieuw
    this.toonHoofdUI();
    
    // Herstart de applicatie
    if (this.applicatie) {
      // Reset applicatie staat
      this.applicatie.isDood = false;
      this.applicatie.levens = 2;
      this.applicatie.totaleFocusTijd = 0;
      this.applicatie.focusStartTijd = null;
      
      // Generate a NEW seed for the restarted session to ensure unique art
      this.applicatie.sessieZaad = Math.floor(Math.random() * 1000000);
      
      // Recreate ASCII art with new seed
      if (this.applicatie.asciiKunst && this.applicatie.p5Instantie) {
        this.applicatie.asciiKunst = new ASCIIKunst(this.applicatie.sessieZaad);
        this.applicatie.asciiKunst.initialiseer(this.applicatie.p5Instantie);
      }
      
      // CRITICAL FIX: Properly reinitialize distraction system
      if (this.applicatie.afleidingSysteem) {
        // Clean up old system first
        this.applicatie.afleidingSysteem.cleanup();
        // Create completely new distraction system
        this.applicatie.afleidingSysteem = new AfleidingSysteem(this.applicatie);
        console.log('🎯 Afleiding systeem opnieuw geïnitialiseerd voor restart');
      }
      
      // Update UI elementen
      const livesCountElement = document.getElementById('lives-count');
      if (livesCountElement) {
        livesCountElement.textContent = '2';
      }
      
      const focusTimeElement = document.getElementById('focus-time');
      if (focusTimeElement) {
        focusTimeElement.textContent = 'Focus tijd: 0s';
      }
      
      // Reset interface manager als deze bestaat - CRITICAL FIX for jumpscares
      if (this.interfaceManager) {
        // Reset jumpscare timing to allow immediate effects
        this.interfaceManager.lastJumpscareTime = 0;
        this.interfaceManager.sessionStartTime = Date.now();
        console.log('🎬 Interface manager timing reset voor nieuwe sessie');
      }
      
      this.interfaceManager.toonNotificatie(
        'Sessie herstart',
        'succes'
      );
    }
  }
  
  setupWindowEventHandlers() {
    // Visibility change (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pagina is niet zichtbaar - optioneel pauzeren
        if (APPLICATIE_CONFIG.monitoring.pauseOnHidden) {
          this.applicatie?.pauseerApplicatie();
        }
      } else {
        // Pagina is weer zichtbaar
        if (APPLICATIE_CONFIG.monitoring.pauseOnHidden) {
          this.applicatie?.hervattApplicatie();
        }
      }
    });
    
    // Beforeunload - cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Error handlers
    window.addEventListener('error', (event) => {
      console.error('Window error:', event.error);
      this.handleGlobaleFout(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobaleFout(event.reason);
    });
  }
  
  setupErrorHandling() {
    // Luister naar kritieke fouten
    gebeurtenisManager.voegListenerToe('kritiekeFout', (foutData) => {
      this.handleKritiekeFout(foutData);
    });
  }
  
  setupKalibratieHandlers() {
    // Luister naar kalibratie gebeurtenissen van applicatie
    gebeurtenisManager.luisterNaarKalibratie((data) => {
      // Deze worden al afgehandeld door InterfaceManager
      // Hier kunnen we extra acties toevoegen indien nodig
    });
  }
  
  handleInitialisatieFout(fout) {
    // Toon fout aan gebruiker
    if (this.interfaceManager) {
      this.interfaceManager.toonNotificatie(
        'Initialisatie fout: ' + fout.message,
        'fout',
        10000
      );
    }
    
    // Update scherm naar fout staat
    if (this.schermController) {
      this.schermController.wisseltNaarScherm('fout', { foutInfo: fout });
    }
  }
  
  handleGlobaleFout(fout) {
    console.error('Globale fout afgehandeld:', fout);
    
    // Toon fout aan gebruiker
    if (this.interfaceManager) {
      this.interfaceManager.toonNotificatie(
        'Onverwachte fout: ' + fout.message,
        'fout',
        8000
      );
    }
  }
  
  handleKritiekeFout(foutData) {
    console.error('Kritieke fout afgehandeld:', foutData);
    
    // Toon fout aan gebruiker
    if (this.interfaceManager) {
      this.interfaceManager.toonNotificatie(
        'Kritieke fout: ' + (foutData.bericht || 'Onbekende fout'),
        'fout',
        12000
      );
    }
    
    // Update scherm naar fout staat
    if (this.schermController) {
      this.schermController.wisseltNaarScherm('fout', { foutInfo: foutData });
    }
  }
  
  cleanup() {
    // Cleanup audio first
    audioManager.cleanup();
    
    // Cleanup resources
    if (this.applicatie) {
      this.applicatie.stopApplicatie?.();
    }
    
    console.log('Focus Tuin cleanup voltooid');
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.focusTuin = new FocusTuin();
  });
} else {
  window.focusTuin = new FocusTuin();
}

// Global debug commands voor ontwikkeling en debugging
window.setupDebugCommands = function() {
  // Classic goToEyeTracking command
  window.goToEyeTracking = async function() {
    console.log('🚀 DEBUG: Spring direct naar eye tracking scherm...');
    if (window.focusTuin && window.focusTuin.schermFlowManager) {
      const success = await window.focusTuin.schermFlowManager.gaNaarScherm('hoofdErvaring');
      if (success) {
        console.log('✅ DEBUG: Eye tracking scherm geladen');
      } else {
        console.log('❌ DEBUG: Fout bij laden eye tracking scherm');
      }
    } else {
      console.log('❌ DEBUG: FocusTuin niet beschikbaar');
    }
  };
  
  // Restart session command
  window.restartSession = function() {
    console.log('🔄 DEBUG: Herstart sessie...');
    if (window.focusTuin) {
      window.focusTuin.herstartSessie();
      console.log('✅ DEBUG: Sessie herstart');
    } else {
      console.log('❌ DEBUG: FocusTuin niet beschikbaar');
    }
  };
  
  // Show debug info
  window.showDebugInfo = function() {
    console.log('🔍 DEBUG INFO:');
    console.log('FocusTuin:', window.focusTuin);
    console.log('Screen Flow Manager:', window.focusTuin?.schermFlowManager);
    console.log('Current Screen:', window.focusTuin?.schermFlowManager?.huidigeScherm);
    console.log('Application:', window.focusTuin?.applicatie);
    console.log('Interface Manager:', window.focusTuin?.interfaceManager);
    console.log('Eye Detection:', window.focusTuin?.oogDetectie);
  };
  
  // Force death screen for testing
  window.forceDeath = function() {
    console.log('💀 DEBUG: Forceer death screen...');
    if (window.focusTuin?.applicatie) {
      window.focusTuin.applicatie.isDood = true;
      window.focusTuin.applicatie.levens = 0;
      // Trigger death overlay
      const deathOverlay = document.getElementById('death-overlay');
      if (deathOverlay) {
        deathOverlay.style.display = 'block';
        deathOverlay.style.opacity = '1';
        deathOverlay.style.visibility = 'visible';
      }
      console.log('✅ DEBUG: Death screen geforceerd');
    }
  };
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+E for eye tracking
    if (event.ctrlKey && event.shiftKey && event.key === 'E') {
      event.preventDefault();
      window.goToEyeTracking();
    }
    // Ctrl+Shift+R for restart
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      window.restartSession();
    }
    // Ctrl+Shift+D for debug info
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      window.showDebugInfo();
    }
  });
  
  console.log('🛠️ DEBUG COMMANDS LOADED:');
  console.log('  goToEyeTracking() - Spring naar eye tracking');
  console.log('  restartSession() - Herstart sessie');
  console.log('  showDebugInfo() - Toon debug informatie');
  console.log('  forceDeath() - Forceer death screen');
  console.log('  Ctrl+Shift+E - Spring naar eye tracking');
  console.log('  Ctrl+Shift+R - Herstart sessie');
  console.log('  Ctrl+Shift+D - Toon debug info');
};

// Setup debug commands when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.setupDebugCommands();
  });
} else {
  window.setupDebugCommands();
}
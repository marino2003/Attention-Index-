// UI Interface Manager voor Focus Tuin
// Beheert alle UI interacties en staat

import { gebeurtenisManager } from '../core/gebeurtenissen.js';
import { APPLICATIE_CONFIG } from '../core/configuratie.js';
import { afstandTotCentrum } from '../utils/math_utils.js';
import { audioManager } from '../audio/audio_manager.js';

export class InterfaceManager {
  constructor(applicatie = null) {
    // Reduced logging to minimize console spam
    // console.log('🎯 Creating InterfaceManager with application reference:', !!applicatie);
    
    // UI element references - minimal set for clean installation
    this.focusPunt = null;
    this.oogIndicator = null;
    this.focusTimeElement = null; // Added
    this.livesCountElement = null; // Added
    this.deathOverlay = null; // Added
    this.totalFocusTimeElement = null; // Added
    this.dataCollectionIndicator = null; // Surveillance hint
    this.behaviorProfile = null; // User classification
    this.attentionValueMeter = null; // Value extraction indicator
    
    // NEW: Dystopian UI elements
    this.productivityIndex = null;
    this.engagementScore = null;
    this.neuralSignal = null;
    this.complianceIndicator = null;
    this.productivityValue = null;
    this.engagementValue = null;
    this.signalStrength = null;
    this.complianceLevel = null;
    
    // NEW: Jumpscare elements
    this.jumpscareOverlay = null;
    this.jumpscareText = null;
    this.jumpscareAudio = null;
    this.activeJumpscareTimeout = null;
    
    // Jumpscare timing
    this.lastJumpscareTime = 0;
    this.jumpscareMinInterval = 8000; // 8 seconds minimum between jumpscares
    this.sessionStartTime = Date.now();
    
    // Reference to main application
    this.applicatie = applicatie;
    
    // UI state
    this.isUIGereed = false;
    this.huidigeStatus = 'initialiseren';
    
    this.initialiseerUI();
  }
  
  initialiseerUI() {
    // Wacht tot DOM gereed is
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUIElementen());
    } else {
      this.setupUIElementen();
    }
  }
  
  setupUIElementen() {
    // Get references to essential UI elements only
    this.focusPunt = document.getElementById('focus-point');
    this.oogIndicator = document.getElementById('gaze-indicator');
    this.focusTimeElement = document.getElementById('focus-time'); // Added
    this.livesCountElement = document.getElementById('lives-count'); // Added
    this.deathOverlay = document.getElementById('death-overlay'); // Added
    this.totalFocusTimeElement = document.getElementById('total-focus-time'); // Added
    this.dataCollectionIndicator = document.getElementById('data-collection-status');
    this.behaviorProfile = document.getElementById('behavior-profile');
    this.attentionValueMeter = document.getElementById('attention-value');
    
    // NEW: Dystopian UI elements
    this.productivityIndex = document.getElementById('productivity-index');
    this.engagementScore = document.getElementById('engagement-score');
    this.neuralSignal = document.getElementById('neural-signal');
    this.complianceIndicator = document.getElementById('compliance-indicator');
    this.productivityValue = document.getElementById('productivity-value');
    this.engagementValue = document.getElementById('engagement-value');
    this.signalStrength = document.getElementById('signal-strength');
    this.complianceLevel = document.getElementById('compliance-level');
    
    // NEW: Jumpscare elements
    this.jumpscareOverlay = document.getElementById('jumpscare-overlay');
    this.jumpscareText = document.getElementById('jumpscare-text');
    this.jumpscareAudio = document.getElementById('jumpscare-audio');
    
    // NEW: Subtle footer elements
    this.attentionFooter = document.getElementById('attention-footer');
    this.valueCounter = document.getElementById('value-counter');
    this.processingStatus = document.getElementById('processing-status');
    
    // Start subtle attention tracking
    this.startSubtleAttentionTracking();
    
    // Reduced logging to minimize console spam
    // Debug logging to verify elements are found
    // console.log('UI Elements found:', {
    //   focusPunt: !!this.focusPunt,
    //   oogIndicator: !!this.oogIndicator,
    //   focusTimeElement: !!this.focusTimeElement,
    //   livesCountElement: !!this.livesCountElement,
    //   deathOverlay: !!this.deathOverlay,
    //   totalFocusTimeElement: !!this.totalFocusTimeElement
    // });
    
    // Check if essential elements are present
    const essentieleElementen = [this.focusPunt, this.oogIndicator];
    const ontbrekendeElementen = essentieleElementen.filter(element => !element);
    
    if (ontbrekendeElementen.length > 0) {
      // console.error('Missing essential UI elements detected');
      return false;
    }
    
    // Setup event listeners
    this.setupGebeurtenisListeners();
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Setup death overlay event listeners
    this.setupDeathOverlayListeners(); // Added
    
    this.isUIGereed = true;
    return true;
  }
  
  setupDeathOverlayListeners() {
    // Add event listener for export button
    const exportButton = document.getElementById('export-art');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        // Trigger ASCII art export event
        document.dispatchEvent(new CustomEvent('exportASCIIArt'));
      });
    }
    
    // Add event listener for restart button
    const restartButton = document.getElementById('restart-session');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        // Trigger restart event
        document.dispatchEvent(new CustomEvent('restartSession'));
      });
    }
  }
  
  setupGebeurtenisListeners() {
    // Listen to essential application events only
    gebeurtenisManager.luisterNaarApplicatieStatus((data) => {
      this.handleApplicatieStatusUpdate(data);
    });
    
    // Listen to focus changes for visual feedback
    gebeurtenisManager.luisterNaarFocusVerandering((data) => {
      this.handleFocusVerandering(data);
    });
    
    // Listen to eye position updates for gaze indicator
    gebeurtenisManager.luisterNaarOogPositie((data) => {
      this.updateOogIndicator(data);
    });
    
    // Listen to life loss events
    gebeurtenisManager.voegListenerToe('levenVerloren', (data) => {
      this.handleLevenVerloren(data);
    });
    
    // Listen to death events
    gebeurtenisManager.voegListenerToe('gebruikerDood', (data) => {
      this.handleGebruikerDood(data);
    });
    
    // Direct DOM event listeners for backwards compatibility
    document.addEventListener('oogPositieUpdate', (event) => {
      this.updateOogIndicator(event.detail);
    });
    
    // Essential calibration events (minimal feedback)
    gebeurtenisManager.luisterNaarKalibratie((data) => {
      this.handleKalibratieUpdate(data);
    });
    
    // Listen for focus time updates
    document.addEventListener('focusTimeUpdate', (event) => {
      this.updateFocusTime(event.detail);
    });
    
    // Listen for behavior profile updates
    document.addEventListener('behaviorProfileUpdated', (event) => {
      this.updateBehaviorProfile(event.detail.temperament);
      this.updateDataCollectionStatus('analyzing');
    });
    
    // Listen for focus events to update footer attention value
    document.addEventListener('focusTimeUpdate', (event) => {
      this.updateFooterAttentionValue(event.detail);
    });
    
    // Reduced logging to minimize console spam
    // console.log('🎯 Event listeners setup complete');
  }
  
  handleLevenVerloren(data) {
    // Update lives display
    if (this.livesCountElement) {
      this.livesCountElement.textContent = data.resterendeLevens;
    }
    
    // ENHANCED LIFE LOSS VISUAL FEEDBACK
    this.triggerEnhancedLifeLossAnimation(data.resterendeLevens);
    
    // DYSTOPIAN JUMPSCARE: Sudden UI revelation when losing life
    this.triggerDystopianJumpscare('attention_debt');
    
    // Update attention value meter to show loss
    this.updateAttentionValueMeter(data.resterendeLevens * 0.5); // Simulate value drop
  }
  
  // Enhanced dramatic life loss animation
  triggerEnhancedLifeLossAnimation(remainingLives) {
    // EXTREME SCREEN FLASH - Much more intense
    document.body.style.background = 'rgba(255, 0, 0, 0.9)';
    document.body.style.transition = 'background 0.02s ease';
    
    // Show EXTREMELY dramatic life loss message with more violent text
    this.showJumpscareText('AANDACHT\nVERLOREN\n\nFOCUS GEFAALD!');
    
    // VIOLENT life counter animation
    if (this.livesCountElement) {
      // MASSIVE scale and extreme glow effect
      this.livesCountElement.style.transform = 'scale(4.0)';
      this.livesCountElement.style.color = '#ff0000';
      this.livesCountElement.style.textShadow = '0 0 40px rgba(255, 0, 0, 1), 0 0 80px rgba(255, 0, 0, 0.9), 0 0 120px rgba(255, 0, 0, 0.7)';
      this.livesCountElement.style.transition = 'all 0.05s ease';
      this.livesCountElement.style.filter = 'brightness(300%)';
      
      // EXTREME pulsing effect with more steps
      setTimeout(() => {
        if (this.livesCountElement) {
          this.livesCountElement.style.transform = 'scale(2.0)';
          this.livesCountElement.style.color = '#ff4444';
          this.livesCountElement.style.filter = 'brightness(200%)';
        }
      }, 80);
      
      setTimeout(() => {
        if (this.livesCountElement) {
          this.livesCountElement.style.transform = 'scale(3.5)';
          this.livesCountElement.style.color = '#ff0000';
          this.livesCountElement.style.filter = 'brightness(350%)';
        }
      }, 160);
      
      setTimeout(() => {
        if (this.livesCountElement) {
          this.livesCountElement.style.transform = 'scale(1.5)';
          this.livesCountElement.style.color = '#ff8888';
          this.livesCountElement.style.filter = 'brightness(150%)';
        }
      }, 240);
      
      setTimeout(() => {
        if (this.livesCountElement) {
          this.livesCountElement.style.transform = 'scale(3.0)';
          this.livesCountElement.style.color = '#ff0000';
          this.livesCountElement.style.filter = 'brightness(400%)';
        }
      }, 320);
      
      // Reset to normal after extreme animation
      setTimeout(() => {
        if (this.livesCountElement) {
          this.livesCountElement.style.transform = 'scale(1.0)';
          this.livesCountElement.style.color = '';
          this.livesCountElement.style.textShadow = '';
          this.livesCountElement.style.transition = 'all 0.5s ease';
          this.livesCountElement.style.filter = '';
        }
      }, 1200);
    }
    
    // EXTREME screen shake effect - MUCH more violent
    const originalTransform = document.documentElement.style.transform;
    let shakeIntensity = 25; // Increased from 6 to 25
    let shakeCount = 0;
    const maxShakes = 20; // Increased from 8 to 20
    
    const shakeInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * shakeIntensity;
      const y = (Math.random() - 0.5) * shakeIntensity;
      const rotation = (Math.random() - 0.5) * 2; // Add rotation shake
      document.documentElement.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      
      shakeCount++;
      shakeIntensity *= 0.9; // Slower reduction to maintain intensity longer
      
      if (shakeCount >= maxShakes || shakeIntensity < 1) {
        clearInterval(shakeInterval);
        document.documentElement.style.transform = originalTransform;
      }
    }, 40); // Faster shake interval (was 80ms, now 40ms)
    
    // EXTREME flash sequence - Much more violent and strobing
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 255, 255, 0.8)'; // White flash
    }, 50);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 0, 0, 0.9)';
    }, 100);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 255, 255, 0.6)'; // Another white flash
    }, 150);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 0, 0, 0.7)';
    }, 200);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(0, 0, 0, 0.8)'; // Black flash
    }, 250);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 0, 0, 0.8)';
    }, 300);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 255, 255, 0.4)'; // Final white flash
    }, 350);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 100, 100, 0.3)';
    }, 450);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 50, 50, 0.1)';
    }, 600);
    
    // Add screen distortion effect
    setTimeout(() => {
      document.documentElement.style.filter = 'contrast(150%) saturate(200%) hue-rotate(10deg)';
    }, 100);
    
    setTimeout(() => {
      document.documentElement.style.filter = 'contrast(200%) saturate(300%) hue-rotate(-5deg) brightness(120%)';
    }, 200);
    
    setTimeout(() => {
      document.documentElement.style.filter = 'contrast(120%) saturate(150%)';
    }, 400);
    
    // Reset all effects after extreme animation
    setTimeout(() => {
      document.body.style.background = '';
      document.body.style.transition = '';
      document.documentElement.style.filter = '';
    }, 1500); // Longer duration for more impact
  }
  
  updateDataCollectionStatus(status) {
    if (this.dataCollectionIndicator) {
      const statusTexts = {
        'collecting': 'DATA: VERZAMELEN...',
        'processing': 'DATA: VERWERKEN...',
        'analyzing': 'DATA: ANALYSEREN...',
        'complete': 'DATA: VOLTOOID'
      };
      this.dataCollectionIndicator.textContent = statusTexts[status] || 'DATA: ONBEKEND';
    }
  }
  
  updateBehaviorProfile(temperament) {
    if (this.behaviorProfile) {
      const profileTexts = {
        'chaotic': 'PROFIEL: CHAOTISCH',
        'focused': 'PROFIEL: GEFOCUST',
        'energetic': 'PROFIEL: ENERGIEK', 
        'calm': 'PROFIEL: KALM'
      };
      this.behaviorProfile.textContent = profileTexts[temperament] || 'PROFIEL: ONBEKEND';
    }
  }
  
  updateAttentionValueMeter(value) {
    if (this.attentionValueMeter) {
      this.attentionValueMeter.textContent = `WAARDE: €${value.toFixed(2)}`;
      
      // Color coding based on value
      if (value > 0.7) {
        this.attentionValueMeter.style.color = 'rgba(0, 255, 100, 0.9)';
      } else if (value > 0.3) {
        this.attentionValueMeter.style.color = 'rgba(255, 200, 0, 0.9)';
      } else {
        this.attentionValueMeter.style.color = 'rgba(255, 100, 100, 0.9)';
      }
    }
    
    // DYSTOPIAN: Trigger productivity metrics after some time
    const sessionTime = Date.now() - this.sessionStartTime;
    if (sessionTime > 15000 && sessionTime < 17000) { // Between 15-17 seconds
      this.triggerDystopianJumpscare('productivity_reveal');
    }
    
    // DYSTOPIAN: Value extraction jumpscare when value drops significantly
    if (value < 0.2 && Math.random() < 0.3) {
      this.triggerDystopianJumpscare('value_extraction');
    }
  }
  
  handleGebruikerDood(data) {
    // Trigger dramatic death animation first
    this.triggerDeathAnimation(() => {
      // Show death overlay after animation completes
      this.showDeathOverlay(data);
    });
  }
  
  // Dramatic death animation sequence
  triggerDeathAnimation(callback) {
    console.log('triggerDeathAnimation called'); // Debug log
    
    // IMMEDIATELY clean up all active popups when death starts
    if (this.applicatie && this.applicatie.afleidingSysteem) {
      this.applicatie.afleidingSysteem.cleanupActivePopups();
    }
    
    // Screen flash effect
    document.body.style.background = 'rgba(255, 0, 0, 0.3)';
    document.body.style.transition = 'background 0.1s ease';
    
    // Show dramatic death message
    console.log('Calling showJumpscareText with death message'); // Debug log
    this.showJumpscareText('AANDACHT\nFAILLISSEMENT');
    
    // Red flash sequence
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 0, 0, 0.1)';
    }, 100);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(255, 0, 0, 0.4)';
    }, 200);
    
    setTimeout(() => {
      document.body.style.background = 'rgba(0, 0, 0, 0.8)';
    }, 300);
    
    // Screen shake effect
    const originalTransform = document.documentElement.style.transform;
    let shakeIntensity = 10;
    const shakeInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * shakeIntensity;
      const y = (Math.random() - 0.5) * shakeIntensity;
      document.documentElement.style.transform = `translate(${x}px, ${y}px)`;
      shakeIntensity *= 0.9; // Gradually reduce shake
      
      if (shakeIntensity < 0.5) {
        clearInterval(shakeInterval);
        document.documentElement.style.transform = originalTransform;
      }
    }, 50);
    
    // Reset background and call callback after animation
    setTimeout(() => {
      document.body.style.background = '';
      document.body.style.transition = '';
      callback();
    }, 2500);
  }
  
  // Show death overlay (separated from animation)
  showDeathOverlay(data) {
    if (this.deathOverlay) {
      this.deathOverlay.style.display = 'flex';
      this.deathOverlay.style.visibility = 'visible';
      this.deathOverlay.style.opacity = '1';
      this.deathOverlay.classList.add('zichtbaar');
      this.deathOverlay.style.zIndex = '1000';
      this.deathOverlay.offsetHeight; // Force reflow
    }
    
    // Update total focus time
    if (this.totalFocusTimeElement) {
      const app = this.applicatie || window.focusTuin?.applicatie;
      let totalTimeMs = data.totaleFocusTijd;
      if (app && app.focusStartTijd) {
        totalTimeMs += Date.now() - app.focusStartTijd;
      }
      const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
      this.totalFocusTimeElement.textContent = totalTimeSeconds;
    }
  }
  
  setupInputHandlers() {
    // Minimal input handling for clean installation experience
    document.addEventListener('keydown', (event) => {
      this.handleToetsInput(event);
    });
  }
  
  handleToetsInput(event) {
    // Kalibratie starten (Shift + C)
    if (event.key === APPLICATIE_CONFIG.kalibratie.kalibratieSneltoets && 
        event.shiftKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.startKalibratie();
    }
    
    // Kalibratie stoppen (Escape)
    if (event.key === APPLICATIE_CONFIG.kalibratie.stopSneltoets) {
      gebeurtenisManager.verstuurGebeurtenis('stopKalibratie', {});
    }
  }
  
  handleApplicatieStatusUpdate(data) {
    // Minimal status updates for clean installation experience
    switch (data.gebeurtenisNaam || 'onbekend') {
      case 'applicatieGeinitialiseerd':
        console.log('Application initialized - eye tracking ready');
        break;
        
      case 'applicatieGepauzeerd':
        console.log('Application paused');
        break;
        
      case 'applicatieHervat':
        console.log('Application resumed');
        break;
        
      case 'applicatieGestopt':
        console.log('Application stopped');
        break;
    }
  }
  
  handleFocusVerandering(data) {
    if (data.gebeurtenisNaam === 'focusActief') {
      this.focusPunt?.classList.add('focused');
      
      // Surveillance: Show data collection activity
      this.updateDataCollectionStatus('collecting');
      
      // Gradually increase attention value
      const currentValue = parseFloat(this.attentionValueMeter?.textContent.replace('WAARDE: €', '') || '0');
      this.updateAttentionValueMeter(Math.min(1.0, currentValue + 0.1));
      
      // Update neural signal strength
      if (this.signalStrength) {
        this.signalStrength.textContent = 'STERK';
        this.signalStrength.style.color = 'rgba(0, 255, 100, 0.9)';
      }
      
    } else if (data.gebeurtenisNaam === 'focusVerloren') {
      this.focusPunt?.classList.remove('focused');
      
      // Surveillance: Show processing of collected data
      this.updateDataCollectionStatus('processing');
      
      // DYSTOPIAN: Immediate compliance warning
      this.triggerDystopianJumpscare('focus_lost');
      
      // Update neural signal to weak
      if (this.signalStrength) {
        this.signalStrength.textContent = 'ZWAK';
        this.signalStrength.style.color = 'rgba(255, 100, 100, 0.9)';
      }
    }
  }
  
  updateOogIndicator(data) {
    if (!this.oogIndicator || !data.positie) {
      return;
    }
    
    const { positie, isFocus, afstand } = data;
    
    // Update positie
    this.oogIndicator.style.left = positie.x + 'px';
    this.oogIndicator.style.top = positie.y + 'px';
    this.oogIndicator.classList.add('visible');
    
    // Update visuele staat based on distance from center (consistent with detection)
    const centrumX = window.innerWidth / 2;
    const centrumY = window.innerHeight / 2;
    const distanceFromCenter = afstandTotCentrum(positie, centrumX, centrumY);
    
    // Use same threshold as detection system for consistency - with increased tolerance
    const visualRadius = 20; // FOCUS_ZONE_CONFIG.visual.basisStraal
    const outerRingRadius = visualRadius * 1.4; // 28px - visual ring
    const actualTolerance = outerRingRadius * 1.4; // 39px - actual detection boundary
    const isWithinBounds = distanceFromCenter <= actualTolerance;
    
    if (isWithinBounds) {
      this.oogIndicator.classList.add('focused');
      this.oogIndicator.style.background = 'rgba(0, 255, 136, 0.8)';
      this.oogIndicator.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.8)';
      this.oogIndicator.style.transform = 'translate(-50%, -50%) scale(1.2)';
    } else {
      this.oogIndicator.classList.remove('focused');
      this.oogIndicator.style.background = 'rgba(255, 68, 68, 0.8)'; // Red when outside bounds
      this.oogIndicator.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
      this.oogIndicator.style.transform = 'translate(-50%, -50%) scale(1.0)';
    }
  }
  
  handleKalibratieUpdate(data) {
    // Minimal calibration feedback for clean experience
    if (data.gebeurtenisNaam === 'kalibratieVoltooid') {
      // Reduced logging to minimize console spam
      // console.log('Calibration completed successfully');
      
    } else if (data.gebeurtenisNaam === 'kalibratieNietGereed') {
      // Reduced logging to minimize console spam
      // console.log('Waiting for eye tracking to be ready...');
    }
  }
  
  updateFocusTime(data) {
    // Update focus time display
    if (this.focusTimeElement) {
      const totalTimeSeconds = Math.floor(data.totaleFocusTijd);
      this.focusTimeElement.textContent = `GEËXTRAHEERDE AANDACHT: ${totalTimeSeconds}s`;
    }
    
    // Update productivity index
    if (this.productivityValue) {
      const productivity = Math.min(100, Math.floor(data.totaleFocusTijd / 60 * 100)); // 1 min = 100%
      this.productivityValue.textContent = `${productivity}%`;
    }
    
    // Update engagement score
    if (this.engagementValue) {
      const engagement = data.totaleFocusTijd > 30 ? 'HOOG' : data.totaleFocusTijd > 10 ? 'GEMIDDELD' : 'LAAG';
      this.engagementValue.textContent = engagement;
    }
    
    // DYSTOPIAN: Reveal neural monitoring after sustained focus
    if (data.totaleFocusTijd > 20 && data.totaleFocusTijd < 22) { // Between 20-22 seconds
      this.triggerDystopianJumpscare('neural_monitoring');
    }
    
    // DYSTOPIAN: Data harvesting complete jumpscare
    if (data.totaleFocusTijd > 45 && data.totaleFocusTijd < 47) { // Between 45-47 seconds
      this.triggerDystopianJumpscare('data_harvesting');
    }
  }
  
  handleConfiguratieUpdate(data) {
    // Update UI op basis van configuratie wijzigingen
    console.log('UI configuratie update:', data);
    
    // Bijvoorbeeld: update animatie snelheden
    if (data.sectie === 'ui' && data.sleutel === 'animatieDuration') {
      document.documentElement.style.setProperty('--animation-duration', data.nieuweWaarde + 'ms');
    }
  }
  
  startKalibratie() {
    gebeurtenisManager.verstuurGebeurtenis('startKalibratie', {});
  }
  
  // Remove methods that reference deleted UI elements
  updateStatus() {
    // Status updates disabled for clean installation experience
  }
  
  updateFocusStatus() {
    // Focus status updates disabled for clean installation experience  
  }
  
  toonKalibratieControls() {
    // Calibration controls disabled for clean installation experience
  }
  
  verbergKalibratieControls() {
    // Calibration controls disabled for clean installation experience
  }
  
  updateCameraPrompt() {
    // Camera prompts disabled for clean installation experience
  }
  
  toggleDebugModus() {
    // Debug mode disabled for clean installation experience
  }
  
  toonNotificatie(bericht, type = 'info', duur = null) {
    const notificatieDuur = duur || APPLICATIE_CONFIG.ui.notificatieDuration;
    
    // Simpele notificatie implementatie
    const notificatie = document.createElement('div');
    notificatie.className = `notificatie notificatie-${type}`;
    notificatie.textContent = bericht;
    notificatie.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 5px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Type-specifieke styling
    if (type === 'succes') {
      notificatie.style.borderLeft = '4px solid #00ff88';
    } else if (type === 'waarschuwing') {
      notificatie.style.borderLeft = '4px solid #ffaa00';
    } else if (type === 'fout') {
      notificatie.style.borderLeft = '4px solid #ff4444';
    }
    
    document.body.appendChild(notificatie);
    
    // Animatie en verwijdering
    requestAnimationFrame(() => {
      notificatie.style.opacity = '1';
    });
    
    setTimeout(() => {
      notificatie.style.opacity = '0';
      setTimeout(() => {
        if (notificatie.parentNode) {
          notificatie.parentNode.removeChild(notificatie);
        }
      }, 300);
    }, notificatieDuur);
  }
  
  // NEW: Dramatic jumpscare system with text overlay and audio
  triggerDystopianJumpscare(type) {
    const now = Date.now();
    
    // Prevent too frequent jumpscares
    if (now - this.lastJumpscareTime < this.jumpscareMinInterval) {
      return;
    }
    
    this.lastJumpscareTime = now;
    
    let message = '';
    
    switch (type) {
      case 'attention_debt':
        message = 'BLIJF FOCUSSEN';
        this.revealElementWithFlash(this.complianceIndicator, 'AANDACHT SCHULD GEDETECTEERD');
        if (this.complianceLevel) {
          this.complianceLevel.textContent = 'LAAG';
          this.complianceLevel.style.color = 'rgba(255, 100, 100, 0.9)';
        }
        break;
        
      case 'productivity_reveal':
        message = 'HOUD AANDACHT\nVAST';
        this.revealElementWithFlash(this.productivityIndex, 'PRODUCTIVITEIT MONITORING ACTIEF');
        break;
        
      case 'neural_monitoring':
        message = 'BLIJF KIJKEN';
        this.revealElementWithFlash(this.neuralSignal, 'NEURAAL PATROON GEDETECTEERD');
        this.revealElementWithFlash(this.engagementScore, null, 500); // Delayed reveal
        break;
        
      case 'focus_lost':
        message = 'TERUGKEREN\nNAAR FOCUS';
        // Flash compliance warning
        if (this.complianceIndicator && this.complianceIndicator.style.display !== 'none') {
          this.flashElement(this.complianceIndicator, 'AANDACHT DRIFT GEDETECTEERD');
          if (this.complianceLevel) {
            this.complianceLevel.textContent = 'KRITIEK';
            this.complianceLevel.style.color = 'rgba(255, 50, 50, 1.0)';
          }
        }
        break;
        
      case 'value_extraction':
        message = 'FOCUS\nVERBETEREN';
        break;
        
      case 'data_harvesting':
        message = 'GOED BEZIG\nDOORGAAN';
        break;
    }
    
    // Trigger the dramatic jumpscare with text and audio
    this.showJumpscareText(message);
  }
  
  // Show dramatic flickering text overlay with synchronized audio
  showJumpscareText(message) {
    console.log('showJumpscareText called with message:', message); // Debug log
    
    if (!this.jumpscareOverlay || !this.jumpscareText) {
      console.warn('Jumpscare elements not found:', {
        overlay: !!this.jumpscareOverlay,
        text: !!this.jumpscareText
      });
      return;
    }
    
    // Don't show jumpscares if death overlay is visible
    if (this.deathOverlay && (this.deathOverlay.style.display === 'flex' || this.deathOverlay.classList.contains('zichtbaar'))) {
      console.log('Skipping jumpscare - death screen is active');
      return;
    }
    
    // Clear any existing jumpscare
    if (this.activeJumpscareTimeout) {
      clearTimeout(this.activeJumpscareTimeout);
      this.jumpscareOverlay.classList.remove('jumpscare-active');
    }
    
    // Set the message and ensure it's visible
    this.jumpscareText.textContent = message;
    console.log('Jumpscare text set to:', this.jumpscareText.textContent); // Debug log
    
    // Play jumpscare audio using audio manager
    audioManager.playJumpscareSound();
    
    // Show the jumpscare overlay with animation
    this.jumpscareOverlay.classList.add('jumpscare-active');
    
    // Hide after 2 seconds (matching animation duration)
    this.activeJumpscareTimeout = setTimeout(() => {
      this.jumpscareOverlay.classList.remove('jumpscare-active');
      this.activeJumpscareTimeout = null;
    }, 2000); // 2 seconds duration
  }
  
  // Reveal hidden element with dramatic flash effect
  revealElementWithFlash(element, message = null, delay = 0) {
    if (!element) return;
    
    setTimeout(() => {
      // Sudden appearance
      element.style.display = 'block';
      element.style.opacity = '0';
      element.style.transform = 'scale(1.2)';
      element.style.color = 'rgba(255, 255, 255, 1.0)';
      element.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
      
      // Dramatic fade-in
      requestAnimationFrame(() => {
        element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        element.style.opacity = '1';
        element.style.transform = 'scale(1.0)';
        element.style.color = 'rgba(255, 200, 0, 0.9)';
        
        // Brief flash
        setTimeout(() => {
          element.style.textShadow = '0 0 8px rgba(255, 200, 0, 0.6)';
        }, 300);
      });
      
      // Optional message update
      if (message && element.textContent) {
        setTimeout(() => {
          element.style.color = 'rgba(255, 100, 100, 0.9)';
        }, 1000);
      }
    }, delay);
  }
  
  // Update footer attention value based on actual focus data
  updateFooterAttentionValue(focusData) {
    if (this.valueCounter && focusData.totaleFocusTijd) {
      // Convert milliseconds to credits (subtle monetization)
      const credits = (focusData.totaleFocusTijd / 1000 * 0.015).toFixed(2); // ~0.015 credits per second
      this.valueCounter.textContent = credits;
    }
  }
  
  // Flash existing element with warning
  flashElement(element, message = null) {
    if (!element) return;
    
    const originalColor = element.style.color;
    const originalShadow = element.style.textShadow;
    
    // Flash effect
    element.style.color = 'rgba(255, 50, 50, 1.0)';
    element.style.textShadow = '0 0 20px rgba(255, 50, 50, 1.0)';
    element.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      element.style.color = originalColor;
      element.style.textShadow = originalShadow;
      element.style.transform = 'scale(1.0)';
    }, 400);
  }
  
  // Publieke methoden voor externe controle
  krijgUIStatus() {
    return {
      isGereed: this.isUIGereed,
      huidigeStatus: this.huidigeStatus
    };
  }
  
  // NEW: Subtle attention tracking to update footer values
  startSubtleAttentionTracking() {
    let attentionValue = 0.0;
    
    // Gradually increase attention value when user is focused
    setInterval(() => {
      if (this.valueCounter) {
        // Increase value slightly when user is actively using the system
        if (document.hasFocus() && Math.random() < 0.7) {
          attentionValue += Math.random() * 0.02 + 0.01; // Small increments
        }
        
        this.valueCounter.textContent = attentionValue.toFixed(2);
      }
    }, 2000);
    
    // Occasionally update processing status
    const processingMessages = [
      '• Processing gaze patterns for optimization',
      '• Analyzing attention distribution',
      '• Evaluating focus quality metrics',
      '• Extracting engagement data',
      '• Calibrating attention algorithms'
    ];
    
    setInterval(() => {
      if (this.processingStatus && Math.random() < 0.3) {
        const message = processingMessages[Math.floor(Math.random() * processingMessages.length)];
        this.processingStatus.textContent = message;
      }
    }, 8000);
  }
}
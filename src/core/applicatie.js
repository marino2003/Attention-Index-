// Focus Tuin Applicatie - Core Logic
// Hoofdapplicatie klasse zonder UI afhankelijkheden

import { OogDetectie } from '../oogtracking/detectie.js'
import { OogKalibratie } from '../oogtracking/kalibratie.js'
import { PlantenGenerator } from '../tuin/planten.js'
import { VisueleEffecten } from '../tuin/visueel.js'
import { ASCIIKunst } from '../tuin/ascii_kunst.js'
import { AfleidingSysteem } from '../tuin/afleiding_systeem.js'
import { gebeurtenisManager } from './gebeurtenissen.js' // Use singleton instead of class
import { APPLICATIE_CONFIG } from './configuratie.js'
import { berekenTotaleSnelheid } from '../utils/math_utils.js';

export class FocusTuinApplicatie {
  constructor() {
    // Core systemen
    this.oogDetectie = new OogDetectie();
    this.kalibratie = null;
    this.plantenGenerator = null;
    this.visueleEffecten = new VisueleEffecten();
    this.asciiKunst = null; // Added ASCII art system
    this.afleidingSysteem = null; // Added distraction system
    this.gebeurtenisManager = gebeurtenisManager; // Use singleton instance
    
    // Applicatie staat
    this.isFocus = false;
    this.sessieZaad = Math.floor(Math.random() * 1000000);
    this.focusStartTijd = null;
    this.totaleFocusTijd = 0;
    this.isGeinitialiseerd = false;
    
    // Levens systeem
    this.levens = 2; // Gebruiker begint met 2 levens
    this.isDood = false; // Of de gebruiker "dood" is in de creatieve installatie
    
    // Visual feedback smoothing
    this.smoothedGazePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.gazeVelocity = { x: 0, y: 0 };
    this.lastGazeTime = Date.now();
    
    // P5.js instance
    this.p5Instantie = null;
  }
  
  async initialiseer() {

    // Generate a new seed for each session to ensure unique art
    this.sessieZaad = Math.floor(Math.random() * 1000000);

    
    try {
      // Initialiseer p5.js schets
      this.initialiseerP5Schets();
      
      // Initialiseer oogtracking
      await this.oogDetectie.initialiseerOogtracking();
      
      // Initialiseer kalibratie systeem
      this.kalibratie = new OogKalibratie(this.oogDetectie);
      
      // Initialiseer afleiding systeem
      this.afleidingSysteem = new AfleidingSysteem(this);
      
      // Setup gebeurtenis systeem
      this.setupGebeurtenisListeners();
      
      // Start groei monitoring
      this.startGroeiMonitoring();
      
      this.isGeinitialiseerd = true;
      this.gebeurtenisManager.verstuurGebeurtenis('applicatieGeinitialiseerd', { 
        sessieZaad: this.sessieZaad 
      });
      

      
    } catch (fout) {
      console.error('Applicatie initialisatie fout:', fout);
      throw fout;
    }
  }
  
  initialiseerP5Schets() {
    const schets = (p) => {
      let laatsteLogTijd = 0;
      
      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('p5-canvas-container');
        
        // Performance optimalisaties
        p.frameRate(APPLICATIE_CONFIG.performance.targetFPS);
        
        // Initialiseer modules
        this.plantenGenerator = new PlantenGenerator(this.sessieZaad);
        this.plantenGenerator.initialiseerTuin(p);
        this.visueleEffecten.initialiseer(p);
        this.asciiKunst = new ASCIIKunst(this.sessieZaad); // Initialiseer ASCII kunst
        this.asciiKunst.initialiseer(p); // Initialiseer met p5 instance
        

        
        // Verstuur gebeurtenis dat p5 gereed is
        this.gebeurtenisManager.verstuurGebeurtenis('p5Gereed', {
          canvasGrootte: { breedte: p.width, hoogte: p.height }
        });
      };
      
      p.draw = () => {
        const huidigeTijd = p.millis();
        const frameRate = p.frameRate();
        
        // Dynamic performance adjustment
        if (frameRate < 50) {
          if (huidigeTijd % 2 === 0) {
            this.visueleEffecten.tekenAchtergrond();
          }
        } else {
          this.visueleEffecten.tekenAchtergrond();
        }
        
        // Update and render ASCII art - continue rendering when out of focus to show blur effects
        if (this.oogDetectie.isGereed && !this.isDood) {
          // Pass gaze data to ASCII art system when available
          const gazeData = {
            x: this.smoothedGazePosition.x,
            y: this.smoothedGazePosition.y,
            timestamp: Date.now()
          };
          
          // Always update and render ASCII art, but pass focus state
          this.asciiKunst.update(this.isFocus, gazeData);
          this.asciiKunst.teken(); // Always render - blur effects applied in teken() when !zichtbaar
        } else if (this.asciiKunst) {
          // Fallback when eye tracking not ready
          this.asciiKunst.update(false);
        }
        
        // Update and render plants at 60fps
        this.plantenGenerator.updateGroei(this.isFocus);
        this.plantenGenerator.tekenTuin();
        
        // Only show visual effects when eye tracking is ready
        if (this.oogDetectie.isGereed) {
          // Update visual effects at consistent rate
          const huidigeGroeiFactor = this.plantenGenerator.krijgGroeiFactor();
          this.visueleEffecten.updateEffecten(this.isFocus, huidigeGroeiFactor);
          
          // Always draw focus zone without any frame rate limiting to prevent flickering
          this.visueleEffecten.tekenFocusZone();
        }
        
        // Render eye indicator
        if (this.oogDetectie.isGereed) {
          this.tekenOogIndicator(p);
        }
        
        // Performance monitoring
        if (huidigeTijd - laatsteLogTijd > APPLICATIE_CONFIG.performance.performanceLogInterval) {
          this.logPerformanceStatistieken(p);
          laatsteLogTijd = huidigeTijd;
        }
      };
      
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        
        // Update smoothed gaze position voor nieuwe schermgrootte
        this.smoothedGazePosition = { 
          x: p.windowWidth / 2, 
          y: p.windowHeight / 2 
        };
        
        // Herinitialiseer tuin alleen bij significante grootte verandering
        if (this.plantenGenerator && (p.width < 100 || p.height < 100)) {
          this.plantenGenerator.initialiseerTuin(p);
        }
        
        this.gebeurtenisManager.verstuurGebeurtenis('schermGrootteVeranderd', {
          nieuweGrootte: { breedte: p.width, hoogte: p.height }
        });
      };
    };
    
    this.p5Instantie = new p5(schets);
  }
  
  tekenOogIndicator(p) {
    const oogPositie = this.oogDetectie.huidigeOogPositie;
    if (oogPositie && oogPositie.x && oogPositie.y) {
      const centrumX = p.width / 2;
      const centrumY = p.height / 2;
      const afstand = p.dist(oogPositie.x, oogPositie.y, centrumX, centrumY);
      
      this.visueleEffecten.tekenOogIndicator(
        oogPositie, 
        afstand, 
        this.oogDetectie.nauwkeurigheidDrempel
      );
    }
  }
  
  logPerformanceStatistieken(p) {
    const huidigeGroeiFactor = this.plantenGenerator.krijgGroeiFactor();

  }
  
  setupGebeurtenisListeners() {
    // Luister naar oog focus gebeurtenissen
    document.addEventListener('oogFocusVeranderd', (event) => {
      const { isFocus, positie, afstand, nauwkeurigheid } = event.detail;
      this.verwerkFocusVerandering(isFocus, positie, afstand, nauwkeurigheid);
    });
    
    // Luister naar kalibratie gebeurtenissen
    document.addEventListener('kalibratieVoltooid', (event) => {
      const { nauwkeurigheid } = event.detail;

      
      this.gebeurtenisManager.verstuurGebeurtenis('kalibratieVoltooid', {
        nauwkeurigheid: nauwkeurigheid
      });
    });
  }
  
  verwerkFocusVerandering(isFocus, oogPositie, afstand, nauwkeurigheid) {
    const wasFocus = this.isFocus;
    this.isFocus = isFocus;
    
    // Update visuele oog indicator
    this.updateVisueleOogIndicator(oogPositie, isFocus, afstand);
    
    // Verstuur gebeurtenis bij focus verandering
    if (this.isFocus !== wasFocus) {
      if (this.isFocus) {
        this.focusStartTijd = Date.now();

        
        // Update distraction system with focus state
        if (this.afleidingSysteem) {
          this.afleidingSysteem.updateFocusStatus(true, Math.max(0, 1 - afstand / 100));
        }
        
        this.gebeurtenisManager.verstuurGebeurtenis('focusActief', {
          positie: oogPositie,
          afstand: afstand,
          nauwkeurigheid: nauwkeurigheid
        });
      } else {
        // Gebruiker heeft focus verloren - verlies een leven
        if (this.focusStartTijd) {
          this.totaleFocusTijd += Date.now() - this.focusStartTijd;
          this.focusStartTijd = null;
        }
        
        // Attention debt accrued - deduct engagement credit
        if (!this.isDood && this.levens > 0) {
          this.levens--;

          
          // Intensify distractions after life loss
          if (this.afleidingSysteem) {
            this.afleidingSysteem.verhoogAfleidingIntensiteit();
          }
          
          // Verstuur gebeurtenis voor UI update
          this.gebeurtenisManager.verstuurGebeurtenis('levenVerloren', {
            resterendeLevens: this.levens
          });
          
          // Als geen credits meer over zijn, markeer als dood
          if (this.levens <= 0) {
            this.isDood = true;

            
            // Verstuur gebeurtenis voor "dood" staat
            this.gebeurtenisManager.verstuurGebeurtenis('gebruikerDood', {
              totaleFocusTijd: this.totaleFocusTijd
            });
            
            // Dispatch a custom event for backwards compatibility
            document.dispatchEvent(new CustomEvent('gebruikerDood', {
              detail: {
                totaleFocusTijd: this.totaleFocusTijd
              }
            }));
          }
        }
        

        
        // Update distraction system when focus is lost
        if (this.afleidingSysteem) {
          this.afleidingSysteem.updateFocusStatus(false, 0);
        }
        
        this.gebeurtenisManager.verstuurGebeurtenis('focusVerloren', {
          totaleFocusTijd: this.totaleFocusTijd
        });
      }
    }
  }
  
  updateVisueleOogIndicator(oogPositie, isFocus, afstand) {
    if (!oogPositie) return;
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastGazeTime) / 1000.0;
    this.lastGazeTime = currentTime;
    
    let targetX = oogPositie.x;
    let targetY = oogPositie.y;
    
    // Focus zone snapping logica
    if (isFocus) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const horizontalDistance = Math.abs(targetX - centerX);
      const verticalDistance = Math.abs(targetY - centerY);
      
      const maxHorizontalSnapDistance = APPLICATIE_CONFIG.focus.horizontalSnapDistance;
      const maxVerticalSnapDistance = APPLICATIE_CONFIG.focus.verticalSnapDistance;
      
      // Horizontale snapping
      if (horizontalDistance < maxHorizontalSnapDistance) {
        const horizontalSnapStrength = 0.2 + (0.3 * (1 - horizontalDistance / maxHorizontalSnapDistance));
        targetX = centerX + (targetX - centerX) * (1 - horizontalSnapStrength);
      } else {
        const horizontalPullStrength = 0.05;
        targetX = centerX + (targetX - centerX) * (1 - horizontalPullStrength);
      }
      
      // Verticale snapping
      if (verticalDistance < maxVerticalSnapDistance) {
        const verticalSnapStrength = 0.25 + (0.35 * (1 - verticalDistance / maxVerticalSnapDistance));
        targetY = centerY + (targetY - centerY) * (1 - verticalSnapStrength);
      } else {
        const verticalPullStrength = 0.08;
        targetY = centerY + (targetY - centerY) * (1 - verticalPullStrength);
      }
    }
    
    // Adaptive smoothing berekening
    const speedX = Math.abs(targetX - this.smoothedGazePosition.x);
    const speedY = Math.abs(targetY - this.smoothedGazePosition.y);
    const totalSpeed = berekenTotaleSnelheid(speedX, speedY);
    
    let smoothingFactor;
    if (isFocus) {
      smoothingFactor = totalSpeed > 50 ? 0.3 : 0.6;
    } else {
      if (totalSpeed > 100) {
        smoothingFactor = 0.15;
      } else if (totalSpeed > 50) {
        smoothingFactor = 0.3;
      } else {
        smoothingFactor = 0.5;
      }
    }
    
    // Pas smoothing toe
    const lerpFactor = Math.min(1.0, smoothingFactor + deltaTime * 2);
    
    this.smoothedGazePosition.x += (targetX - this.smoothedGazePosition.x) * lerpFactor;
    this.smoothedGazePosition.y += (targetY - this.smoothedGazePosition.y) * lerpFactor;
    
    // Verstuur gebeurtenis voor UI update
    this.gebeurtenisManager.verstuurGebeurtenis('oogPositieUpdate', {
      positie: this.smoothedGazePosition,
      isFocus: isFocus,
      afstand: afstand
    });
  }
  
  startKalibratie() {
    if (this.kalibratie && this.oogDetectie.isGereed) {

      this.kalibratie.startKalibratie();
      return true;
    } else if (!this.oogDetectie.isGereed) {
      console.warn('Oogtracking nog niet gereed voor kalibratie');
      this.gebeurtenisManager.verstuurGebeurtenis('kalibratieNietGereed', {});
      return false;
    } else {
      console.error('Kalibratie systeem niet beschikbaar');
      return false;
    }
  }
  
  startGroeiMonitoring() {
    // Statistieken logging
    setInterval(() => {
      if (this.oogDetectie.isGereed && this.isFocus) {
        const huidigeSessieTijd = this.focusStartTijd ? 
          (Date.now() - this.focusStartTijd) / 1000 : 0;
        const totaalTijd = (this.totaleFocusTijd + (huidigeSessieTijd * 1000)) / 1000;
        
        if (huidigeSessieTijd > 0) {

        }
        
        // Dispatch event to update UI with focus time
        document.dispatchEvent(new CustomEvent('focusTimeUpdate', {
          detail: {
            totaleFocusTijd: totaalTijd,
            huidigeSessieTijd: huidigeSessieTijd
          }
        }));
      }
    }, APPLICATIE_CONFIG.monitoring.statistiekenInterval);
  }
  
  // Publieke methoden voor externe controle
  stopApplicatie() {
    this.oogDetectie.stopOogtracking();
    
    // Cleanup distraction system
    if (this.afleidingSysteem) {
      this.afleidingSysteem.cleanup();
      this.afleidingSysteem = null;
    }
    
    if (this.p5Instantie) {
      this.p5Instantie.remove();
    }
    this.gebeurtenisManager.verstuurGebeurtenis('applicatieGestopt', {});
  }
  
  // Methode voor het starten van de hoofdervaring
  startHoofdErvaring() {

    // De applicatie is al geïnitialiseerd, dus we hoeven niets speciaals te doen
    // De p5.js sketch draait al en de oogtracking is actief
    
    // Start the transition animation
    if (this.visueleEffecten) {
      this.visueleEffecten.startScreenTransition();
    }
  }
  
  // Methode om knipperbeweging te detecteren en door te geven aan ASCII kunst
  triggerBlink() {
    if (this.asciiKunst) {
      this.asciiKunst.triggerBlink();
    }
  }
  
  // Methode om de ASCII kunst te exporteren als text en CRT image
  exporteerASCIIKunst() {
    if (this.asciiKunst) {
      try {
        const textResult = this.asciiKunst.exporteerAlsText();
        const crtResult = this.asciiKunst.exporteerAlsCRT();

        return textResult && crtResult;
      } catch (error) {
        console.error('Fout bij exporteren van ASCII kunst:', error);
        return false;
      }
    } else {
      console.warn('ASCII kunst niet geïnitialiseerd voor export');
      return false;
    }
  }
  
  // Methode om focus tijd statistieken te verkrijgen
  krijgFocusStatistieken() {
    const huidigeSessieTijd = this.focusStartTijd ? 
      (Date.now() - this.focusStartTijd) / 1000 : 0;
    const totaalTijd = (this.totaleFocusTijd + (huidigeSessieTijd * 1000)) / 1000;
    
    return {
      totaleFocusTijd: totaalTijd,
      huidigeSessieTijd: huidigeSessieTijd,
      levens: this.levens,
      isDood: this.isDood
    };
  }
}
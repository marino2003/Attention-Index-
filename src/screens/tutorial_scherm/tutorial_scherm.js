// Tutorial Scherm voor Creative Installation
// Beheert het tutorial scherm met retro CRT esthetiek

import './tutorial_scherm.css';
import { gebeurtenisManager } from '../../core/gebeurtenissen.js';
import { audioManager } from '../../audio/audio_manager.js';

export class TutorialScherm {
  constructor() {
    this.isActief = false;
    this.containerElement = null;
    this.instructieDeel1 = null;
    this.instructieDeel2 = null;
    this.continueButton = null;
    this.loadingIndicator = null;
    
    // P5.js instance voor achtergrond
    this.p5Instance = null;
    
    // Animation state
    this.animatieFase = 0; // 0: initial, 1: part1, 2: part2, 3: complete
    this.loadingStartTime = null;
    
    // Event listeners voor cleanup
    this.toetsEventListener = null;
    this.klikEventListener = null;
    
    this.maakScherm();
  }

  maakScherm() {
    this.maakDOMStructuur();
    // P5.js wordt geinitialiseerd in toon() nadat DOM is toegevoegd
  }

  maakDOMStructuur() {
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'tutorial-scherm';
    
    // P5.js container
    this.p5Container = document.createElement('div');
    this.p5Container.className = 'tutorial-canvas';
    this.p5Container.id = 'tutorial-p5-container';
    
    // Instructie deel 1
    this.instructieDeel1 = document.createElement('div');
    this.instructieDeel1.className = 'instructie-deel-1';
    this.instructieDeel1.textContent = 'Focus op het punt in het midden';
    this.instructieDeel1.setAttribute('data-text', 'Focus op het punt in het midden');
    
    // Camera instructies
    this.cameraInstructies = document.createElement('div');
    this.cameraInstructies.className = 'camera-instructies';
    this.cameraInstructies.innerHTML = `
      <div class="camera-titel">Camera Positionering:</div>
      <div class="camera-tekst">• Zet je op ooghoogte met de camera</div>
      <div class="camera-tekst">• Plaats jezelf in het midden van het beeld</div>
    `;
    this.cameraInstructies.setAttribute('data-text', 'Camera Setup');
    
    // Instructie deel 2
    this.instructieDeel2 = document.createElement('div');
    this.instructieDeel2.className = 'instructie-deel-2';
    this.instructieDeel2.textContent = 'verlies geen focus';
    this.instructieDeel2.setAttribute('data-text', 'verlies geen focus');
    
    // Focus punt demonstratie
    this.focusPuntDemo = document.createElement('div');
    this.focusPuntDemo.className = 'focus-punt-demo';
    // Ensure initial blur is applied
    this.focusPuntDemo.style.filter = 'blur(8px)';
    
    // Loading indicator (hidden initially)
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'loading-indicator';
    this.loadingIndicator.textContent = 'Systeem laden';
    
    // Add loading dots element
    this.loadingDots = document.createElement('span');
    this.loadingDots.className = 'loading-dots';
    this.loadingIndicator.appendChild(this.loadingDots);
    
    this.loadingIndicator.style.opacity = '0';
    this.loadingIndicator.style.transform = 'translateY(20px)';
    
    // Continue button
    this.continueButton = document.createElement('div');
    this.continueButton.className = 'tutorial-continue';
    this.continueButton.textContent = 'Druk [SPATIE] om door te gaan';
    this.continueButton.style.opacity = '0';
    this.continueButton.style.transform = 'translateY(20px) scale(0.95)';
    
    this.containerElement.appendChild(this.p5Container);
    this.containerElement.appendChild(this.instructieDeel1);
    this.containerElement.appendChild(this.cameraInstructies);
    this.containerElement.appendChild(this.instructieDeel2);
    this.containerElement.appendChild(this.focusPuntDemo);
    this.containerElement.appendChild(this.loadingIndicator);
    this.containerElement.appendChild(this.continueButton);
  }

  initialiseerP5Achtergrond() {
    // Controleer of container element bestaat
    const container = document.getElementById('tutorial-p5-container');
    if (!container) {
      console.warn('Tutorial P5 container nog niet beschikbaar');
      return;
    }
    
    const schets = (p) => {
      let tijd = 0;
      
      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent('tutorial-p5-container');
        canvas.style('z-index', '1');
        canvas.style('position', 'absolute');
        canvas.style('top', '0');
        canvas.style('left', '0');
        
        p.frameRate(60);
      };
      
      p.draw = () => {
        tijd += 0.016;
        
        // Clear background
        p.clear();
        
        // Retro CRT effects matching start screen
        this.tekenCRTEffecten(p, tijd);
      };
      
      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    };
    
    this.p5Instance = new p5(schets);
  }
  
  tekenCRTEffecten(p, tijd) {
    // Clean background - just clear the canvas like start screen
    p.clear();
  }

  setupEventListeners() {
    this.toetsEventListener = (event) => {
      if (this.isActief && event.code === 'Space') {
        event.preventDefault();
        this.startHoofdErvaring();
      }
    };
    
    this.klikEventListener = () => {
      if (this.isActief) {
        this.startHoofdErvaring();
      }
    };
    
    document.addEventListener('keydown', this.toetsEventListener);
    this.continueButton.addEventListener('click', this.klikEventListener);
  }

  verwijderEventListeners() {
    if (this.toetsEventListener) {
      document.removeEventListener('keydown', this.toetsEventListener);
      this.toetsEventListener = null;
    }
    if (this.klikEventListener && this.continueButton) {
      this.continueButton.removeEventListener('click', this.klikEventListener);
      this.klikEventListener = null;
    }
  }

  async toon() {
    document.body.appendChild(this.containerElement);
    this.isActief = true;
    
    // Wacht even om zeker te zijn dat DOM element beschikbaar is
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Nu P5.js initialiseren nadat DOM element bestaat
    this.initialiseerP5Achtergrond();
    
    this.setupEventListeners();
    
    requestAnimationFrame(() => {
      this.containerElement.classList.add('zichtbaar');
      this.startAnimatieSequentie();
    });
  }

  startAnimatieSequentie() {
    // Start animation sequence
    this.animatieFase = 1;
    
    // Show first part after container is visible
    setTimeout(() => {
      this.instructieDeel1.classList.add('zichtbaar');
    }, 600);
    
    // Show camera instructions with elegant timing
    setTimeout(() => {
      this.cameraInstructies.classList.add('zichtbaar');
    }, 2000);
    
    // Cool transition effect and show second part
    setTimeout(() => {
      this.animatieFase = 2;
      this.instructieDeel2.classList.add('zichtbaar');
    }, 3200);
    
    // Show focus demo
    setTimeout(() => {
      this.focusPuntDemo.classList.add('zichtbaar');
    }, 4000);
    
    // Start loading eye tracking system
    setTimeout(() => {
      this.startLoadingSequence();
    }, 6000);
  }
  
  startLoadingSequence() {
    // Animate in loading indicator smoothly
    this.animateElementIn(this.loadingIndicator, () => {
      // Simulate/check eye tracking system loading
      this.checkEyeTrackingReady();
    });
  }
  
  checkEyeTrackingReady() {
    // Check if eye tracking system is ready
    // This can be expanded to actually check the backend status
    this.loadingStartTime = Date.now();
    
    const checkInterval = setInterval(() => {
      // Simulate loading time or check actual system readiness
      // For now, simulate 2-3 seconds loading time
      const loadingTime = Date.now() - this.loadingStartTime;
      
      if (loadingTime > 2500) {
        // Loading complete
        clearInterval(checkInterval);
        this.onLoadingComplete();
      }
    }, 100);
  }
  
  onLoadingComplete() {
    // Keep loading indicator visible for 1 second before transitioning
    setTimeout(() => {
      // Animate out loading indicator smoothly
      this.animateElementOut(this.loadingIndicator, () => {
        // Small delay before showing button
        setTimeout(() => {
          this.animatieFase = 3;
          // Animate in continue button smoothly
          this.animateElementIn(this.continueButton);
        }, 300);
      });
    }, 1000); // Keep loading text visible for 1 second
  }

  // Helper function to animate elements in smoothly
  animateElementIn(element, callback) {
    // Reset any existing animations
    element.style.transition = 'none';
    element.offsetHeight; // Trigger reflow
    
    // Apply transition
    element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    
    // Small delay to ensure transition is applied
    setTimeout(() => {
      element.style.opacity = '0.8';
      element.style.transform = 'translateY(0)';
      
      if (callback) {
        setTimeout(callback, 800); // Match transition duration
      }
    }, 10);
  }

  // Helper function to animate elements out smoothly
  animateElementOut(element, callback) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    if (callback) {
      setTimeout(callback, 800); // Match transition duration
    }
  }

  startHoofdErvaring() {
    if (!this.isActief || this.animatieFase < 3) return;
    
    console.log('Tutorial voltooid, start hoofdervaring...');
    
    // Fade out boot sound smoothly
    audioManager.fadeOutBootSound(800);
    
    // Add smooth transition effect
    this.containerElement.classList.add('transitioning');
    
    // Add a visual effect to indicate transition
    if (this.continueButton) {
      this.continueButton.textContent = 'Starten...';
      this.continueButton.style.opacity = '0.5';
    }
    
    // Dispatch event after transition starts - reduced timing for smoother transition
    setTimeout(() => {
      try {
        gebeurtenisManager.verstuurGebeurtenis('tutorialSchermVoltooid', {
          gebruikersInput: 'voltooid',
          tijdstempel: Date.now()
        });
        console.log('tutorialSchermVoltooid event verzonden');
      } catch (error) {
        console.error('Fout bij verzenden van tutorialSchermVoltooid event:', error);
      }
      
      // Call verberg with a shorter delay for smoother transition
      setTimeout(() => {
        this.verberg();
      }, 100);
    }, 300); // Reduced from 600 to 300ms
  }

  async verberg() {
    this.isActief = false;
    this.verwijderEventListeners();
    
    // Stop p5.js instance
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
    
    // Wait for transition to complete - reduced from 1500 to 800ms for smoother transition
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }
  }

  isZichtbaar() {
    return this.isActief;
  }
}
// Start Scherm voor Creative Installation
// Beheert het welkom scherm met retro CRT esthetiek

import './start_scherm.css';
import { gebeurtenisManager } from '../core/gebeurtenissen.js';
import { FOCUS_ZONE_CONFIG } from '../core/focus_zone_config.js';
import { audioManager } from '../audio/audio_manager.js';

export class StartScherm {
  constructor() {
    this.isActief = false;
    this.containerElement = null;
    this.titelElement = null;
    this.instructieElement = null;
    
    // P5.js instance voor achtergrond
    this.p5Instance = null;
    
    // Event listeners voor cleanup
    this.toetsEventListener = null;
    
    this.maakScherm();
  }

  maakScherm() {
    this.maakDOMStructuur();
    this.initialiseerP5Achtergrond();
  }

  maakDOMStructuur() {
    this.containerElement = document.createElement('div');
    this.containerElement.className = 'start-scherm';
    
    // P5.js container
    this.p5Container = document.createElement('div');
    this.p5Container.className = 'start-canvas';
    this.p5Container.id = 'start-p5-container';
    
    this.titelElement = document.createElement('h1');
    this.titelElement.className = 'start-titel';
    this.titelElement.textContent = 'ATTENTION INDEX™';
    
    this.instructieElement = document.createElement('div');
    this.instructieElement.className = 'start-instructie';
    this.instructieElement.textContent = 'Druk [SPATIE] om te beginnen';
    
    this.containerElement.appendChild(this.p5Container);
    this.containerElement.appendChild(this.titelElement);
    this.containerElement.appendChild(this.instructieElement);
  }

  initialiseerP5Achtergrond() {
    const schets = (p) => {
      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent('start-p5-container');
        canvas.style('z-index', '1');
        canvas.style('position', 'absolute');
        canvas.style('top', '0');
        canvas.style('left', '0');
        
        p.frameRate(60);
      };
      
      p.draw = () => {
        this.tekenAchtergrond(p);
      };
      
      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    };
    
    this.p5Instance = new p5(schets);
  }

  tekenAchtergrond(p) {
    // Clean background - just clear the canvas
    p.clear();
  }
  


  setupEventListeners() {
    this.toetsEventListener = (event) => {
      if (this.isActief && event.code === 'Space') {
        event.preventDefault();
        this.startInstallatie();
      }
    };
    
    // Add click listener to instruction button
    this.klikEventListener = () => {
      if (this.isActief) {
        this.startInstallatie();
      }
    };
    
    document.addEventListener('keydown', this.toetsEventListener);
    this.instructieElement.addEventListener('click', this.klikEventListener);
  }

  verwijderEventListeners() {
    if (this.toetsEventListener) {
      document.removeEventListener('keydown', this.toetsEventListener);
      this.toetsEventListener = null;
    }
    if (this.klikEventListener && this.instructieElement) {
      this.instructieElement.removeEventListener('click', this.klikEventListener);
      this.klikEventListener = null;
    }
  }

  async toon() {
    document.body.appendChild(this.containerElement);
    this.isActief = true;
    this.setupEventListeners();
    
    requestAnimationFrame(() => {
      this.containerElement.classList.add('zichtbaar');
    });
  }











  startInstallatie() {
    if (!this.isActief) return;
    
    // Play boot sound when user interacts (after user input)
    audioManager.playBootSound();
    
    // Add seamless transition effect
    this.containerElement.classList.add('transitioning');
    
    // Dispatch event after transition starts
    setTimeout(() => {
      gebeurtenisManager.verstuurGebeurtenis('startSchermVoltooid', {
        gebruikersInput: 'gestart',
        tijdstempel: Date.now()
      });
      
      this.verberg();
    }, 200); // Small delay to let transition begin
  }

  async verberg() {
    this.isActief = false;
    this.verwijderEventListeners();
    
    // Stop p5.js instance
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
    
    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }
  }

  isZichtbaar() {
    return this.isActief;
  }
}
// Scherm Flow Manager voor Creative Installatie
// Beheert overgangen tussen verschillende schermen

import { gebeurtenisManager } from '../core/gebeurtenissen.js';
import { StartScherm } from './start_scherm.js';
import { TutorialScherm } from './tutorial_scherm/tutorial_scherm.js';

export class SchermFlowManager {
  constructor() {
    // Scherm staten
    this.huidigeScherm = null;
    this.beschikbareSchermen = new Map();
    this.schermGeschiedenis = [];
    this.isInTransitie = false;
    
    // Scherm instanties
    this.startScherm = null;
    
    // Hoofdapplicatie referentie (wordt later gezet)
    this.hoofdApplicatie = null;
    
    this.initialiseerSchermen();
    this.setupGebeurtenisListeners();
    
    // Make this instance available globally for debugging
    window.schermFlowManager = this;
  }
  
  initialiseerSchermen() {
    // Registreer beschikbare schermen
    this.beschikbareSchermen.set('start', {
      naam: 'start',
      klasse: StartScherm,
      instantie: null,
      isGeinitialiseerd: false
    });
    
    this.beschikbareSchermen.set('tutorial', {
      naam: 'tutorial',
      klasse: TutorialScherm,
      instantie: null,
      isGeinitialiseerd: false
    });
    
    // Voeg meer schermen toe naarmate ze ontwikkeld worden
    this.beschikbareSchermen.set('hoofdErvaring', {
      naam: 'hoofdErvaring',
      klasse: null, // Geen aparte klasse - wordt afgehandeld door hoofdapplicatie
      instantie: null,
      isGeinitialiseerd: false
    });
  }
  
  setupGebeurtenisListeners() {
    // Luister naar scherm-specifieke gebeurtenissen
    gebeurtenisManager.voegListenerToe('startSchermVoltooid', (data) => {
      console.log('ontvangst startSchermVoltooid event in SchermFlowManager', data);
      this.gaNaarScherm('tutorial');
    });
    
    gebeurtenisManager.voegListenerToe('tutorialSchermVoltooid', (data) => {
      console.log('ontvangst tutorialSchermVoltooid event in SchermFlowManager', data);
      this.gaNaarScherm('hoofdErvaring');
    });
    
    // Luister naar applicatie gebeurtenissen
    gebeurtenisManager.voegListenerToe('applicatieGereed', (data) => {
      // Als applicatie klaar is, maar we zijn nog op start scherm
      if (this.huidigeScherm === 'start') {
        // Niets doen - wacht op gebruikers input
      }
    });
    
    // Luister naar reset verzoeken
    gebeurtenisManager.voegListenerToe('resetNaarStart', () => {
      this.gaNaarScherm('start');
    });
  }
  
  setHoofdApplicatie(applicatie) {
    this.hoofdApplicatie = applicatie;
  }
  
  async startFlow() {
    console.log('START FLOW - Ensuring fresh start from beginning');
    
    // Clear any existing flow state to ensure fresh start
    this.huidigeScherm = null;
    this.schermGeschiedenis = [];
    this.isInTransitie = false;
    
    // Begin altijd met start scherm - guaranteed fresh start
    await this.gaNaarScherm('start');
  }
  
  async gaNaarScherm(schermNaam, opties = {}) {
    if (this.isInTransitie) {
      console.warn('Scherm transitie al bezig, negeer verzoek voor:', schermNaam);
      return false;
    }
    
    if (!this.beschikbareSchermen.has(schermNaam)) {
      console.error('Onbekend scherm:', schermNaam);
      return false;
    }
    
    console.log(`🔄 NAVIGATIE van ${this.huidigeScherm || 'geen'} naar ${schermNaam}`);
    
    this.isInTransitie = true;
    
    try {
      // Verberg huidig scherm
      await this.verbergHuidigScherm();
      
      // Update geschiedenis
      if (this.huidigeScherm) {
        this.schermGeschiedenis.push(this.huidigeScherm);
      }
      
      // Toon nieuw scherm
      await this.toonScherm(schermNaam, opties);
      
      this.huidigeScherm = schermNaam;
      
      // Verstuur gebeurtenis
      gebeurtenisManager.verstuurGebeurtenis('schermWijziging', {
        vanScherm: this.schermGeschiedenis[this.schermGeschiedenis.length - 1] || null,
        naarScherm: schermNaam,
        opties: opties
      });
      
      console.log('NAVIGATIE VOLTOOID naar', schermNaam);
      return true;
      
    } catch (error) {
      console.error('Fout bij scherm transitie:', error);
      return false;
    } finally {
      this.isInTransitie = false;
    }
  }
  
  async verbergHuidigScherm() {
    if (!this.huidigeScherm) return;
    
    const schermInfo = this.beschikbareSchermen.get(this.huidigeScherm);
    if (schermInfo && schermInfo.instantie) {
      // Verberg scherm indien mogelijk
      if (typeof schermInfo.instantie.verberg === 'function') {
        await schermInfo.instantie.verberg();
      }
    }
  }
  
  async toonScherm(schermNaam, opties = {}) {
    const schermInfo = this.beschikbareSchermen.get(schermNaam);
    
    if (!schermInfo) {
      throw new Error(`Scherm niet gevonden: ${schermNaam}`);
    }
    
    // Maak instantie als deze nog niet bestaat
    if (!schermInfo.instantie) {
      if (schermNaam === 'start') {
        schermInfo.instantie = new StartScherm();
      } else if (schermNaam === 'tutorial') {
        schermInfo.instantie = new TutorialScherm();
      } else if (schermNaam === 'hoofdErvaring') {
        // Start hoofdapplicatie - dit zal de bestaande FocusTuin logica zijn
        return await this.startHoofdApplicatie(opties);
      }
      // Voeg meer schermen toe naarmate ontwikkeld
      
      schermInfo.isGeinitialiseerd = true;
    }
    
    // Toon scherm
    if (schermInfo.instantie && typeof schermInfo.instantie.toon === 'function') {
      await schermInfo.instantie.toon(opties);
    }
  }
  
  async startHoofdApplicatie(opties = {}) {
    // Dit zal de bestaande applicatie starten
    if (this.hoofdApplicatie) {
      // Verberg alle scherm UI elementen
      await this.verbergAlleSchermElementen();
      
      // Reduced delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start de hoofdapplicatie (oogtracking, p5.js, etc.)
      if (typeof this.hoofdApplicatie.startHoofdErvaring === 'function') {
        await this.hoofdApplicatie.startHoofdErvaring();
      }
      
      // Toon de normale UI elementen
      this.toonHoofdApplicatieUI();
      return true;
    }
    return false;
  }
  
  async verbergAlleSchermElementen() {
    // Zorgt ervoor dat alle scherm-gerelateerde UI verborgen wordt
    const startElementen = document.querySelectorAll('.start-scherm, .tutorial-scherm');
    startElementen.forEach(element => {
      element.style.opacity = '0';
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 600); // Reduced from 800 to 600ms
    });
  }
  
  toonHoofdApplicatieUI() {
    // Keep UI hidden for clean installation experience during transitions
    const installatieUI = document.getElementById('installation-ui');
    const installatieContainer = document.getElementById('installation-container');
    const p5CanvasContainer = document.getElementById('p5-canvas-container');
    
    // Show main application UI after transition is complete
    setTimeout(() => {
      if (installatieUI) {
        installatieUI.style.display = 'block';
        installatieUI.style.opacity = '1';
      }
      
      if (installatieContainer) {
        installatieContainer.style.opacity = '1';
        installatieContainer.style.display = 'block';
        installatieContainer.classList.add('active'); // Show with CSS transition
      }
      
      if (p5CanvasContainer) {
        p5CanvasContainer.classList.add('active'); // Show P5.js canvas
      }
    }, 600); // Reduced delay to ensure tutorial transition completes
  }
  
  gaTerug() {
    if (this.schermGeschiedenis.length > 0) {
      const vorigScherm = this.schermGeschiedenis.pop();
      this.gaNaarScherm(vorigScherm);
      return true;
    }
    return false;
  }
  
  krijgHuidigScherm() {
    return this.huidigeScherm;
  }
  
  krijgSchermGeschiedenis() {
    return [...this.schermGeschiedenis];
  }
  
  isSchermActief(schermNaam) {
    return this.huidigeScherm === schermNaam;
  }
  
  resetFlow() {
    // Reset naar start scherm
    this.schermGeschiedenis = [];
    this.gaNaarScherm('start');
  }
  
  // Debug method to skip directly to eye tracking
  async skipToEyeTracking() {
    console.log('Debug: Skipping directly to eye tracking screen...');
    return await this.gaNaarScherm('hoofdErvaring');
  }
}

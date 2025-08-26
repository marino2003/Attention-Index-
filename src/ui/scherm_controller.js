


import { gebeurtenisManager } from '../core/gebeurtenissen.js';
import { APPLICATIE_CONFIG } from '../core/configuratie.js';

export class SchermController {
  constructor() {
    
    this.huidigeScherm = 'laden';
    this.beschikbareSchermen = [
      'laden',      
      'gereed',     
      'kalibratie', 
      'actief',     
      'gepauzeerd', 
      'fout'        
    ];
    
    
    this.isInTransitie = false;
    this.transitieTimeout = null;
    
    
    this.containerElement = null;
    this.setupSchermContainer();
    this.setupGebeurtenisListeners();
  }
  
  setupSchermContainer() {
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialiseerContainer());
    } else {
      this.initialiseerContainer();
    }
  }
  
  initialiseerContainer() {
    this.containerElement = document.getElementById('installation-container');
    
    if (!this.containerElement) {
      console.error('Installation container niet gevonden');
      return;
    }
    
    
    this.containerElement.classList.add('scherm-container');
    this.updateSchermKlassen();
    
    console.log('Scherm Controller geinitialiseerd');
  }
  
  setupGebeurtenisListeners() {
    
    gebeurtenisManager.luisterNaarApplicatieStatus((data) => {
      this.handleApplicatieStatusWijziging(data);
    });
    
    
    gebeurtenisManager.luisterNaarFocusVerandering((data) => {
      this.handleFocusWijziging(data);
    });
    
    
    document.addEventListener('kalibratieGestart', () => {
      this.wisseltNaarScherm('kalibratie');
    });
    
    document.addEventListener('kalibratieVoltooid', () => {
      this.wisseltNaarScherm('actief');
    });
    
    document.addEventListener('kalibratieGestopt', () => {
      this.wisseltNaarScherm('gereed');
    });
    
    
    document.addEventListener('kritiekeFout', (event) => {
      this.handleKritiekeFout(event.detail);
    });
    
    
    window.addEventListener('resize', () => {
      this.handleSchermGrootteWijziging();
    });
  }
  
  handleApplicatieStatusWijziging(data) {
    switch (data.gebeurtenisNaam || 'onbekend') {
      case 'applicatieGeinitialiseerd':
        this.wisseltNaarScherm('gereed');
        break;
        
      case 'applicatieGepauzeerd':
        this.wisseltNaarScherm('gepauzeerd');
        break;
        
      case 'applicatieHervat':
        this.wisseltNaarScherm('actief');
        break;
        
      case 'applicatieGestopt':
        this.wisseltNaarScherm('laden');
        break;
    }
  }
  
  handleFocusWijziging(data) {
    if (!this.containerElement) return;
    
    if (data.gebeurtenisNaam === 'focusActief') {
      this.containerElement.classList.add('focus-actief');
      this.voegVisueleAccent('focus-start');
      
    } else if (data.gebeurtenisNaam === 'focusVerloren') {
      this.containerElement.classList.remove('focus-actief');
      this.voegVisueleAccent('focus-stop');
    }
  }
  
  handleKritiekeFout(foutData) {
    console.error('Kritieke fout ontvangen:', foutData);
    this.wisseltNaarScherm('fout', { foutInfo: foutData });
  }
  
  handleSchermGrootteWijziging() {
    
    clearTimeout(this.transitieTimeout);
    this.transitieTimeout = setTimeout(() => {
      gebeurtenisManager.verstuurGebeurtenis('schermGrootteWijziging', {
        breedte: window.innerWidth,
        hoogte: window.innerHeight
      });
    }, 300);
  }
  
  wisseltNaarScherm(nieuwScherm, opties = {}) {
    if (!this.beschikbareSchermen.includes(nieuwScherm)) {
      console.warn(`Onbekend scherm: ${nieuwScherm}`);
      return false;
    }
    
    if (this.isInTransitie) {
      console.warn('Scherm transitie al bezig, wacht...');
      return false;
    }
    
    if (this.huidigeScherm === nieuwScherm) {
      console.log(`Al op scherm: ${nieuwScherm}`);
      return true;
    }
    
    console.log(`Scherm transitie: ${this.huidigeScherm} → ${nieuwScherm}`);
    
    const oudeScherm = this.huidigeScherm;
    this.huidigeScherm = nieuwScherm;
    this.isInTransitie = true;
    
    
    this.voerSchermTransitieUit(oudeScherm, nieuwScherm, opties)
      .then(() => {
        this.isInTransitie = false;
        console.log(`Scherm transitie voltooid: ${nieuwScherm}`);
        
        
        gebeurtenisManager.verstuurGebeurtenis('schermGewijzigd', {
          oudScherm: oudeScherm,
          nieuwScherm: nieuwScherm,
          opties: opties
        });
      })
      .catch((fout) => {
        console.error('Scherm transitie fout:', fout);
        this.isInTransitie = false;
      });
    
    return true;
  }
  
  async voerSchermTransitieUit(oudeScherm, nieuwScherm, opties) {
    if (!this.containerElement) return;
    
    
    this.containerElement.classList.add('transitie-bezig');
    
    
    await this.fadeOut(APPLICATIE_CONFIG.ui.animatieDuration / 2);
    
    
    this.updateSchermKlassen();
    
    
    await this.setupSchermSpecifiekeElementen(nieuwScherm, opties);
    
    
    await this.fadeIn(APPLICATIE_CONFIG.ui.animatieDuration / 2);
    
    
    this.containerElement.classList.remove('transitie-bezig');
  }
  
  async fadeOut(duur) {
    return new Promise((resolve) => {
      if (!this.containerElement) {
        resolve();
        return;
      }
      
      this.containerElement.style.transition = `opacity ${duur}ms ease`;
      this.containerElement.style.opacity = '0.7';
      
      setTimeout(resolve, duur);
    });
  }
  
  async fadeIn(duur) {
    return new Promise((resolve) => {
      if (!this.containerElement) {
        resolve();
        return;
      }
      
      this.containerElement.style.opacity = '1';
      
      setTimeout(() => {
        this.containerElement.style.transition = '';
        resolve();
      }, duur);
    });
  }
  
  updateSchermKlassen() {
    if (!this.containerElement) return;
    
    
    this.beschikbareSchermen.forEach(scherm => {
      this.containerElement.classList.remove(`scherm-${scherm}`);
    });
    
    
    this.containerElement.classList.add(`scherm-${this.huidigeScherm}`);
  }
  
  async setupSchermSpecifiekeElementen(scherm, opties) {
    switch (scherm) {
      case 'laden':
        await this.setupLaadScherm();
        break;
        
      case 'gereed':
        await this.setupGereedScherm();
        break;
        
      case 'kalibratie':
        await this.setupKalibratieScherm(opties);
        break;
        
      case 'actief':
        await this.setupActiefScherm();
        break;
        
      case 'gepauzeerd':
        await this.setupGepauzeerdeScherm();
        break;
        
      case 'fout':
        await this.setupFoutScherm(opties);
        break;
    }
  }
  
  async setupLaadScherm() {
    
    const focusPunt = document.getElementById('focus-point');
    if (focusPunt) {
      focusPunt.style.opacity = '0.3';
    }
  }
  
  async setupGereedScherm() {
    
    const focusPunt = document.getElementById('focus-point');
    if (focusPunt) {
      focusPunt.style.opacity = '1';
    }
  }
  
  async setupKalibratieScherm(opties) {
    
    if (this.containerElement) {
      this.containerElement.classList.add('kalibratie-modus');
    }
  }
  
  async setupActiefScherm() {
    
    if (this.containerElement) {
      this.containerElement.classList.remove('kalibratie-modus');
    }
  }
  
  async setupGepauzeerdeScherm() {
    
    console.log('Setup gepauzeerd scherm');
  }
  
  async setupFoutScherm(opties) {
    
    console.error('Setup fout scherm:', opties.foutInfo);
  }
  
  voegVisueleAccent(accentType, duur = 1000) {
    if (!this.containerElement) return;
    
    const accentKlasse = `accent-${accentType}`;
    this.containerElement.classList.add(accentKlasse);
    
    setTimeout(() => {
      this.containerElement.classList.remove(accentKlasse);
    }, duur);
  }
  
  krijgHuidigScherm() {
    return this.huidigeScherm;
  }
  
  isSchermBeschikbaar(scherm) {
    return this.beschikbareSchermen.includes(scherm);
  }
  
  krijgSchermStatus() {
    return {
      huidigeScherm: this.huidigeScherm,
      isInTransitie: this.isInTransitie,
      beschikbareSchermen: [...this.beschikbareSchermen]
    };
  }
}
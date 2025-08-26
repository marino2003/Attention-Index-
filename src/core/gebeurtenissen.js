// Gebeurtenis systeem voor Focus Tuin
// Centrale gebeurtenis afhandeling tussen modules

export class GebeurtenisManager {
  constructor() {
    this.gebeurtenisListeners = new Map();
    this.debugModus = false;
  }
  
  // Registreer een gebeurtenis listener
  voegListenerToe(gebeurtenisNaam, callback, context = null) {
    if (!this.gebeurtenisListeners.has(gebeurtenisNaam)) {
      this.gebeurtenisListeners.set(gebeurtenisNaam, []);
    }
    
    this.gebeurtenisListeners.get(gebeurtenisNaam).push({
      callback: callback,
      context: context
    });
  }
  
  // Verwijder een gebeurtenis listener
  verwijderListener(gebeurtenisNaam, callback) {
    if (!this.gebeurtenisListeners.has(gebeurtenisNaam)) {
      return false;
    }
    
    const listeners = this.gebeurtenisListeners.get(gebeurtenisNaam);
    const index = listeners.findIndex(listener => listener.callback === callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      if (listeners.length === 0) {
        this.gebeurtenisListeners.delete(gebeurtenisNaam);
      }
      
      return true;
    }
    
    return false;
  }
  
  // Verstuur een gebeurtenis
  verstuurGebeurtenis(gebeurtenisNaam, data = {}) {
    // Verstuur via custom DOM event voor backwards compatibility
    const customEvent = new CustomEvent(gebeurtenisNaam, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    
    document.dispatchEvent(customEvent);
    
    // Verstuur naar interne listeners
    if (this.gebeurtenisListeners.has(gebeurtenisNaam)) {
      const listeners = this.gebeurtenisListeners.get(gebeurtenisNaam);
      
      listeners.forEach(({ callback, context }) => {
        try {
          if (context) {
            callback.call(context, data);
          } else {
            callback(data);
          }
        } catch (fout) {
          console.error(`Fout in gebeurtenis listener voor ${gebeurtenisNaam}:`, fout);
        }
      });
    }
  }
  
  // Schakel debug modus in/uit
  setDebugModus(enabled) {
    this.debugModus = enabled;
  }
  
  // Helper methoden voor veel gebruikte gebeurtenissen
  luisterNaarFocusVerandering(callback, context = null) {
    this.voegListenerToe('focusActief', callback, context);
    this.voegListenerToe('focusVerloren', callback, context);
  }
  
  luisterNaarOogPositie(callback, context = null) {
    this.voegListenerToe('oogPositieUpdate', callback, context);
  }
  
  luisterNaarKalibratie(callback, context = null) {
    this.voegListenerToe('kalibratieVoltooid', callback, context);
    this.voegListenerToe('kalibratieNietGereed', callback, context);
  }
  
  luisterNaarApplicatieStatus(callback, context = null) {
    this.voegListenerToe('applicatieGeinitialiseerd', callback, context);
    this.voegListenerToe('applicatieGepauzeerd', callback, context);
    this.voegListenerToe('applicatieHervat', callback, context);
    this.voegListenerToe('applicatieGestopt', callback, context);
  }
}

// Singleton instance voor globaal gebruik
export const gebeurtenisManager = new GebeurtenisManager();
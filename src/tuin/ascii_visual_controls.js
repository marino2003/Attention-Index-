// ASCII Visual Controls - Enable/disable effects en performance instellingen
// Centraal beheersysteem voor alle ASCII visuele effecten

export const ASCIIVisualControls = {
  // Effect toggles - schakel individuele effecten in/uit
  effecten: {
    basis: true,           // Basis webcam ASCII rendering
    focus: false,           // Gaze focus effecten
    evolutie: false,       // Evolutie effecten (performance impact)
    blink: false,           // Blink ripple effecten
    neuralLijnen: false,   // Neural line drawing (performance impact)
    organischeGroei: false // Organische groei patronen (performance impact)
  },
  
  // Performance instellingen voor vlotte weergave
  performance: {
    // Frame rate instellingen
    asciiUpdateFrequentie: 4,    // Elke 4 frames (verhoogd van 3 voor performance)
    effectUpdateFrequentie: 6,   // Effecten nog minder frequent
    
    // Processing optimalisaties
    skipRows: 1,                 // Skip elke N rijen voor effecten
    skipColumns: 1,              // Skip elke N kolommen voor effecten
    maxEffectRadius: 6,          // Kleiner effect radius voor performance
    
    // Buffer optimalisaties
    useDoubleBuffering: true,    // Voorkom flickering
    batchEffectUpdates: true,    // Batch effect berekeningen
    
    // Detailed ASCII optimalisaties
    charRenderOptimization: true, // Optimaliseer character rendering
    reduceTextShadows: true      // Minimaliseer text shadows voor performance
  },
  
  // Effect intensiteit controls
  intensiteit: {
    focusEffect: 0.3,     // Verlaagd voor performance
    blinkEffect: 0.5,     // Blink intensiteit
    evolutieKans: 0.05,   // Verlaagd voor performance
    neuralLijnKans: 0.0   // Verlaagd voor performance
  },
  
  // Debug en monitoring
  debug: {
    toonFPS: false,
    toonEffectStats: false,
    logPerformance: true  // Temporarily enabled for debugging
  },
  
  // Helper methods voor easy toggles
  schakelAlleEffectenUit() {
    Object.keys(this.effecten).forEach(key => {
      if (key !== 'basis') { // Houd basis altijd aan
        this.effecten[key] = false;
      }
    });
    console.log('Alle effecten uitgeschakeld behalve basis');
  },
  
  schakelAlleEffectenAan() {
    Object.keys(this.effecten).forEach(key => {
      this.effecten[key] = true;
    });
    console.log('Alle effecten ingeschakeld');
  },
  
  setPerformanceModus(modus) {
    switch(modus) {
      case 'hoog': // Maximum kwaliteit
        this.performance.asciiUpdateFrequentie = 3;
        this.performance.effectUpdateFrequentie = 4;
        this.performance.skipRows = 0;
        this.performance.skipColumns = 0;
        this.performance.maxEffectRadius = 8;
        break;
        
      case 'normaal': // Gebalanceerd
        this.performance.asciiUpdateFrequentie = 4;
        this.performance.effectUpdateFrequentie = 6;
        this.performance.skipRows = 1;
        this.performance.skipColumns = 1;
        this.performance.maxEffectRadius = 6;
        break;
        
      case 'performance': // Maximum snelheid
        this.performance.asciiUpdateFrequentie = 6;
        this.performance.effectUpdateFrequentie = 8;
        this.performance.skipRows = 2;
        this.performance.skipColumns = 2;
        this.performance.maxEffectRadius = 4;
        this.schakelAlleEffectenUit();
        this.effecten.focus = true; // Houd alleen basis + focus
        break;
    }
    console.log(`Performance modus ingesteld: ${modus}`);
  },
  
  // Krijg huidige instellingen voor UI
  getControls() {
    return {
      effecten: { ...this.effecten },
      performance: { ...this.performance },
      intensiteit: { ...this.intensiteit }
    };
  },
  
  // Update instellingen vanuit UI
  updateControls(nieuweInstellingen) {
    if (nieuweInstellingen.effecten) {
      Object.assign(this.effecten, nieuweInstellingen.effecten);
    }
    if (nieuweInstellingen.performance) {
      Object.assign(this.performance, nieuweInstellingen.performance);
    }
    if (nieuweInstellingen.intensiteit) {
      Object.assign(this.intensiteit, nieuweInstellingen.intensiteit);
    }
    console.log('Visual controls bijgewerkt');
  }
};

// Start in gebalanceerde modus voor goede performance met detail
ASCIIVisualControls.setPerformanceModus('normaal');
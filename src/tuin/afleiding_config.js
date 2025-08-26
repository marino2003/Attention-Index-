// Afleiding Configuratie - Balans tussen spanning en gebruikservaring
// Instellingen om distractie mechanismen te fine-tunen

export const AfleidingConfig = {
  // Basis intensiteit instellingen
  intensiteit: {
    // Algemene multipiers voor alle effecten
    master: 1.0,          // Master volume voor alle afleidingen
    popup: 1.0,           // Popup frequentie multiplier
    surveillance: 1.0,    // Surveillance feedback intensiteit
    glitch: 0.8,          // Visual glitch intensiteit (lager voor comfort)
    progression: 1.2      // System progression agressiviteit
  },
  
  // Timing configuratie voor optimale spanning
  timing: {
    // Popup systeem timing - Made very frequent
    popupMinInterval: 3000,     // Minimum 3 seconds between popups (reduced from 8000)
    popupMaxInterval: 8000,     // Maximum 8 seconds (reduced from 20000)
    popupBurstMode: false,       // Burst mode voor extreme momenten
    
    // Glitch timing
    glitchBaseInterval: 10000,   // Basis 10 seconden tussen glitches
    glitchDuration: 120,         // 120ms glitch duration (subtiel)
    
    // Progression events
    progressionCooldown: 45000,  // 45 seconden tussen progression events
    systemTakeoverThreshold: 8   // Minuten voordat full takeover mogelijk is
  },
  
  // Surveillance systeem configuratie
  surveillance: {
    updateInterval: 2000,        // Update surveillance feedback elke 2 seconden
    enabled: true,               // Surveillance feedback aan/uit
    intensiteit: 1.0             // Surveillance intensiteit
  },
  
  // Glitch systeem configuratie
  glitch: {
    baseFrequentie: 10000,       // Basis frequentie tussen glitches (ms)
    duur: 120,                   // Glitch duur in milliseconden
    enabled: true,               // Glitch effecten aan/uit
    intensiteit: 0.8             // Glitch intensiteit
  },
  
  // Balans instellingen
  balans: {
    // Wanneer afleidingen actief zijn
    minFocusTimeForDistractions: 500,  // 0.5 seconds focus before distractions (reduced from 1000)
    maxDistractionDensity: 0.3,         // Max 30% van de tijd afleidingen
    adaptiveScaling: true,              // Pas intensiteit aan op basis van gebruiker gedrag
    
    // Gebruiker comfort
    respectDeathState: true,            // Stop afleidingen bij dood
    reduceOnLifeLoss: true,             // Verminder bij leven verlies
    gentleProgression: true             // Graduele toename in plaats van sprongen
  },
  
  // Content variatie om herhaling te voorkomen
  content: {
    // Popup boodschap categorieën met gewichten
    messageWeights: {
      AANDACHT_HARVESTING: 0.25,
      SYSTEEMMELDING: 0.20,
      VALSE_WAARSCHUWING: 0.15,
      COGNITIEVE_SCHULD: 0.20,
      PSEUDO_CONTROLE: 0.20
    },
    
    // Progression boodschappen
    progressionVariety: 7,              // Aantal verschillende progression berichten
    
    // Visual variatie
    glitchTypes: ['scanlines', 'colorshift', 'static', 'distortion'],
    glitchVariation: 0.8               // Kans op type variatie
  },
  
  // Performance en UX overwegingen
  performance: {
    // Resource management
    maxSimultaneousPopups: 2,           // Max 2 popups tegelijk
    cleanupInterval: 30000,             // Cleanup elke 30 seconden
    memoryManagement: true,             // Automatische memory cleanup
    
    // Accessibility
    respectReducedMotion: true,         // Respecteer reduced motion preference
    providEscapeHatch: false,           // Geen echte escape (deel van concept)
    minimumReadability: true            // Zorg voor minimale leesbaarheid
  },
  
  // Debug en monitoring
  debug: {
    logEvents: false,                   // Log afleiding events
    showMetrics: false,                 // Toon performance metrics
    enableOverrides: false,             // Development overrides
    testMode: false                     // Test mode met predictable timing
  },
  
  // Thematische consistentie
  thema: {
    // Surveillance kapitaal terminologie
    useEconomicTerms: true,             // Gebruik aandacht economie termen
    dystopianLanguage: true,            // Dystopische taal patterns
    corporateSpeak: true,               // Corporate surveillance taal
    
    // Visual coherentie
    colorScheme: {
      surveillance: '#00ff00',          // Groen voor surveillance
      warning: '#ffff00',               // Geel voor waarschuwingen
      danger: '#ff4444',                // Rood voor gevaar
      system: '#ff0000',                // Helder rood voor system takeover
      background: 'rgba(0, 0, 0, 0.9)' // Donkere achtergrond
    }
  },
  
  // Adaptive systeem parameters
  adaptief: {
    // Leer van gebruiker gedrag
    trackClickFrequency: true,          // Track hoe vaak gebruiker klikt
    adaptToFocusPatterns: true,         // Pas aan op focus patronen
    escalateOnResistance: true,         // Escaleer bij weerstand
    
    // Machine learning simulatie
    behaviorProfiling: true,            // Simuleer gedrag profilering
    predicitiveDistractions: true,      // Voorspel wanneer gebruiker gaat focussen
    personalizedAnnoyance: true         // Personaliseer irritatie patronen
  },
  
  // Experience balancing methods
  balancingMethods: {
    // Methoden om ervaring te balanceren
    calculateOptimalTiming(sessionTime, focusHistory, interactionHistory) {
      // Access timing from parent AfleidingConfig object
      const baseLine = AfleidingConfig.timing.popupMinInterval;
      
      // Pas aan op basis van sessie tijd
      const timeMultiplier = Math.min(2.0, 1.0 + sessionTime / 300000); // Max 2x na 5 minuten
      
      // Pas aan op basis van focus geschiedenis
      const avgFocusTime = focusHistory.reduce((a, b) => a + b, 0) / focusHistory.length;
      const focusMultiplier = avgFocusTime > 10 ? 0.8 : 1.2; // Sneller bij goede focus
      
      // Pas aan op basis van interacties
      const interactionMultiplier = interactionHistory.length > 5 ? 0.9 : 1.1;
      
      return Math.max(
        baseLine * 0.5, // Minimaal de helft van baseline
        baseLine * timeMultiplier * focusMultiplier * interactionMultiplier
      );
    },
    
    // Bereken of gebruiker overweldigd raakt
    checkOverwhelm(recentEvents, userPerformance) {
      const eventDensity = recentEvents.length / 60; // Events per minuut
      const performanceDrop = userPerformance.current < userPerformance.baseline * 0.6;
      
      return eventDensity > AfleidingConfig.balans.maxDistractionDensity || performanceDrop;
    },
    
    // Automatische aanpassing
    autoAdjust(currentConfig, performanceMetrics) {
      const newConfig = { ...currentConfig };
      
      // Als gebruiker te overweldigd is, verminder intensiteit
      if (this.checkOverwhelm(performanceMetrics.recentEvents, performanceMetrics.performance)) {
        newConfig.intensiteit.master *= 0.8;
        newConfig.timing.popupMinInterval *= 1.3;
      }
      
      // Als gebruiker te gemakkelijk focust, verhoog intensiteit
      if (performanceMetrics.avgFocusTime > 30) {
        newConfig.intensiteit.master *= 1.1;
        newConfig.timing.popupMinInterval *= 0.9;
      }
      
      return newConfig;
    }
  },
  
  // Export instellingen voor externe configuratie
  exportSettings() {
    return {
      intensiteit: { ...this.intensiteit },
      timing: { ...this.timing },
      balans: { ...this.balans },
      thema: { ...this.thema }
    };
  },
  
  // Import externe instellingen
  importSettings(newSettings) {
    if (newSettings.intensiteit) Object.assign(this.intensiteit, newSettings.intensiteit);
    if (newSettings.timing) Object.assign(this.timing, newSettings.timing);
    if (newSettings.balans) Object.assign(this.balans, newSettings.balans);
    if (newSettings.thema) Object.assign(this.thema, newSettings.thema);
  },
  
  // Reset naar standaard instellingen
  resetToDefaults() {
    // Reset alle waardes naar bovenstaande defaults
    // Implementation zou hier alle waardes resetten
    console.log('Afleiding configuratie gereset naar standaard instellingen');
  }
};

// Preset configuraties voor verschillende ervaringen
export const AfleidingPresets = {
  // Subtiele ervaring voor gevoelige gebruikers
  subtiel: {
    intensiteit: { master: 0.6, popup: 0.7, glitch: 0.3 },
    timing: { popupMinInterval: 20000, glitchBaseInterval: 15000 },
    balans: { maxDistractionDensity: 0.2, gentleProgression: true }
  },
  
  // Standaard ervaring
  standaard: {
    intensiteit: { master: 1.0, popup: 1.0, glitch: 0.8 },
    timing: { popupMinInterval: 3000, glitchBaseInterval: 6000 }, // Very fast
    balans: { maxDistractionDensity: 0.3, gentleProgression: true, minFocusTimeForDistractions: 1000 }
  },
  
  // Intense ervaring voor hardcore gebruikers
  intens: {
    intensiteit: { master: 1.4, popup: 1.3, glitch: 1.2 },
    timing: { popupMinInterval: 8000, glitchBaseInterval: 6000 },
    balans: { maxDistractionDensity: 0.5, gentleProgression: false }
  },
  
  // Experimentele ervaring
  experimenteel: {
    intensiteit: { master: 1.8, popup: 1.5, glitch: 1.5 },
    timing: { popupMinInterval: 5000, glitchBaseInterval: 4000 },
    balans: { maxDistractionDensity: 0.7, gentleProgression: false }
  }
};
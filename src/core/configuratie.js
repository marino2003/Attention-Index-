// Frontend configuratie voor Focus Tuin
// Alle configureerbare parameters voor de applicatie

export const APPLICATIE_CONFIG = {
  // Performance instellingen
  performance: {
    targetFPS: 60,
    backgroundUpdateInterval: 50, // ms
    effectsUpdateInterval: 1, // frames - increased frequency for smoother updates
    gazeUpdateInterval: 1, // frames - increased frequency for smoother updates
    performanceLogInterval: 10000 // ms
  },
  
  // Focus detectie parameters
  focus: {
    horizontalSnapDistance: 75, // pixels
    verticalSnapDistance: 60, // pixels
    stabilisatieTijd: 250, // ms
    nauwkeurigheidDrempel: 65, // pixels
    verticaleDrempel: 60 // pixels
  },
  
  // Visual feedback instellingen
  visueel: {
    smoothingFactorSnel: 0.15,
    smoothingFactorGemiddeld: 0.3,
    smoothingFactorLangzaam: 0.6,
    snelheidsgrensHoog: 100, // pixels
    snelheidsgrensGemiddeld: 50, // pixels
    focusSnapStrengthBase: 0.2,
    focusSnapStrengthMax: 0.3,
    pullStrengthHorizontal: 0.05,
    pullStrengthVertical: 0.08
  },
  
  // Monitoring en logging
  monitoring: {
    statistiekenInterval: 3000, // ms
    debugLogInterval: 10000, // ms
    performanceMonitoring: true
  },
  
  // UI instellingen
  ui: {
    kalibratieControlsDelay: 500, // ms
    statusUpdateInterval: 100, // ms
    notificatieDuration: 3000, // ms
    animatieDuration: 300 // ms
  },
  
  // Camera instellingen (frontend kant)
  camera: {
    voorkeurIndex: 0,
    fallbackTimeout: 5000, // ms
    reconnectAttempts: 3,
    reconnectDelay: 2000 // ms
  },
  
  // Kalibratie instellingen
  kalibratie: {
    defaultOffsetX: 0.0,
    defaultOffsetY: 0.0,
    defaultSchaalX: 1.5,
    defaultSchaalY: 1.3,
    kalibratieSneltoets: 'C', // + Shift
    stopSneltoets: 'Escape'
  },
  
  // Debug instellingen
  debug: {
    showPerformanceLog: true,
    showFocusStatistieken: true,
    showOogPositie: true, // Enable to see gaze position
    enableGebeurtenisDebug: true // Enable to see event flow
  },
  
  // Tuin generatie parameters
  tuin: {
    minimumPlanten: 10,
    maximumPlanten: 50,
    groeiSnelheidBase: 0.01,
    groeiSnelheidFocus: 0.05,
    plantenVariatie: 0.3
  },
  
  // Visuele effecten parameters
  effecten: {
    achtergrondKleur: '#0a0a0a',
    focusKleur: '#00ff88',
    normalKleur: '#ffffff',
    atmosfeerIntensiteit: 0.7,
    deeltjesAantal: 20
  }
};

// Helper functie om configuratie waarden te valideren
export function validateConfig() {
  const fouten = [];
  
  // Valideer FPS
  if (APPLICATIE_CONFIG.performance.targetFPS < 15 || APPLICATIE_CONFIG.performance.targetFPS > 60) {
    fouten.push('Target FPS moet tussen 15 en 60 zijn');
  }
  
  // Valideer focus parameters
  if (APPLICATIE_CONFIG.focus.nauwkeurigheidDrempel < 10 || APPLICATIE_CONFIG.focus.nauwkeurigheidDrempel > 200) {
    fouten.push('Nauwkeurigheid drempel moet tussen 10 en 200 pixels zijn');
  }
  
  // Valideer smoothing factors
  const smoothingFactors = [
    APPLICATIE_CONFIG.visueel.smoothingFactorSnel,
    APPLICATIE_CONFIG.visueel.smoothingFactorGemiddeld,
    APPLICATIE_CONFIG.visueel.smoothingFactorLangzaam
  ];
  
  smoothingFactors.forEach((factor, index) => {
    if (factor < 0.1 || factor > 1.0) {
      fouten.push(`Smoothing factor ${index + 1} moet tussen 0.1 en 1.0 zijn`);
    }
  });
  
  if (fouten.length > 0) {
    console.warn('Configuratie validatie fouten:', fouten);
    return false;
  }
  
  return true;
}
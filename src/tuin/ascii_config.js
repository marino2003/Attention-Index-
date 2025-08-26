// ASCII Kunst Configuratie - Instelbare parameters voor effecten
// Modulair configuratie systeem voor makkelijke aanpassingen

export const ASCIIConfig = {
  // Basis rendering instellingen - verhoogde resolutie met performance optimalisatie
  rendering: {
    canvasBreedte: 90,
    canvasHoogte: 45,
    charBreedte: 8,
    charHoogte: 12,
    updateFrequentie: 3 // Verhoogd voor vloeiendere performance (elke 3 frames)
  },
  
  // Focus effect instellingen
  focus: {
    intensiteitToename: 0.02,
    intensiteitAfname: 0.98,
    maxGeschiedenis: 60,
    focusRadius: {
      min: 4,
      max: 10
    },
    effectKansen: {
      zwak: 0.1,
      medium: 0.15,
      sterk: 0.25,
      intense: 0.35
    }
  },
  
  // Evolutie instellingen
  evolutie: {
    stageOvergangTijd: 180, // frames (3 seconden bij 60fps)
    maxStage: 5,
    effectKans: 0.0,
    organischeGroeiKans: 0.05,
    neuralLijnKans: 0.0
  },
  
  // Karakter paletten - uitgebreid voor meer gezichtsdetail
  paletten: {
    basis: ' .`\'"^~-_=+<>ilIc/\\|()1{}[]?-~<>i!lI;:,"^`". ',
    focus: ' .,:-=+*xX#@',
    evolutie: ' .,:;+=*xX#@&%',
    blink: '.*+xoO@#'
  },
  
  // Focus intensiteit karakters - meer detail niveaus
  focusKarakters: {
    zwak: ['.', '`', "'"],
    medium: [':', ';', '-', '='],
    sterk: ['+', '*', 'x', 'X'],
    intense: ['#', '@', '&', '%']
  },
  
  // Visuele styling - eenvoudig en schoon
  styling: {
    kleuren: {
      basis: [255, 255, 255],
      focus: [200, 200, 200],
      intense: [255, 255, 255]
    }
  },
  
  // Performance instellingen - geoptimaliseerd voor eenvoud
  performance: {
    effectBerekenFrequentie: 1, // Elke frame voor vloeiende effecten
    rippleMaxRadius: 8,
    rippleDuur: 30 // frames
  },
  
  // Debug instellingen
  debug: {
    logEffecten: false,
    toonFocusData: false,
    toonPerformanceStats: false
  }
};
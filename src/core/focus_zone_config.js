// Focus Zone Configuration
// Centralized settings for both detection logic and visual appearance
// Edit these values to adjust the focus zone behavior and appearance

export const FOCUS_ZONE_CONFIG = {
  // === DETECTION SETTINGS ===
  // Controls when the system detects that user is "in focus"
  detection: {
    // Main detection area (pixels from center) - Made extremely strict
    horizontaleTolerantie: 20, //65    // How far left/right user can look (pixels) - very strict
    verticaleTolerantie: 15, //60        // How far up/down user can look (pixels) - very strict
    
    // Exit tolerances (when user leaves focus zone)
    horizontaleUitTolerantie: 30, // Exit threshold horizontally - strict
    verticaleUitTolerantie: 25,   // Exit threshold vertically - strict
    
    // Hysteresis (prevents flickering when on edge)
    focusHysterese: 10,           // Horizontal stability buffer - reduced from 15
    verticaleHysterese: 8,       // Vertical stability buffer - reduced from 12
    
    // Timing - Increased for more forgiving experience
    stabilisatieTijd: 300,        // Increased from 200ms - require more consistent tracking
    focusGeschiedenisGrootte: 300, // Increased from 200ms - longer history for stability
    
    // Confidence
    minimaleConfidence: 0.6       // Minimum eye tracking confidence required - increased from 0.5
  },

  // === VISUAL SETTINGS ===
  // Controls how the focus zone appears on screen
  visual: {
    // Base size and positioning - Updated to match extremely strict detection
    basisStraal: 20,              // Base radius for all rings (reduced from 30 to match detection)
    
    // Ring multipliers (relative to basisStraal)
    rings: {
      buitenste: 1.4, // Tolerance boundary - where you actually lose life (28px)
      tweede: 0, //1.6                 // Second ring size multiplier  
      middelste: 1.2,              // Reference ring - slightly larger for context
      binnenste: 1.0               // Inner ring size multiplier (base) - visual center (20px)
    },
    
    // Animation settings - all set to zero to prevent flickering
    animatie: {
      tijdSnelheid: 0,        // Animation speed multiplier - disabled to prevent flickering
      pulsAmplitude: 0,           // How much rings pulse (pixels) - disabled to prevent flickering
      opacityVariatie: 0,        // How much opacity varies during animation - disabled to prevent flickering
      centraalPuntVariatie: 0     // How much central point size varies - disabled to prevent flickering
    },
    
    // Colors (HSB values) - Updated to CRT black & white aesthetic
    kleuren: {
      buitensteRing: { hue: 0, sat: 0, bright: 80, alpha: 0.8 },   // TOLERANCE BOUNDARY - clearly visible
      tweedeRing: { hue: 0, sat: 0, bright: 100, alpha: 0.5 },      // White with medium opacity
      middelsteRing: { hue: 0, sat: 0, bright: 100, alpha: 0.4 },   // Reference ring - softer
      binnensteRing: { hue: 0, sat: 0, bright: 100, alpha: 0.9 },   // Visual center - bright and clear
      centraalPunt: { hue: 0, sat: 0, bright: 100, alpha: 1.0 },    // Pure white
      richtingslijnen: { hue: 0, sat: 0, bright: 90, alpha: 0.6 }   // Brighter grayish white
    },
    
    // Stroke weights - Adjusted for CRT aesthetic
    strokeWeights: {
      buitensteRing: 2,             // TOLERANCE BOUNDARY - thick and visible
      tweedeRing: 1,                // Thinner lines for CRT effect
      middelsteRing: 1,             // Reference ring
      binnensteRing: 2,             // Visual center - important
      centraalPunt: 1,              // Thin center point outline
      richtingslijnen: 1            // Thin guide lines
    },
    
    // Guide lines
    richtingslijnen: {
      aantal: 6,                    // Reduced number of lines for cleaner CRT look
      lengte: 15,                   // Shorter lines
      lengteVariatie: 0,            // No variation for consistent CRT look
      afstandMultiplier: 1.2        // Slightly further from center
    },
    
    // Central point
    centraalPunt: {
      basisGrootte: 8,              // Smaller central point
      gloeiGrootte: 15,             // Smaller glow effect
      gloeiVariatie: 0            // No glow variation to prevent flickering
    }
  },

  // === PRESET CONFIGURATIONS ===
  // Quick presets for different focus zone sizes and behaviors
  presets: {
    small: {
      detection: { horizontaleTolerantie: 45, verticaleTolerantie: 40 },
      visual: { basisStraal: 45 }
    },
    
    medium: {
      detection: { horizontaleTolerantie: 65, verticaleTolerantie: 60 },
      visual: { basisStraal: 65 }
    },
    
    large: {
      detection: { horizontaleTolerantie: 85, verticaleTolerantie: 80 },
      visual: { basisStraal: 85 }
    },
    
    extraLarge: {
      detection: { horizontaleTolerantie: 105, verticaleTolerantie: 100 },
      visual: { basisStraal: 105 }
    }
  }
};
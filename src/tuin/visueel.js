// Visuele effecten module
// Atmosferische effecten voor de focus tuin

import { FOCUS_ZONE_CONFIG } from '../core/focus_zone_config.js';
import { easeInOutCubic, constrain } from '../utils/math_utils.js';

export class VisueleEffecten {
  constructor() {
    this.deeltjes = [];
    this.energieRings = [];
    this.lichtStralen = [];
    this.fluidDeeltjes = [];
    this.targetFPS = 60;
    this.frameSmoothing = 0.1;
    
    // Animation state for screen transitions
    this.screenTransitionProgress = 0;
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 2000; // 2 seconds for smooth transition
    this.canvasFadeInProgress = 0;
    this.isCanvasFadingIn = true;
    this.canvasFadeInStartTime = 0;
    this.canvasFadeInDuration = 1500; // 1.5 seconds for canvas fade-in
    
    // Focus state tracking
    this.isFocus = false;
  }

  initialiseer(p5Instance) {
    this.p5 = p5Instance;
    this.deeltjes = [];
    this.energieRings = [];
    this.lichtStralen = [];
    this.fluidDeeltjes = [];
    this.canvasFadeInStartTime = this.p5.millis();
  }

  // Method to start the transition animation when entering the eye tracking screen
  startScreenTransition() {
    this.isTransitioning = true;
    this.transitionStartTime = this.p5.millis();
    this.screenTransitionProgress = 0;
    console.log('Start screen transition animation');
  }

  updateEffecten(isFocus, groeiFactor) {
    // Update focus state
    this.isFocus = isFocus;
    
    // Handle screen transition animation
    if (this.isTransitioning) {
      const currentTime = this.p5.millis();
      const elapsedTime = currentTime - this.transitionStartTime;
      const progress = constrain(elapsedTime / this.transitionDuration, 0, 1);
      
      // Apply smooth easing function
      this.screenTransitionProgress = easeInOutCubic(progress);
      
      // End transition when complete
      if (progress >= 1) {
        this.isTransitioning = false;
        console.log('Screen transition animation complete');
      }
    }
    
    // Handle canvas fade-in
    if (this.isCanvasFadingIn) {
      const currentTime = this.p5.millis();
      const elapsedTime = currentTime - this.canvasFadeInStartTime;
      this.canvasFadeInProgress = constrain(elapsedTime / this.canvasFadeInDuration, 0, 1);
      
      // End fade-in when complete
      if (this.canvasFadeInProgress >= 1) {
        this.isCanvasFadingIn = false;
      }
    }
    
    // Effects updates - all disabled for clean focus zone experience
    // Effects are disabled - no particles or animations when focusing
  }

  tekenAchtergrond() {
    // Simplified background for better performance
    this.p5.push();
    
    // Use a solid dark background - no noise particles
    this.p5.background(10, 10, 10);
    
    this.p5.pop();
  }
  
  // Removed scanlines function to prevent flickering

  tekenAtmosfeer() {
    // Focus zone rendering only - atmospheric effects disabled for clean experience
    this.tekenFocusZone();
  }

  tekenOogIndicator(oogPositie, afstand, nauwkeurigheidDrempel) {
    if (!oogPositie) return;
    
    const centrumX = this.p5.width * 0.5;
    const centrumY = this.p5.height * 0.5;
    
    this.p5.push();
    this.p5.translate(oogPositie.x, oogPositie.y);
    
    // Use RGB mode for consistent colors
    this.p5.colorMode(this.p5.RGB, 255);
    
    // Draw simple white circle for eye indicator
    this.p5.fill(255, 255, 255, 150);
    this.p5.noStroke();
    this.p5.circle(0, 0, 8);
    
    // Add simple crosshair for more precise indication in white
    if (afstand < nauwkeurigheidDrempel * 1.2) {
      let alpha = this.p5.map(afstand, 0, nauwkeurigheidDrempel * 1.2, 180, 50);
      
      this.p5.stroke(255, 255, 255, alpha); // White color
      this.p5.strokeWeight(1);
      
      // Horizontal line
      this.p5.line(-10, 0, 10, 0);
      // Vertical line
      this.p5.line(0, -10, 0, 10);
    }
    
    this.p5.pop();
    this.p5.colorMode(this.p5.RGB, 255);
  }
  
  // Simplified dithered circle function for better performance
  tekenVereenvoudigdeDitheredCirkel(x, y, straal, alpha) {
    this.p5.push();
    
    // Further reduced dot density for better performance
    const dotSpacing = 3; // Increased spacing
    const dotSize = 1.8;    // Slightly larger dots
    
    // Pre-calculate some values to avoid repeated calculations
    const straalSquared = straal * straal;
    
    // Simple grid-based approach for better performance
    for (let dy = -straal; dy <= straal; dy += dotSpacing) {
      const dySquared = dy * dy;
      for (let dx = -straal; dx <= straal; dx += dotSpacing) {
        // Check if the dot is within the circle using squared distances for better performance
        const distanceSquared = dx * dx + dySquared;
        if (distanceSquared <= straalSquared) {
          // Simple probability based on distance for dithering effect
          const probability = 1.0 - Math.sqrt(distanceSquared) / straal;
          
          // Use a simple modulo-based approach instead of random for better performance
          if ((Math.floor(dx * 13.7 + dy * 31.4) % 100) < probability * 70) {
            // White color with slight variation
            this.p5.fill(255, 255, 255, alpha);
            this.p5.noStroke();
            this.p5.circle(x + dx, y + dy, dotSize);
          }
        }
      }
    }
    
    // Fewer random dots for better performance
    for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
      const angle = (i * 0.5) % this.p5.TWO_PI; // Fixed angles
      const dist = straal * (0.8 + (i * 0.1));
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 1;
      
      this.p5.fill(255, 255, 255, 120);
      this.p5.noStroke();
      this.p5.circle(x + dx, y + dy, size);
    }
    
    this.p5.pop();
  }

  tekenFocusZone() {
    // Only draw focus zone if eye tracking is ready
    if (!this.p5 || !FOCUS_ZONE_CONFIG) return;
    
    const centrumX = this.p5.width * 0.5;
    const centrumY = this.p5.height * 0.5;
    const config = FOCUS_ZONE_CONFIG.visual;

    this.p5.push();
    this.p5.translate(centrumX, centrumY);
    
    // Apply transition animation to focus zone - start much smaller
    const focusZoneAlpha = this.isTransitioning ? this.screenTransitionProgress : 1;
    const scale = this.isTransitioning ? this.p5.map(this.screenTransitionProgress, 0, 1, 0.01, 1) : 1; // Start at 1% size
    this.p5.scale(scale);
    
    // Set color mode to HSB for easier grayscale manipulation
    this.p5.colorMode(this.p5.HSB, 360, 100, 100, 1);
    
    // Use configuration for base radius
    const basisStraal = config.basisStraal;
    const pulsStraal = basisStraal;
    

    
    // Buitenste focus zone ring
    this.p5.noFill();
    this.p5.strokeWeight(config.strokeWeights.buitensteRing);
    const buitensteKleur = config.kleuren.buitensteRing;
    this.p5.stroke(buitensteKleur.hue, buitensteKleur.sat, buitensteKleur.bright, 
                   buitensteKleur.alpha * focusZoneAlpha);
    this.p5.circle(0, 0, pulsStraal * config.rings.buitenste);
    
    // Tweede ring
    this.p5.strokeWeight(config.strokeWeights.tweedeRing);
    const tweedeKleur = config.kleuren.tweedeRing;
    this.p5.stroke(tweedeKleur.hue, tweedeKleur.sat, tweedeKleur.bright,
                   tweedeKleur.alpha * focusZoneAlpha);
    this.p5.circle(0, 0, pulsStraal * config.rings.tweede);
    
    // Middelste zone
    this.p5.strokeWeight(config.strokeWeights.middelsteRing);
    const middelsteKleur = config.kleuren.middelsteRing;
    this.p5.stroke(middelsteKleur.hue, middelsteKleur.sat, middelsteKleur.bright,
                   middelsteKleur.alpha * focusZoneAlpha);
    this.p5.circle(0, 0, pulsStraal * config.rings.middelste);
    
    // Binnenste actieve zone
    this.p5.strokeWeight(config.strokeWeights.binnensteRing);
    const binnensteKleur = config.kleuren.binnensteRing;
    this.p5.stroke(binnensteKleur.hue, binnensteKleur.sat, binnensteKleur.bright, binnensteKleur.alpha * focusZoneAlpha);
    this.p5.circle(0, 0, pulsStraal);
    
    // Richtingslijnen - reduced number for better performance
    const richtingslijnen = config.richtingslijnen;
    const lijnAantal = Math.min(6, richtingslijnen.aantal); // Reduced number of lines
    for (let i = 0; i < lijnAantal; i++) {
      const hoek = (i / lijnAantal) * this.p5.TWO_PI;
      const lijnLengte = richtingslijnen.lengte;
      const afstand = pulsStraal * richtingslijnen.afstandMultiplier;
      
      const startX = this.p5.cos(hoek) * afstand;
      const startY = this.p5.sin(hoek) * afstand;
      const eindX = this.p5.cos(hoek) * (afstand + lijnLengte);
      const eindY = this.p5.sin(hoek) * (afstand + lijnLengte);
      
      
      
      this.p5.strokeWeight(config.strokeWeights.richtingslijnen);
      const richtingKleur = config.kleuren.richtingslijnen;
      this.p5.stroke(richtingKleur.hue, richtingKleur.sat, richtingKleur.bright,
                     richtingKleur.alpha * focusZoneAlpha);
      this.p5.line(startX, startY, eindX, eindY);
    }
    
    // Centrale focus punt - now with dithered art style
    const centraalKleur = config.kleuren.centraalPunt;
    this.p5.stroke(0, 0, 100, 0.8 * focusZoneAlpha); // White stroke
    this.p5.strokeWeight(config.strokeWeights.centraalPunt);
    
    // Draw dithered central point with simplified function for better performance
    const centralPointSize = config.centraalPunt.basisGrootte;
    this.tekenVereenvoudigdeDitheredCirkel(0, 0, centralPointSize, centraalKleur.alpha * 255 * focusZoneAlpha);
    
    // Extra gloeiend effect voor de centrale punt
    this.p5.fill(centraalKleur.hue, centraalKleur.sat, centraalKleur.bright, 0.4 * focusZoneAlpha); // Pure white glow
    this.p5.noStroke();
    this.p5.circle(0, 0, config.centraalPunt.gloeiGrootte);
    

    
    this.p5.pop();
    this.p5.colorMode(this.p5.RGB, 255);
  }
  


}
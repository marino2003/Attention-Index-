// ASCII Kunst Module - Face Manipulation through Eye Tracking
// Webcam feed wordt gemanipuleerd door gebruikers blik

import { ASCIIEffecten } from './ascii_effecten.js';
import { ASCIIConfig } from './ascii_config.js';
import { ASCIIVisualControls } from './ascii_visual_controls.js';

export class ASCIIKunst {
  constructor(zaadGetal) {
    this.zaadGetal = zaadGetal;
    this.config = ASCIIConfig;
    this.controls = ASCIIVisualControls;
    this.isGeinitialiseerd = false;
    this.p5 = null;
    
    this.canvasBreedte = this.config.rendering.canvasBreedte;
    this.canvasHoogte = this.config.rendering.canvasHoogte;
    this.sessionTime = 0;
    this.isVisible = false;
    
    // Face manipulation components
    this.webcamProcessor = new WebcamProcessor(this);
    this.gazeManipulator = new GazeManipulator(this);
    this.faceDistorter = new FaceDistorter(this);
    this.asciiEffecten = new ASCIIEffecten(this);
    
    this.asciiCanvas = [];
    this.laatsteGazePositie = { x: 0.5, y: 0.5 };
    
    console.log('ASCII face manipulation system loaded with visual controls');
  }

  initialiseer(p5Instance) {
    this.p5 = p5Instance;
    this.p5.randomSeed(this.zaadGetal);
    this.p5.noiseSeed(this.zaadGetal);
    
    this.initialiseerCanvas();
    this.webcamProcessor.initialiseer();
    this.gazeManipulator.initialiseer();
    this.faceDistorter.initialiseer();
    
    this.isGeinitialiseerd = true;
    console.log('Face manipulation system ready');
  }
  
  initialiseerCanvas() {
    this.asciiCanvas = Array(this.canvasHoogte).fill().map(() => 
      Array(this.canvasBreedte).fill(' ')
    );
  }
  
  update(isFocus, gazeData = null) {
    this.sessionTime++;
    this.isVisible = isFocus;
    
    if (gazeData) {
      this.laatsteGazePositie = {
        x: gazeData.x / window.innerWidth,
        y: gazeData.y / window.innerHeight
      };
      this.gazeManipulator.updateGaze(this.laatsteGazePositie);
    }
    
    // Generate manipulated frame at 15fps
    if (this.sessionTime % this.config.rendering.updateFrequentie === 0) {
      this.generateManipulatedFrame();
    }
  }

  processWebcamFrameFromBackend(frameData) {
    this.webcamProcessor.processFrame(frameData);
  }
  
  generateManipulatedFrame() {
    // Start with webcam foundation
    this.asciiCanvas = this.webcamProcessor.getFoundationLayer();
    
    // Apply gaze-based face manipulation
    if (this.isVisible && this.laatsteGazePositie) {
      this.asciiCanvas = this.faceDistorter.manipulateFace(
        this.asciiCanvas, 
        this.laatsteGazePositie
      );
    }
    
    // Apply ASCII effects
    const focusData = {
      isFocus: this.isVisible,
      gazeX: this.laatsteGazePositie.x,
      gazeY: this.laatsteGazePositie.y,
      intensiteit: this.gazeManipulator.getFocusIntensity()
    };
    
    this.asciiCanvas = this.asciiEffecten.verwerkEffecten(this.asciiCanvas, focusData);
  }
  
  render() {
    if (!this.p5 || !this.isGeinitialiseerd) return;
    
    this.p5.push();
    
    // Set dark background only for ASCII area
    const charWidth = 8;
    const charHeight = 12;
    
    // Calculate total ASCII dimensions
    const totalASCIIWidth = this.canvasBreedte * charWidth;
    const totalASCIIHeight = this.canvasHoogte * charHeight;
    
    // Center the ASCII art within the P5 canvas with proper bounds checking
    const startX = Math.max(0, (this.p5.width - totalASCIIWidth) / 2);
    const startY = Math.max(0, (this.p5.height - totalASCIIHeight) / 2);
    
    // Draw background rectangle only for ASCII area to avoid interfering with other elements
    this.p5.fill(10, 10, 10);
    this.p5.noStroke();
    this.p5.rect(startX - 5, startY - 5, totalASCIIWidth + 10, totalASCIIHeight + 10);
    
    // Render ASCII text with improved centering
    this.p5.fill(255, 255, 255, 230);
    this.p5.textFont('CATelecopy-Regular, Courier New, monospace');
    this.p5.textSize(13);
    this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
    
    // Only render visible characters for performance
    for (let y = 0; y < this.asciiCanvas.length; y++) {
      for (let x = 0; x < this.asciiCanvas[y].length; x++) {
        const char = this.asciiCanvas[y][x];
        if (char !== ' ') {
          const drawX = startX + x * charWidth;
          const drawY = startY + y * charHeight;
          
          // Bounds check to ensure we don't draw outside canvas
          if (drawX >= 0 && drawX < this.p5.width && drawY >= 0 && drawY < this.p5.height) {
            this.p5.text(char, drawX, drawY);
          }
        }
      }
    }
    
    this.p5.pop();
  }

  exporteerASCIIKunst() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let exportText = 'Face Manipulation ASCII Art\\n';
    exportText += `Generated: ${timestamp}\\n\\n`;
    
    for (let y = 0; y < this.asciiCanvas.length; y++) {
      exportText += this.asciiCanvas[y].join('') + '\\n';
    }
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `face_manipulation_${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    return { success: true, filename: `face_manipulation_${timestamp}.txt` };
  }
  
  // Compatibility methods
  teken() {
    this.render();
  }
  
  triggerBlink() {
    if (this.faceDistorter) {
      this.faceDistorter.triggerBlinkEffect();
    }
    if (this.asciiEffecten) {
      this.asciiEffecten.behandelBlink();
    }
  }
  
  exporteerAlsText() {
    const result = this.exporteerASCIIKunst();
    console.log('Text export completed:', result.filename);
    return result.success;
  }
  
  exporteerAlsCRT() {
    // Simple CRT-style export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const charWidth = 10;
    const charHeight = 14;
    canvas.width = this.canvasBreedte * charWidth;
    canvas.height = this.canvasHoogte * charHeight;
    
    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ASCII
    ctx.font = '14px "CATelecopy-Regular", "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    for (let y = 0; y < this.asciiCanvas.length; y++) {
      for (let x = 0; x < this.asciiCanvas[y].length; x++) {
        const char = this.asciiCanvas[y][x];
        if (char !== ' ') {
          ctx.fillText(char, x * charWidth, y * charHeight);
        }
      }
    }
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `face_manipulation_${timestamp}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
    
    console.log('CRT export completed');
    return true;
  }
  
  // Visual controls access methods
  getVisualControls() {
    return this.controls.getControls();
  }
  
  updateVisualControls(nieuweInstellingen) {
    this.controls.updateControls(nieuweInstellingen);
  }
  
  setPerformanceMode(modus) {
    this.controls.setPerformanceModus(modus);
  }
  
  toggleEffect(effectNaam) {
    if (effectNaam in this.controls.effecten) {
      this.controls.effecten[effectNaam] = !this.controls.effecten[effectNaam];
      console.log(`${effectNaam} effect: ${this.controls.effecten[effectNaam] ? 'AAN' : 'UIT'}`);
      return this.controls.effecten[effectNaam];
    }
    return false;
  }
}

// Simple webcam processor for face manipulation
class WebcamProcessor {
  constructor(parent) {
    this.parent = parent;
    this.luminancePalette = ' .,;xe$@';
    this.foundationLayer = [];
    this.frameAvailable = false;
  }
  
  initialiseer() {
    this.foundationLayer = Array(this.parent.canvasHoogte).fill().map(() => 
      Array(this.parent.canvasBreedte).fill(' ')
    );
  }
  
  processFrame(frameData) {
    if (!frameData || !frameData.luminance_data) return;
    
    this.frameAvailable = true;
    const newFrame = Array(this.parent.canvasHoogte).fill().map(() => 
      Array(this.parent.canvasBreedte).fill(' ')
    );
    
    const frameWidth = Math.min(frameData.width, this.parent.canvasBreedte);
    const frameHeight = Math.min(frameData.height, this.parent.canvasHoogte);
    
    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const luminance = frameData.luminance_data[y][x];
        const charIndex = Math.floor((luminance / 255) * (this.luminancePalette.length - 1));
        const clampedIndex = Math.max(0, Math.min(this.luminancePalette.length - 1, charIndex));
        newFrame[y][x] = this.luminancePalette[clampedIndex];
      }
    }
    
    this.foundationLayer = newFrame;
  }
  
  getFoundationLayer() {
    if (this.frameAvailable) {
      return this.foundationLayer.map(row => [...row]);
    }
    return this.generateFallbackPattern();
  }
  
  generateFallbackPattern() {
    const pattern = Array(this.parent.canvasHoogte).fill().map(() => 
      Array(this.parent.canvasBreedte).fill(' ')
    );
    
    for (let y = 0; y < this.parent.canvasHoogte; y++) {
      for (let x = 0; x < this.parent.canvasBreedte; x++) {
        if (Math.random() < 0.05) {
          pattern[y][x] = Math.random() < 0.6 ? '.' : ',';
        }
      }
    }
    
    return pattern;
  }
}

// Gaze tracking for face manipulation intensity
class GazeManipulator {
  constructor(parent) {
    this.parent = parent;
    this.gazePosition = { x: 0.5, y: 0.5 };
    this.focusIntensity = 0;
    this.gazeStability = 0;
    this.gazeHistory = [];
    this.maxHistory = 20;
  }
  
  initialiseer() {
    this.gazeHistory = [];
  }
  
  updateGaze(newPosition) {
    this.gazePosition = newPosition;
    
    // Track gaze movement for stability calculation
    this.gazeHistory.push({ ...newPosition, time: Date.now() });
    if (this.gazeHistory.length > this.maxHistory) {
      this.gazeHistory.shift();
    }
    
    // Calculate gaze stability (less movement = more stable)
    this.calculateGazeStability();
    
    // Update focus intensity based on stability
    if (this.gazeStability > 0.7) {
      this.focusIntensity = Math.min(1.0, this.focusIntensity + 0.03);
    } else {
      this.focusIntensity = Math.max(0.0, this.focusIntensity - 0.01);
    }
  }
  
  calculateGazeStability() {
    if (this.gazeHistory.length < 5) {
      this.gazeStability = 0;
      return;
    }
    
    let totalMovement = 0;
    for (let i = 1; i < this.gazeHistory.length; i++) {
      const prev = this.gazeHistory[i - 1];
      const curr = this.gazeHistory[i];
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalMovement += distance;
    }
    
    const avgMovement = totalMovement / (this.gazeHistory.length - 1);
    this.gazeStability = Math.max(0, 1 - (avgMovement * 10));
  }
  
  getFocusIntensity() {
    return this.focusIntensity;
  }
  
  getGazeStability() {
    return this.gazeStability;
  }
}

// Face distortion effects based on eye tracking
class FaceDistorter {
  constructor(parent) {
    this.parent = parent;
    this.blinkEffects = [];
    this.lastBlinkTime = 0;
  }
  
  initialiseer() {
    // Simple initialization
  }
  
  manipulateFace(canvas, gazePos) {
    const manipulatedCanvas = canvas.map(row => [...row]);
    
    // Apply gaze-based face distortion
    this.applyGazeDistortion(manipulatedCanvas, gazePos);
    
    // Apply blink effects if any
    this.applyBlinkEffects(manipulatedCanvas);
    
    return manipulatedCanvas;
  }
  
  applyGazeDistortion(canvas, gazePos) {
    const gazeX = Math.floor(gazePos.x * this.parent.canvasBreedte);
    const gazeY = Math.floor(gazePos.y * this.parent.canvasHoogte);
    const intensity = this.parent.gazeManipulator.getFocusIntensity();
    
    // Create ripple effect around gaze position
    const rippleRadius = Math.floor(3 + intensity * 6);
    
    for (let y = Math.max(0, gazeY - rippleRadius); y < Math.min(canvas.length, gazeY + rippleRadius); y++) {
      for (let x = Math.max(0, gazeX - rippleRadius); x < Math.min(canvas[y].length, gazeX + rippleRadius); x++) {
        const distance = Math.sqrt((x - gazeX) * (x - gazeX) + (y - gazeY) * (y - gazeY));
        
        if (distance < rippleRadius) {
          const effect = (1 - distance / rippleRadius) * intensity;
          
          if (Math.random() < effect * 0.3) {
            canvas[y][x] = this.getDistortedCharacter(canvas[y][x], effect);
          }
        }
      }
    }
  }
  
  getDistortedCharacter(originalChar, intensity) {
    // Progressive face manipulation based on intensity
    const distortionLevels = {
      ' ': [' ', '.', ':', '*'],
      '.': ['.', ':', ';', '+', '*'],
      ',': [',', '.', ':', '+', '#'],
      ':': [':', ';', '+', '*', '@'],
      ';': [';', '+', '*', '#', '@'],
      'x': ['x', '*', '#', '@', '&'],
      'e': ['e', '*', '#', '@', '%'],
      '$': ['$', '@', '#', '&', '%'],
      '@': ['@', '#', '&', '%', '█']
    };
    
    const levels = distortionLevels[originalChar] || [originalChar];
    const levelIndex = Math.min(levels.length - 1, Math.floor(intensity * levels.length));
    
    return levels[levelIndex];
  }
  
  triggerBlinkEffect() {
    const now = Date.now();
    if (now - this.lastBlinkTime < 500) return;
    
    this.lastBlinkTime = now;
    const gazePos = this.parent.gazeManipulator.gazePosition;
    
    // Create blink ripple effect
    this.blinkEffects.push({
      x: Math.floor(gazePos.x * this.parent.canvasBreedte),
      y: Math.floor(gazePos.y * this.parent.canvasHoogte),
      radius: 0,
      maxRadius: 8,
      age: 0,
      maxAge: 30
    });
  }
  
  applyBlinkEffects(canvas) {
    this.blinkEffects = this.blinkEffects.filter(effect => {
      effect.age++;
      effect.radius = (effect.age / effect.maxAge) * effect.maxRadius;
      
      if (effect.age < effect.maxAge) {
        this.applyBlinkRipple(canvas, effect);
        return true;
      }
      return false;
    });
  }
  
  applyBlinkRipple(canvas, effect) {
    const { x, y, radius } = effect;
    const intensity = 1 - (effect.age / effect.maxAge);
    
    for (let py = Math.max(0, y - Math.ceil(radius)); py < Math.min(canvas.length, y + Math.ceil(radius)); py++) {
      for (let px = Math.max(0, x - Math.ceil(radius)); px < Math.min(canvas[py].length, x + Math.ceil(radius)); px++) {
        const distance = Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
        
        if (Math.abs(distance - radius) < 1.5) {
          if (Math.random() < intensity * 0.6) {
            canvas[py][px] = this.getBlinkCharacter(canvas[py][px], intensity);
          }
        }
      }
    }
  }
  
  getBlinkCharacter(originalChar, intensity) {
    const blinkChars = ['*', '+', 'x', '#', '@', 'o', 'O'];
    if (Math.random() < intensity) {
      return blinkChars[Math.floor(Math.random() * blinkChars.length)];
    }
    return originalChar;
  }
}

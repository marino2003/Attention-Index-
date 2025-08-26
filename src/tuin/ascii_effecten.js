// ASCII Kunst Effecten - Visuele manipulatie systeem
// Modulair systeem voor creatieve ASCII kunst effecten

import { ASCIIConfig } from './ascii_config.js';
import { ASCIIVisualControls } from './ascii_visual_controls.js';

export class ASCIIEffecten {
  constructor(parentASCII) {
    this.parent = parentASCII;
    this.config = ASCIIConfig;
    this.controls = ASCIIVisualControls;
    this.focusIntensiteit = 0;
    this.blinkTeller = 0;
    this.evolutieStadium = 0;
    this.focusGeschiedenis = [];
    this.maxGeschiedenis = this.config.focus.maxGeschiedenis;
    
    // Performance tracking
    this.frameCounter = 0;
    this.lastUpdateTime = 0;
    
    // Gebruik configuratie paletten
    this.effectPaletten = this.config.paletten;
    this.focusKarakters = this.config.focusKarakters;
  }
  
  // Hoofd effect verwerking met performance optimalisaties
  verwerkEffecten(canvas, focusData) {
    this.frameCounter++;
    this.updateFocusData(focusData);
    
    let resultCanvas = [...canvas.map(row => [...row])];
    
    // Performance check - skip effect processing op sommige frames
    const shouldProcessEffects = this.frameCounter % this.controls.performance.effectUpdateFrequentie === 0;
    
    if (!shouldProcessEffects) {
      return resultCanvas; // Return unmodified canvas voor performance
    }
    
    // Pas effecten toe op basis van controls
    if (this.controls.effecten.focus && this.focusIntensiteit > 0.2) {
      resultCanvas = this.pasGazeFocusEffectToe(resultCanvas);
    }
    
    if (this.controls.effecten.evolutie && this.focusIntensiteit > 0.5) {
      resultCanvas = this.pasEvolutieEffectToe(resultCanvas);
    }
    
    if (this.controls.effecten.neuralLijnen && this.focusIntensiteit > 0.7) {
      resultCanvas = this.pasNeuralEffectToe(resultCanvas);
    }
    
    // Organische groei effect tijdens lange focus
    if (this.controls.effecten.organischeGroei && this.getFocusDuur() > 180) {
      resultCanvas = this.pasOrganischeGroeiToe(resultCanvas);
    }
    
    return resultCanvas;
  }
  
  updateFocusData(focusData) {
    if (focusData && focusData.isFocus) {
      this.focusIntensiteit = Math.min(1.0, this.focusIntensiteit + this.config.focus.intensiteitToename);
      this.focusGeschiedenis.push({
        x: focusData.gazeX || 0.5,
        y: focusData.gazeY || 0.5,
        tijd: Date.now()
      });
    } else {
      this.focusIntensiteit = Math.max(0, this.focusIntensiteit * this.config.focus.intensiteitAfname);
    }
    
    // Beperk geschiedenis grootte
    if (this.focusGeschiedenis.length > this.maxGeschiedenis) {
      this.focusGeschiedenis.shift();
    }
  }
  
  // Gaze focus effect - geoptimaliseerd voor performance
  pasGazeFocusEffectToe(canvas) {
    if (this.focusGeschiedenis.length === 0) return canvas;
    
    const laatsteFocus = this.focusGeschiedenis[this.focusGeschiedenis.length - 1];
    const focusX = Math.floor(laatsteFocus.x * this.parent.canvasBreedte);
    const focusY = Math.floor(laatsteFocus.y * this.parent.canvasHoogte);
    const radius = Math.min(
      this.controls.performance.maxEffectRadius,
      Math.floor(this.config.focus.focusRadius.min + 
                 this.focusIntensiteit * this.controls.intensiteit.focusEffect *
                 (this.config.focus.focusRadius.max - this.config.focus.focusRadius.min))
    );
    
    // Performance optimalisatie: skip rows/columns
    const skipRows = this.controls.performance.skipRows;
    const skipCols = this.controls.performance.skipColumns;
    
    // Karakters vervangen in focus gebied met optimalisaties
    for (let y = Math.max(0, focusY - radius); y < Math.min(canvas.length, focusY + radius); y += skipRows + 1) {
      for (let x = Math.max(0, focusX - radius); x < Math.min(canvas[0].length, focusX + radius); x += skipCols + 1) {
        const afstand = Math.sqrt((x - focusX) ** 2 + (y - focusY) ** 2);
        
        if (afstand < radius) {
          const intensiteit = (1 - afstand / radius) * this.focusIntensiteit * this.controls.intensiteit.focusEffect;
          canvas[y][x] = this.krijgFocusKarakter(canvas[y][x], intensiteit);
        }
      }
    }
    
    return canvas;
  }
  
  // Evolutie effect - karakters worden complexer tijdens focus
  pasEvolutieEffectToe(canvas) {
    const evolutiePalette = this.effectPaletten.evolutie;
    const kans = this.focusIntensiteit * 0.1;
    
    for (let y = 0; y < canvas.length; y++) {
      for (let x = 0; x < canvas[y].length; x++) {
        if (Math.random() < kans) {
          // Gebruik evolutie palette karakters
          const karakterIndex = Math.floor(Math.random() * evolutiePalette.length);
          canvas[y][x] = evolutiePalette[karakterIndex];
        }
      }
    }
    
    return canvas;
  }
  
  // Neural effect - creëert eenvoudige patronen
  pasNeuralEffectToe(canvas) {
    const focusPalette = this.effectPaletten.focus;
    
    // Creëer eenvoudige focus lijnen
    if (this.focusGeschiedenis.length > 10) {
      for (let i = 1; i < this.focusGeschiedenis.length; i++) {
        if (Math.random() < 0.2) {
          const punt1 = this.focusGeschiedenis[i - 1];
          const punt2 = this.focusGeschiedenis[i];
          
          this.tekenEenvoudigeLijn(canvas, punt1, punt2, focusPalette);
        }
      }
    }
    
    return canvas;
  }
  
  // Organische groei - gebruikt basis karakters voor groei
  pasOrganischeGroeiToe(canvas) {
    const basisPalette = this.effectPaletten.basis;
    const groeikans = Math.min(0.05, this.focusIntensiteit * 0.02);
    
    // Groei patroon rond focus punten
    this.focusGeschiedenis.forEach(punt => {
      const centerX = Math.floor(punt.x * this.parent.canvasBreedte);
      const centerY = Math.floor(punt.y * this.parent.canvasHoogte);
      
      // Radiale groei met basis karakters
      for (let hoek = 0; hoek < Math.PI * 2; hoek += Math.PI / 6) {
        for (let r = 1; r <= 6; r++) {
          const x = Math.floor(centerX + Math.cos(hoek) * r);
          const y = Math.floor(centerY + Math.sin(hoek) * r * 0.8);
          
          if (x >= 0 && x < canvas[0].length && y >= 0 && y < canvas.length) {
            if (Math.random() < groeikans) {
              // Gebruik eenvoudige karakters voor groei
              const karakterIndex = Math.min(basisPalette.length - 1, Math.floor(Math.random() * 4) + 1);
              canvas[y][x] = basisPalette[karakterIndex];
            }
          }
        }
      }
    });
    
    return canvas;
  }
  
  // Hulp functie voor eenvoudige lijnen
  tekenEenvoudigeLijn(canvas, punt1, punt2, palette) {
    const x1 = Math.floor(punt1.x * this.parent.canvasBreedte);
    const y1 = Math.floor(punt1.y * this.parent.canvasHoogte);
    const x2 = Math.floor(punt2.x * this.parent.canvasBreedte);
    const y2 = Math.floor(punt2.y * this.parent.canvasHoogte);
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1, y = y1;
    
    while (true) {
      if (x >= 0 && x < canvas[0].length && y >= 0 && y < canvas.length) {
        if (Math.random() < 0.2) {
          // Gebruik eenvoudige karakters voor lijnen
          const karakterIndex = Math.min(palette.length - 1, Math.floor(Math.random() * 3) + 2);
          canvas[y][x] = palette[karakterIndex];
        }
      }
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }
  
  // Krijg aangepast karakter op basis van focus intensiteit
  krijgFocusKarakter(origineel, intensiteit) {
    if (intensiteit > 0.8) {
      return this.focusKarakters.intense[Math.floor(Math.random() * this.focusKarakters.intense.length)];
    } else if (intensiteit > 0.6) {
      return this.focusKarakters.sterk[Math.floor(Math.random() * this.focusKarakters.sterk.length)];
    } else if (intensiteit > 0.4) {
      return this.focusKarakters.medium[Math.floor(Math.random() * this.focusKarakters.medium.length)];
    } else {
      return this.focusKarakters.zwak[Math.floor(Math.random() * this.focusKarakters.zwak.length)];
    }
  }
  
  // Behandel blink gebeurtenissen met controls
  behandelBlink() {
    if (!this.controls.effecten.blink) return; // Skip als blink uitgeschakeld
    
    this.blinkTeller++;
    
    // Creëer ripple effect bij blink
    if (this.focusGeschiedenis.length > 0) {
      const laatsteFocus = this.focusGeschiedenis[this.focusGeschiedenis.length - 1];
      this.createBlinkRipple(laatsteFocus);
    }
  }
  
  createBlinkRipple(centrum) {
    // Voeg ripple data toe voor volgende frame
    this.rippleData = {
      centrum: centrum,
      tijd: Date.now(),
      maxRadius: 12
    };
  }
  
  getFocusDuur() {
    if (this.focusGeschiedenis.length < 2) return 0;
    
    const eerste = this.focusGeschiedenis[0];
    const laatste = this.focusGeschiedenis[this.focusGeschiedenis.length - 1];
    
    return (laatste.tijd - eerste.tijd) / 1000 * 60; // Convert naar frames
  }
  
  krijgHuidigeIntensiteit() {
    return this.focusIntensiteit;
  }
}
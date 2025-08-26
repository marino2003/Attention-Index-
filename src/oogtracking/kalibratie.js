/**
 * Kalibratie module voor Focus Tuin Eye-tracking
 * Geavanceerd 9-punts kalibratie systeem voor nauwkeurige gaze tracking
 */

export class OogKalibratie {
  constructor(oogDetectie) {
    this.oogDetectie = oogDetectie;
    this.isKalibreren = false;
    this.kalibratieStap = 0;
    this.kalibratieData = [];
    this.vereisteSamples = 5; // Aantal clicks per punt
    this.huidigeSamples = 0;
    
    // Kalibratie punten (9-punts grid)
    this.kalibratiePunten = [
      { x: 0.1, y: 0.1, naam: 'linksboven' },
      { x: 0.5, y: 0.1, naam: 'middenboven' },
      { x: 0.9, y: 0.1, naam: 'rechtsboven' },
      { x: 0.1, y: 0.5, naam: 'linksmidden' },
      { x: 0.5, y: 0.5, naam: 'centrum' },
      { x: 0.9, y: 0.5, naam: 'rechtsmidden' },
      { x: 0.1, y: 0.9, naam: 'linksonder' },
      { x: 0.5, y: 0.9, naam: 'middenonder' },
      { x: 0.9, y: 0.9, naam: 'rechtsonder' }
    ];
    
    // Kalibratie resultaten
    this.kalibratieMatrix = null;
    this.gemiddeldeAfwijking = null;
    
    // UI elementen
    this.kalibratieOverlay = null;
    this.kalibratieCircle = null;
    this.statusElement = null;
    this.voortgangElement = null;
    
    this.maakKalibratieUI();
    
    // Probeer opgeslagen kalibratie te laden
    if (this.laadKalibratieData()) {
      this.pasKalibratieToe();
    }
  }
  
  maakKalibratieUI() {
    // Maak overlay voor kalibratie
    this.kalibratieOverlay = document.createElement('div');
    this.kalibratieOverlay.id = 'kalibratie-overlay';
    this.kalibratieOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: none;
      cursor: crosshair;
    `;
    
    // Kalibratie cirkel
    this.kalibratieCircle = document.createElement('div');
    this.kalibratieCircle.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, #00ff88 0%, #00cc66 70%, transparent 100%);
      border: 2px solid #ffffff;
      box-shadow: 0 0 20px #00ff88;
      transform: translate(-50%, -50%);
      animation: kalibratePulse 1.5s ease-in-out infinite;
    `;
    
    // Status tekst
    this.statusElement = document.createElement('div');
    this.statusElement.style.cssText = `
      position: absolute;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    
    // Voortgang element
    this.voortgangElement = document.createElement('div');
    this.voortgangElement.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      color: #00ff88;
      font-size: 18px;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    
    // Voeg CSS animatie toe
    if (!document.getElementById('kalibratie-styles')) {
      const style = document.createElement('style');
      style.id = 'kalibratie-styles';
      style.textContent = `
        @keyframes kalibratePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Voeg elementen toe aan overlay
    this.kalibratieOverlay.appendChild(this.kalibratieCircle);
    this.kalibratieOverlay.appendChild(this.statusElement);
    this.kalibratieOverlay.appendChild(this.voortgangElement);
    
    // Voeg overlay toe aan document
    document.body.appendChild(this.kalibratieOverlay);
    
    // Event listeners
    this.kalibratieOverlay.addEventListener('click', (event) => {
      this.verwerkKalibratieClick(event);
    });
    
    this.kalibratieOverlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.stopKalibratie();
      }
    });
  }
  
  startKalibratie() {
    console.log('Start 9-punts oog kalibratie...');
    this.isKalibreren = true;
    this.kalibratieStap = 0;
    this.huidigeSamples = 0;
    this.kalibratieData = [];
    
    // Toon overlay en maak cursor zichtbaar
    this.kalibratieOverlay.style.display = 'block';
    this.kalibratieOverlay.focus();
    
    // Maak cursor zichtbaar tijdens kalibratie
    document.body.style.cursor = 'crosshair';
    
    // Verberg tuin tijdelijk
    const tuinContainer = document.getElementById('p5-canvas-container');
    if (tuinContainer) tuinContainer.style.display = 'none';
    
    this.toonVolgendePunt();
  }
  
  stopKalibratie() {
    console.log('Kalibratie gestopt');
    this.isKalibreren = false;
    this.kalibratieOverlay.style.display = 'none';
    
    // Herstel cursor naar verborgen voor installatie aesthetic
    document.body.style.cursor = 'none';
    
    // Toon tuin weer
    const tuinContainer = document.getElementById('p5-canvas-container');
    if (tuinContainer) tuinContainer.style.display = 'block';
  }
  
  toonVolgendePunt() {
    if (this.kalibratieStap >= this.kalibratiePunten.length) {
      this.voltooiKalibratie();
      return;
    }
    
    const punt = this.kalibratiePunten[this.kalibratieStap];
    const schermX = punt.x * window.innerWidth;
    const schermY = punt.y * window.innerHeight;
    
    // Positioneer cirkel
    this.kalibratieCircle.style.left = schermX + 'px';
    this.kalibratieCircle.style.top = schermY + 'px';
    
    // Update status
    this.statusElement.textContent = `Kijk naar de cirkel en klik ${this.vereisteSamples} keer`;
    this.updateVoortgang();
    
    this.huidigeSamples = 0;
    console.log(`Kalibratie punt ${this.kalibratieStap + 1}/${this.kalibratiePunten.length}: ${punt.naam}`);
  }
  
  verwerkKalibratieClick(event) {
    if (!this.isKalibreren) return;
    
    // Krijg huidige oog positie
    const oogPositie = this.oogDetectie.krijgHuidigeOogPositie();
    const punt = this.kalibratiePunten[this.kalibratieStap];
    
    if (oogPositie && oogPositie.x && oogPositie.y) {
      // Sla kalibratie data op
      this.kalibratieData.push({
        doelX: punt.x * window.innerWidth,
        doelY: punt.y * window.innerHeight,
        oogX: oogPositie.x,
        oogY: oogPositie.y,
        punt: punt.naam,
        timestamp: Date.now()
      });
      
      this.huidigeSamples++;
      this.updateVoortgang();
      
      console.log(`Sample ${this.huidigeSamples}/${this.vereisteSamples} voor punt ${punt.naam}`);
      
      if (this.huidigeSamples >= this.vereisteSamples) {
        this.kalibratieStap++;
        setTimeout(() => this.toonVolgendePunt(), 800);
      }
    } else {
      console.warn('Geen oog positie beschikbaar voor kalibratie');
    }
  }
  
  updateVoortgang() {
    const totaalPunten = this.kalibratiePunten.length;
    const totaalSamples = totaalPunten * this.vereisteSamples;
    const huidigeTotaal = this.kalibratieStap * this.vereisteSamples + this.huidigeSamples;
    
    const percentage = Math.round((huidigeTotaal / totaalSamples) * 100);
    
    this.voortgangElement.innerHTML = `
      Punt ${this.kalibratieStap + 1}/${totaalPunten} - 
      Sample ${this.huidigeSamples}/${this.vereisteSamples}<br>
      Totale voortgang: ${percentage}%
    `;
  }
  
  voltooiKalibratie() {
    console.log('Kalibratie voltooid! Verwerk resultaten...');
    this.statusElement.textContent = 'Kalibratie data verwerken...';
    this.voortgangElement.textContent = 'Berekening van correctie matrix...';
    
    // Bereken kalibratie matrix
    this.berekenKalibratieMatrix();
    
    // Sla kalibratie data op
    this.slaKalibratieDataOp();
    
    // Pas kalibratie toe op oog detectie
    this.pasKalibratieToe();
    
    // Verstuur event naar hoofdapplicatie
    const kalibratieEvent = new CustomEvent('kalibratieVoltooid', {
      detail: {
        nauwkeurigheid: this.gemiddeldeAfwijking,
        aantalPunten: this.kalibratieData.length,
        matrix: this.kalibratieMatrix
      }
    });
    document.dispatchEvent(kalibratieEvent);
    
    setTimeout(() => {
      this.statusElement.textContent = 'Kalibratie voltooid!';
      this.voortgangElement.innerHTML = `
        Nauwkeurigheid: ${this.gemiddeldeAfwijking?.toFixed(1)}px<br>
        Druk op ESC om door te gaan
      `;
      
      // Herstel cursor voor escape functionaliteit
      document.body.style.cursor = 'default';
      
      setTimeout(() => this.stopKalibratie(), 3000);
    }, 1500);
  }
  
  berekenKalibratieMatrix() {
    if (this.kalibratieData.length === 0) return;
    
    // Groepeer data per punt
    const puntData = {};
    this.kalibratieData.forEach(sample => {
      if (!puntData[sample.punt]) {
        puntData[sample.punt] = { doel: [], oog: [] };
      }
      puntData[sample.punt].doel.push({ x: sample.doelX, y: sample.doelY });
      puntData[sample.punt].oog.push({ x: sample.oogX, y: sample.oogY });
    });
    
    // Bereken gemiddelde per punt
    const gemiddeldePunten = [];
    Object.keys(puntData).forEach(puntNaam => {
      const doel = puntData[puntNaam].doel;
      const oog = puntData[puntNaam].oog;
      
      const gemDoel = {
        x: doel.reduce((sum, p) => sum + p.x, 0) / doel.length,
        y: doel.reduce((sum, p) => sum + p.y, 0) / doel.length
      };
      
      const gemOog = {
        x: oog.reduce((sum, p) => sum + p.x, 0) / oog.length,
        y: oog.reduce((sum, p) => sum + p.y, 0) / oog.length
      };
      
      gemiddeldePunten.push({ doel: gemDoel, oog: gemOog });
    });
    
    // Eenvoudige lineaire transformatie matrix
    const offsetX = gemiddeldePunten.reduce((sum, p) => sum + (p.doel.x - p.oog.x), 0) / gemiddeldePunten.length;
    const offsetY = gemiddeldePunten.reduce((sum, p) => sum + (p.doel.y - p.oog.y), 0) / gemiddeldePunten.length;
    
    this.kalibratieMatrix = { offsetX, offsetY };
    
    // Bereken gemiddelde afwijking
    const afwijkingen = gemiddeldePunten.map(p => {
      const correctedX = p.oog.x + offsetX;
      const correctedY = p.oog.y + offsetY;
      return Math.sqrt(Math.pow(p.doel.x - correctedX, 2) + Math.pow(p.doel.y - correctedY, 2));
    });
    
    this.gemiddeldeAfwijking = afwijkingen.reduce((sum, a) => sum + a, 0) / afwijkingen.length;
    
    console.log('Kalibratie matrix:', this.kalibratieMatrix);
    console.log('Gemiddelde afwijking:', this.gemiddeldeAfwijking.toFixed(1) + 'px');
  }
  
  pasKalibratieToe() {
    if (this.kalibratieMatrix && this.oogDetectie) {
      // Stuur kalibratie naar Python backend
      if (this.oogDetectie.socket) {
        this.oogDetectie.socket.emit('calibrate_gaze', {
          offset_x: this.kalibratieMatrix.offsetX / window.innerWidth,
          offset_y: this.kalibratieMatrix.offsetY / window.innerHeight,
          schaal_x: 1.0,
          schaal_y: 1.0
        });
      }
      
      console.log('Kalibratie toegepast op oog detectie systeem');
    }
  }
  
  slaKalibratieDataOp() {
    // Sla kalibratie data op in localStorage voor persistentie
    try {
      const kalibratieData = {
        matrix: this.kalibratieMatrix,
        nauwkeurigheid: this.gemiddeldeAfwijking,
        schermBreedte: window.innerWidth,
        schermHoogte: window.innerHeight,
        timestamp: Date.now(),
        aantalSamples: this.kalibratieData.length
      };
      
      localStorage.setItem('focusTuin_kalibratie', JSON.stringify(kalibratieData));
      console.log('Kalibratie data opgeslagen in localStorage');
    } catch (error) {
      console.warn('Kon kalibratie data niet opslaan:', error);
    }
  }
  
  laadKalibratieData() {
    // Laad opgeslagen kalibratie data
    try {
      const opgeslagenData = localStorage.getItem('focusTuin_kalibratie');
      if (opgeslagenData) {
        const kalibratieData = JSON.parse(opgeslagenData);
        
        // Controleer of data geldig is voor huidige schermgrootte
        const schermVerschil = Math.abs(kalibratieData.schermBreedte - window.innerWidth) + 
                              Math.abs(kalibratieData.schermHoogte - window.innerHeight);
        
        if (schermVerschil < 100) { // Accepteer kleine verschillen
          this.kalibratieMatrix = kalibratieData.matrix;
          this.gemiddeldeAfwijking = kalibratieData.nauwkeurigheid;
          
          console.log('Opgeslagen kalibratie geladen:', kalibratieData.nauwkeurigheid.toFixed(1) + 'px');
          return true;
        } else {
          console.log('Opgeslagen kalibratie niet compatibel met huidige schermgrootte');
        }
      }
    } catch (error) {
      console.warn('Kon kalibratie data niet laden:', error);
    }
    return false;
  }
  
  krijgKalibratieStatus() {
    return {
      isGekalibreerd: this.kalibratieMatrix !== null,
      nauwkeurigheid: this.gemiddeldeAfwijking,
      aantalPunten: this.kalibratieData.length,
      laatsteKalibratie: this.kalibratieData.length > 0 ? 
        Math.max(...this.kalibratieData.map(d => d.timestamp)) : null
    };
  }
}
// Planten generatie module
// Generatieve kunst voor de focus tuin

export class PlantenGenerator {
  constructor(zaadGetal) {
    this.zaadGetal = zaadGetal;
    this.planten = [];
    this.groeiFactor = 0;
    this.maxPlanten = 12;
    this.targetFPS = 60;
    this.animatieOffset = 0;
  }

  initialiseerTuin(p5Instance) {
    this.p5 = p5Instance;
    this.planten = [];
    
    this.p5.noiseSeed(this.zaadGetal);
    this.p5.randomSeed(this.zaadGetal);
    
    this.creeerPlantenPosities();
  }

  creeerPlantenPosities() {
    const centrumX = this.p5.width * 0.5;
    const centrumY = this.p5.height * 0.5;
    
    for (let i = 0; i < this.maxPlanten; i++) {
      const hoek = (i / this.maxPlanten) * this.p5.TWO_PI + this.p5.random(-0.6, 0.6);
      const afstand = this.p5.random(80, 300);
      const x = centrumX + this.p5.cos(hoek) * afstand;
      const y = centrumY + this.p5.sin(hoek) * afstand;
      
      const plant = {
        x: x,
        y: y,
        basisHoek: hoek,
        segmenten: this.p5.random(8, 20),
        kleurPalet: this.genereerKleurPalet(),
        groei: 0,
        doelGroei: 0,
        maxHoogte: this.p5.random(60, 180),
        plantType: this.p5.floor(this.p5.random(5)),
        organischZaad: this.p5.random(10000),
        animatieSnelheid: this.p5.random(0.5, 1.5),
        flexibiliteit: this.p5.random(0.3, 1.2),
        complexiteit: this.p5.random(0.4, 1.0),
        takkenData: [],
        bloeiStadium: 0
      };
      
      this.initPlantData(plant);
      this.planten.push(plant);
    }
  }

  genereerKleurPalet() {
    const basisKleur = this.p5.random(360);
    return {
      basis: basisKleur,
      accent: (basisKleur + this.p5.random(60, 120)) % 360,
      highlight: (basisKleur + this.p5.random(180, 240)) % 360,
      verzadiging: this.p5.random(60, 90),
      helderheid: this.p5.random(70, 95)
    };
  }

  initPlantData(plant) {
    plant.takkenData = [];
    for (let i = 0; i < plant.segmenten; i++) {
      plant.takkenData.push({
        fase: this.p5.random(this.p5.TWO_PI),
        amplitude: this.p5.random(0.5, 2),
        snelheid: this.p5.random(0.01, 0.03)
      });
    }
  }

  updateGroei(isFocus) {
    this.animatieOffset += 0.016;
    
    const doelGroeiFactor = isFocus ? 1.0 : 0;
    this.groeiFactor = this.p5.lerp(this.groeiFactor, doelGroeiFactor, 0.02);

    this.planten.forEach(plant => {
      plant.doelGroei = isFocus ? 1.0 : 0;
      plant.groei = this.p5.lerp(plant.groei, plant.doelGroei, 0.015);
      
      if (isFocus && plant.groei > 0.7) {
        plant.bloeiStadium = this.p5.min(plant.bloeiStadium + 0.008, 1.0);
      } else {
        plant.bloeiStadium = this.p5.max(plant.bloeiStadium - 0.004, 0);
      }
      
      plant.takkenData.forEach(tak => {
        tak.fase += tak.snelheid;
      });
    });
  }

  tekenTuin() {
    // Plant rendering completely disabled for ASCII art focus
    // All growth detection logic remains active in updateGroei()
    // Plants continue to grow in the background but are not visually displayed
  }

  tekenPlant(plant, plantIndex) {
    // Plant visual rendering disabled - ASCII art system is the primary visual component
    // All plant growth data and logic remains fully functional for focus feedback
  }

  krijgGroeiFactor() {
    return this.groeiFactor;
  }
}
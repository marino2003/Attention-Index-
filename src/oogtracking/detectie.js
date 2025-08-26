// Python Backend Eye-tracking detectie module
// Verbindt met Python Flask-SocketIO server voor echte oogtracking

import { FOCUS_ZONE_CONFIG } from '../core/focus_zone_config.js';
import { afstandTotCentrum } from '../utils/math_utils.js';

export class OogDetectie {
  constructor() {
    this.isGereed = false;
    this.huidigeOogPositie = { x: 0, y: 0 };
    this.focusGeschiedenis = [];
    
    // Use centralized configuration
    this.nauwkeurigheidDrempel = FOCUS_ZONE_CONFIG.detection.horizontaleTolerantie;
    this.stabilisatieTijd = FOCUS_ZONE_CONFIG.detection.stabilisatieTijd;
    this.minimaleConfidence = FOCUS_ZONE_CONFIG.detection.minimaleConfidence;
    this.focusGeschiedenisGrootte = FOCUS_ZONE_CONFIG.detection.focusGeschiedenisGrootte;
    this.laatsteFocusTijd = 0;
    
    // Socket connection
    this.socket = null;
    this.backendUrl = 'http://localhost:5001';
    
    // Prevent duplicate initialization
    this.initialiseerBezig = false;
    
    // Debug tracking
    this.debugInfo = {
      dataCount: 0,
      lastDataTime: 0,
      isConnected: false,
      lastGazeData: null
    };
    

  }

  async initialiseerOogtracking() {
    // Prevent duplicate initialization
    if (this.socket && this.socket.connected) {
      console.log('Eye tracking already initialized and connected, skipping duplicate initialization');
      return;
    }
    
    // Prevent multiple initialization attempts
    if (this.initialiseerBezig) {
      console.log('Eye tracking initialization already in progress, skipping');
      return;
    }
    
    this.initialiseerBezig = true;
    
    try {
      console.log('Python Eye-tracking backend initialisatie...');
      
      // Wacht tot DOM volledig geladen is
      await this.wachtOpDOMReady();
      
      // Probeer verbinding met Python backend
      await this.verbindMetBackend();
      
    } catch (error) {
      console.error('Eye-tracking backend fout:', error);
      this.handleVerbindingsFout();
    } finally {
      this.initialiseerBezig = false;
    }
  }

  async wachtOpDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  async verbindMetBackend() {
    try {
      // Controleer of Socket.IO beschikbaar is
      if (typeof io === 'undefined') {
        throw new Error('Socket.IO library niet geladen');
      }

      console.log('Verbinden met Python backend op:', this.backendUrl);
      
      // Maak WebSocket verbinding
      this.socket = io(this.backendUrl);
      
      // Setup event listeners
      this.setupSocketEvents();
      
      // Wacht op verbinding
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('Verbinding timeout na 5 seconden');
          reject(new Error('Verbinding timeout'));
        }, 5000);
        
        this.socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('Verbonden met Python backend');
          this.debugInfo.isConnected = true;
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Verbindingsfout:', error);
          reject(error);
        });
      });
      
      // Start eye tracking op backend
      this.startBackendTracking();
      
    } catch (error) {
      console.error('Backend verbinding fout:', error);
      throw error;
    }
  }

  setupSocketEvents() {
    if (!this.socket) return;
    
    // Ontvang gaze data van Python backend
    this.socket.on('gaze_data', (data) => {
      // Update debug info
      this.debugInfo.dataCount++;
      this.debugInfo.lastDataTime = Date.now();
      this.debugInfo.lastGazeData = data;
      
      this.verwerkOogData({
        x: data.x,
        y: data.y,
        confidence: data.confidence || 1.0
      }, data.timestamp || Date.now());
      
      // Update debug display
    });
    

    
    // Luister naar kalibratie events
    this.socket.on('calibration_applied', (data) => {
      console.log('Kalibratie toegepast:', data);
    });
    
    this.socket.on('calibration_error', (data) => {
      console.error('Kalibratie fout:', data.error);
    });
    
    // ASCII webcam frames from backend - ESSENTIAL for ASCII art system
    this.socket.on('ascii_webcam_frame', (frameData) => {
      // Forward webcam frame data to ASCII art system
      this.handleWebcamFrameForASCII(frameData);
    });
    
    // ASCII webcam frames from backend - ESSENTIAL for ASCII art system
    this.socket.on('ascii_webcam_frame', (frameData) => {
      // Forward webcam frame data to ASCII art system
      this.handleWebcamFrameForASCII(frameData);
    });
    

    
    // Debug preview functionality removed - use standalone debug-camera.bat instead
    
    // Verbindingsstatus updates
    this.socket.on('connection_status', (data) => {
      console.log('📡 Backend status:', data.message);
    });
    
    // Tracking status updates
    this.socket.on('tracking_status', (data) => {
      console.log('Tracking status:', data.message);
      
      if (data.status === 'started') {
        this.isGereed = true;
      }
    });
    
    // Error handling
    this.socket.on('tracking_error', (data) => {
      console.error('Tracking error:', data.error);
      this.handleVerbindingsFout();
    });
    
    // Verbinding verloren
    this.socket.on('disconnect', () => {
      console.warn('⚠️ Verbinding met backend verloren');
      this.isGereed = false;
      this.debugInfo.isConnected = false;
      this.handleVerbindingsFout();
    });
  }

  startBackendTracking() {
    if (!this.socket) return;
    
    // Verstuur schermresolutie naar backend
    const screenData = {
      screen_width: window.innerWidth,
      screen_height: window.innerHeight
    };
    
    console.log('Start eye tracking op backend...', screenData);
    this.socket.emit('start_tracking', screenData);
  }

  handleVerbindingsFout() {
    console.log('Terugval naar muis-tracking...');
    
    // Fallback naar muis tracking
    this.initialiseerMuisTracking();
    
    setTimeout(() => {
      this.isGereed = true;
      console.log('Muis-tracking fallback gereed');
    }, 1000);
  }

  initialiseerMuisTracking() {
    console.log('Muis-tracking fallback opzetten...');
    
    // Muis beweging tracking
    document.addEventListener('mousemove', (event) => {
      if (this.isGereed) {
        this.verwerkOogData({ x: event.clientX, y: event.clientY, confidence: 0.8 }, Date.now());
      }
    });
    
    // Click voor extra focus feedback
    document.addEventListener('click', (event) => {
      if (this.isGereed) {
        const clickData = { x: event.clientX, y: event.clientY, confidence: 1.0 };
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            this.verwerkOogData(clickData, Date.now());
          }, i * 30);
        }
      }
    });
  }



  verwerkOogData(oogData, tijdstempel) {
    if (!this.isGereed || !oogData || typeof oogData.x !== 'number' || typeof oogData.y !== 'number') {
      return;
    }

    try {
      // Handmatige viewport bounding
      const boundedPrediction = {
        x: Math.max(0, Math.min(oogData.x, window.innerWidth)),
        y: Math.max(0, Math.min(oogData.y, window.innerHeight)),
        confidence: oogData.confidence || 1.0
      };
      
      // Sla verbeterde data op
      this.huidigeOogPositie = boundedPrediction;
      
      // Voeg data toe aan geschiedenis voor stabiliteit
      this.focusGeschiedenis.push({
        x: boundedPrediction.x,
        y: boundedPrediction.y,
        tijd: tijdstempel,
        confidence: boundedPrediction.confidence
      });

      // Behoud alleen recente geschiedenis (gebruik configureerbare grootte)
      const huidigeTijd = tijdstempel;
      this.focusGeschiedenis = this.focusGeschiedenis.filter(
        punt => huidigeTijd - punt.tijd < this.focusGeschiedenisGrootte
      );

      // Bereken gemiddelde positie voor stabiliteit
      const gemiddeldePositie = this.berekenGemiddeldePositie();
      
      // Controleer focus met verbeterde logica
      this.controleerFocus(gemiddeldePositie, tijdstempel);
      
      // BELANGRIJK: Verstuur visuele positie update voor elke gaze data
      // Dit zorgt voor continue visual feedback van waar de gebruiker kijkt
      this.triggerPositieEvent(gemiddeldePositie);
      
    } catch (error) {
      console.warn('Data verwerking fout:', error);
    }
  }

  berekenGemiddeldePositie() {
    if (this.focusGeschiedenis.length === 0) {
      return this.huidigeOogPositie;
    }

    // Gewogen gemiddelde op basis van confidence
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;
    
    this.focusGeschiedenis.forEach(punt => {
      const weight = punt.confidence || 1.0;
      totalX += punt.x * weight;
      totalY += punt.y * weight;
      totalWeight += weight;
    });
    
    return {
      x: totalX / totalWeight,
      y: totalY / totalWeight,
      confidence: totalWeight / this.focusGeschiedenis.length
    };
  }

  controleerFocus(positie, tijdstempel) {
    const centrumX = window.innerWidth / 2;
    const centrumY = window.innerHeight / 2;
    
    // Calculate total distance from center using utility function
    const totalAfstand = afstandTotCentrum(positie, centrumX, centrumY);

    // SIMPLIFIED FOCUS LOGIC: Use visual representation with increased tolerance for better UX
    // Visual outer ring (buitenste) is where you lose life - make this more forgiving
    const visualRadius = FOCUS_ZONE_CONFIG.visual.basisStraal; // 20px
    const outerRingRadius = visualRadius * FOCUS_ZONE_CONFIG.visual.rings.buitenste; // 20 * 1.4 = 28px
    
    // Increased tolerance: Give players more room for natural eye movement
    // Add 40% buffer beyond visual circle for more forgiving experience
    const toleranceMultiplier = 1.4; // Increased from no multiplier
    const actualTolerance = outerRingRadius * toleranceMultiplier; // 28 * 1.4 = ~39px
    
    // Larger hysteresis to prevent flickering and accidental life loss
    const hysteresis = 6; // Increased from 3px to 6px for more stability
    
    let focusThreshold;
    if (this.laatsteFocusTijd === 0) {
      // Not in focus - use smaller threshold to enter (easier to get in)
      focusThreshold = actualTolerance - hysteresis; // ~33px
    } else {
      // Already in focus - use larger threshold to exit (much harder to lose)
      focusThreshold = actualTolerance + hysteresis; // ~45px
    }
    
    const isInFocus = totalAfstand <= focusThreshold;
    
    if (this.laatsteFocusTijd === 0) {
      // Not currently in focus - check if entering
      if (isInFocus) {
        this.laatsteFocusTijd = tijdstempel;
        if (this.debugInfo.dataCount % 30 === 0) {
          console.log(`Focus betreden: afstand=${totalAfstand.toFixed(1)}px <= ${focusThreshold.toFixed(1)}px`);
        }
      }
    } else {
      // Currently in focus - check for exit or stability
      if (!isInFocus) {
        // Exit focus immediately when outside boundary
        if (this.debugInfo.dataCount % 10 === 0) {
          console.log(`Focus verloren: afstand=${totalAfstand.toFixed(1)}px > ${focusThreshold.toFixed(1)}px`);
        }
        this.triggerFocusEvent(false, positie, totalAfstand);
        this.laatsteFocusTijd = 0;
        return;
      }
      
      // Still in focus - check if stable enough to activate
      const focusDuur = tijdstempel - this.laatsteFocusTijd;
      if (focusDuur >= this.stabilisatieTijd) {
        this.triggerFocusEvent(true, positie, totalAfstand);
      }
    }
  }

  triggerFocusEvent(isFocus, positie, afstand) {
    // Event voor hoofdsysteem
    const focusEvent = new CustomEvent('oogFocusVeranderd', {
      detail: {
        isFocus: isFocus,
        positie: positie,
        afstand: afstand,
        nauwkeurigheid: Math.max(0, 1 - (afstand / this.nauwkeurigheidDrempel)),
        confidence: positie.confidence || 1.0
      }
    });
    
    document.dispatchEvent(focusEvent);
  }
  
  triggerPositieEvent(positie) {
    // Continue visuele feedback voor oog positie
    const positieEvent = new CustomEvent('oogPositieUpdate', {
      detail: {
        positie: positie,
        confidence: positie.confidence || 1.0,
        timestamp: Date.now()
      }
    });
    
    // Debug logging disabled for cleaner console
    // console.log('🔄 TRIGGER: oogPositieUpdate event:', {
    //   x: positie.x.toFixed(1),
    //   y: positie.y.toFixed(1),
    //   confidence: positie.confidence
    // });
    
    document.dispatchEvent(positieEvent);
  }

  calibrateGaze(offsetX, offsetY, reset = false) {
    if (!this.socket) {
      console.warn('Geen verbinding met backend voor kalibratie');
      return;
    }
    
    if (reset) {
      // Reset kalibratie
      this.socket.emit('calibrate_gaze', {
        offset_x: 0.0,
        offset_y: 0.0,
        schaal_x: 1.5,
        schaal_y: 1.3
      });
      console.log('Kalibratie gereset');
    } else {
      // Pas kalibratie aan
      this.socket.emit('calibrate_gaze', {
        offset_x: offsetX,
        offset_y: offsetY,
        schaal_x: 1.5,
        schaal_y: 1.3
      });
      console.log(`Kalibratie aangepast: x=${offsetX}, y=${offsetY}`);
    }
  }
  
  krijgHuidigeOogPositie() {
    return this.huidigeOogPositie || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }



  stopOogtracking() {
    if (this.socket) {
      this.socket.emit('stop_tracking');
      this.socket.disconnect();
    }
    console.log('🛑 Eye-tracking gestopt');
  }
  
  // Handle webcam frames from backend and forward to ASCII art system
  handleWebcamFrameForASCII(frameData) {
    // Forward to global ASCII art system if available
    if (window.focusTuin && window.focusTuin.applicatie && window.focusTuin.applicatie.asciiKunst) {
      window.focusTuin.applicatie.asciiKunst.processWebcamFrameFromBackend(frameData);
    }
    
    // Also dispatch as custom event for other components
    document.dispatchEvent(new CustomEvent('webcamFrameReceived', {
      detail: frameData
    }));
  }
  

}
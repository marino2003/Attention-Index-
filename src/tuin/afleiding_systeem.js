// Afleiding Systeem - Aandacht Economie Distractie Mechanismen
// Implementeert subtiele en niet-zo-subtiele afleidingen om gebruikers focus te verstoren
// Thema: Surveillance kapitaal en aandacht als commodity

import { AfleidingConfig, AfleidingPresets } from './afleiding_config.js';
import { audioManager } from '../audio/audio_manager.js';

export class AfleidingSysteem {
  constructor(parentApplicatie) {
    this.parent = parentApplicatie;
    this.isActief = true;
    this.sessionStartTijd = Date.now();
    
    // Load configuration
    this.config = AfleidingConfig;
    this.currentPreset = 'standaard';
    this.performanceMetrics = {
      recentEvents: [],
      performance: { current: 1.0, baseline: 1.0 },
      focusHistory: [],
      interactionHistory: []
    };
    
    // Afleiding timers en intervals
    this.popupTimer = null;
    this.surveillanceUpdateTimer = null;
    this.glitchTimer = null;
    this.scanlineTimer = null;
    this.dashboardUpdateTimer = null;
    this.balanceCheckTimer = null;
    
    // Afleiding state - removed surveillance level
    this.aandachtSchuld = 0;
    this.cognitieveOogst = 0;
    this.focusEfficiency = 0;
    this.systemLearnProgress = 0;
    this.overwhemlDetected = false;
    
    // Apply current preset
    this.applyPreset(this.currentPreset);
    
    // UI elementen voor distracties
    this.popupContainer = null;
    this.surveillancePanel = null;
    this.glitchOverlay = null;
    this.dashboardContainer = null;
    this.pseudoControls = null;
    
    this.initialiseer();
  }
  
  initialiseer() {
    this.createUIElementen();
    this.startAfleidingCyclus();
    this.startBalanceMonitoring();
    console.log(`🎯 Afleiding systeem geactiveerd - ${this.currentPreset} modus`);
  }
  
  applyPreset(presetNaam) {
    const preset = AfleidingPresets[presetNaam];
    if (preset) {
      this.config.importSettings(preset);
      this.currentPreset = presetNaam;
      console.log(`📊 Preset toegepast: ${presetNaam}`);
    }
  }
  
  startBalanceMonitoring() {
    // Monitor performance en pas automatisch aan
    this.balanceCheckTimer = setInterval(() => {
      this.checkAndAdjustBalance();
    }, 15000); // Check elke 15 seconden
  }
  
  checkAndAdjustBalance() {
    // Check of gebruiker overweldigd raakt
    const overwheml = this.config.balancingMethods.checkOverwhelm(
      this.performanceMetrics.recentEvents,
      this.performanceMetrics.performance
    );
    
    if (overwheml && !this.overwhemlDetected) {
      this.overwhemlDetected = true;
      this.reduceIntensity();
      console.log('Overwelming gedetecteerd - intensiteit verlaagd');
    } else if (!overwheml && this.overwhemlDetected) {
      this.overwhemlDetected = false;
      console.log('Balans hersteld');
    }
    
    // Auto-adjust configuratie
    if (this.config.balans.adaptiveScaling) {
      const newConfig = this.config.balancingMethods.autoAdjust(
        this.config,
        this.performanceMetrics
      );
      Object.assign(this.config, newConfig);
    }
  }
  
  reduceIntensity() {
    // Tijdelijk de intensiteit verlagen
    this.config.intensiteit.master *= 0.7;
    this.config.timing.popupMinInterval *= 1.5;
    
    // Reset na een tijd
    setTimeout(() => {
      this.config.intensiteit.master /= 0.7;
      this.config.timing.popupMinInterval /= 1.5;
    }, 60000); // Reset na 1 minuut
  }
  
  createUIElementen() {
    // Maak popup container
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'afleiding-popups';
    this.popupContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      font-family: 'CATelecopy-Regular', monospace;
    `;
    document.body.appendChild(this.popupContainer);
    
    // Maak surveillance panel
    this.surveillancePanel = document.createElement('div');
    this.surveillancePanel.id = 'surveillance-feedback';
    this.surveillancePanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 20, 0, 0.8);
      border: 1px solid #00ff00;
      padding: 10px;
      font-family: 'CATelecopy-Regular', monospace;
      font-size: 10px;
      color: #00ff00;
      min-width: 200px;
      opacity: 0.7;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(this.surveillancePanel);
    
    // Maak glitch overlay
    this.glitchOverlay = document.createElement('div');
    this.glitchOverlay.id = 'glitch-overlay';
    this.glitchOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 8888;
      opacity: 0;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 0, 0, 0.1) 20%, 
        transparent 21%, 
        rgba(0, 255, 0, 0.1) 40%, 
        transparent 41%,
        rgba(0, 0, 255, 0.1) 60%, 
        transparent 61%
      );
      transition: opacity 0.1s ease;
    `;
    document.body.appendChild(this.glitchOverlay);
    
    // Maak aandacht economie dashboard - DISABLED to reduce UI clutter
    // this.dashboardContainer = document.createElement('div');
    // this.dashboardContainer.id = 'aandacht-dashboard';
    // document.body.appendChild(this.dashboardContainer);
    
    // Maak pseudo-interactieve elementen
    this.createPseudoControls();
  }
  
  createPseudoControls() {
    this.pseudoControls = document.createElement('div');
    this.pseudoControls.id = 'pseudo-controls';
    this.pseudoControls.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 7777;
      pointer-events: none;
    `;
    
    // Creëer nepknoppen die lijken alsof ze controle geven
    const nepButtons = [
      'STOP EXTRACTIE',
      'PRIVACY MODUS',
      'BEËINDIG SESSIE',
      'BLOKKEER TOEGANG'
    ];
    
    nepButtons.forEach((text, index) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        display: block;
        margin: 5px 0;
        padding: 8px 15px;
        background: rgba(255, 255, 0, 0.2);
        border: 1px solid #ffff00;
        color: #ffff00;
        font-family: 'CATelecopy-Regular', monospace;
        font-size: 10px;
        cursor: pointer;
        pointer-events: all;
        transition: all 0.2s ease;
      `;
      
      // Maak buttons functioneel maar misleidend
      button.addEventListener('click', () => {
        this.handlePseudoButtonClick(text, button);
      });
      
      this.pseudoControls.appendChild(button);
    });
    
    document.body.appendChild(this.pseudoControls);
  }
  
  startAfleidingCyclus() {
    // Start popup systeem
    this.scheduleNextPopup();
    
    // Start surveillance feedback updates
    this.surveillanceUpdateTimer = setInterval(() => {
      this.updateSurveillanceFeedback();
    }, this.config.surveillance.updateInterval);
    
    // Start visual glitch systeem - DISABLED
    // this.scheduleNextGlitch();
    
    // Start vintage TV scanline system
    this.scheduleNextScanline();
    
    // Start dashboard updates - DISABLED to reduce clutter
    // this.dashboardUpdateTimer = setInterval(() => {
    //   this.updateAandachtDashboard();
    // }, 3000);
  }
  
  scheduleNextPopup() {
    if (!this.isActief) {
      console.log('AfleidingSysteem not active, skipping popup scheduling');
      return;
    }
    
    // Focus-time based difficulty scaling - FIXED: shorter intervals = faster popups
    const focusTime = this.parent?.focusStartTijd ? (Date.now() - this.parent.focusStartTijd) / 1000 : 0;
    const difficultyMultiplier = Math.max(0.1, 1 - (focusTime * 0.05)); // Gets FASTER (smaller intervals) with focus time
    
    // Gebruik configuratie voor optimale timing
    const optimalTiming = this.config.balancingMethods.calculateOptimalTiming(
      Date.now() - this.sessionStartTijd,
      this.performanceMetrics.focusHistory,
      this.performanceMetrics.interactionHistory
    );
    
    // Apply master intensity multiplier and focus-based difficulty
    const finalInterval = (optimalTiming / this.config.intensiteit.master / this.config.intensiteit.popup) * difficultyMultiplier;
    
    // Respect minimum interval from config
    const safeInterval = Math.max(
      this.config.timing.popupMinInterval * difficultyMultiplier,
      finalInterval
    );
    
    console.log(`Next popup in ${(safeInterval/1000).toFixed(1)}s (focus: ${focusTime.toFixed(1)}s, diff: ${difficultyMultiplier.toFixed(2)})`); // Debug log
    
    this.popupTimer = setTimeout(() => {
      if (this.shouldShowPopup()) {
        console.log('Showing distraction popup'); // Debug log
        this.toonAfleidingPopup();
      } else {
        console.log('Popup conditions not met, skipping'); // Debug log
      }
      this.scheduleNextPopup();
    }, safeInterval + Math.random() * 2000);
  }
  
  shouldShowPopup() {
    // Check of we popups moeten tonen op basis van configuratie
    if (this.parent && this.parent.isDood) {
      console.log('Popup blocked: User is dead');
      return false;
    }
    
    // Check focus time requirement
    const timeSinceFocus = Date.now() - (this.parent?.focusStartTijd || 0);
    if (timeSinceFocus < this.config.balans.minFocusTimeForDistractions) {
      console.log(`❌ Popup blocked: Need ${this.config.balans.minFocusTimeForDistractions}ms focus, only ${timeSinceFocus}ms`);
      return false;
    }
    
    // Check overwhelm state
    if (this.overwhemlDetected) {
      const show = Math.random() < 0.3;
      console.log(`⚠️ Overwhelm detected, ${show ? 'showing' : 'skipping'} popup (30% chance)`);
      return show; // 30% kans tijdens overwhelm
    }
    
    console.log('Popup conditions met - showing popup');
    return true;
  }
  
  toonAfleidingPopup() {
    const popupTypes = [
      'AANDACHT_HARVESTING',
      'SYSTEEMMELDING',
      'VALSE_WAARSCHUWING',
      'COGNITIEVE_SCHULD',
      'PSEUDO_CONTROLE'
    ];
    
    const type = popupTypes[Math.floor(Math.random() * popupTypes.length)];
    const popup = this.createPopup(type);
    
    // Positioneer popup random op scherm met veilige marges
    // Ensure popups stay within viewport with 10% margin on all sides
    const safeMargin = 10; // 10% margin from edges
    const xRange = 100 - (safeMargin * 2); // 80% of screen width
    const yRange = 100 - (safeMargin * 2); // 80% of screen height
    
    const x = safeMargin + (Math.random() * xRange);
    const y = safeMargin + (Math.random() * yRange);
    
    popup.style.left = x + '%';
    popup.style.top = y + '%';
    
    if (this.popupContainer) {
      this.popupContainer.appendChild(popup);
      
      // Play popup sound effect
      audioManager.playPopupSound();
    }
    
    // Auto-remove na een tijd
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 3000 + Math.random() * 4000);
  }
  
  createPopup(type) {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff4444;
      padding: 10px 15px;
      color: #ff4444;
      font-family: 'CATelecopy-Regular', monospace;
      font-size: 12px;
      pointer-events: all;
      cursor: pointer;
      animation: popupGlow 2s infinite alternate;
      box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
      z-index: 10000;
      min-width: 150px;
      min-height: 60px;
    `;
    
    let content = 'SYSTEEM FOUT'; // Default content to prevent empty popups
    let isClickable = false;
    
    switch(type) {
      case 'ATTENTIEMONITORING ACTIEF':
        content = `
          <div style="text-align: center; color: #ff4444;">
            <strong>Uw blik wordt geanonimiseerd geregistreerd voor het onderzoek naar gebruiksbelasting en welzijn<br/>
            <small style="color: #ffff44;">WEERSTAND IS NUTTELOOS</small>
          </div>
        `;
        break;
        
      case 'SYSTEEMMELDING':
        content = `
          <div style="color: #ff6666;">
            <strong>U WORDT BEKEKEN</strong><br/>
            Kleine bewegingen worden geanalyseerd<br/>
            <small>helpt modellen om responsies op druk en stress te voorspellen</small>
          </div>
        `;
        break;
        
      case 'VALSE_WAARSCHUWING':
        content = `
          <div style="color: #ffff00;">
            <strong>⚠ WAARSCHUWING:</strong><br/>
            Afwijkend aandachtsprofiel gedetecteerd<br/>
            <small>Blijf zo mogelijk rustig</small>
          </div>
        `;
        break;
        
      case 'COGNITIEVE_SCHULD':
        this.aandachtSchuld += 10;
        content = `
          <div style="color: #ff8844;">
            <strong>AANDACHT INGENOMEN</strong><br/>
            +10 FOCUS EENHEDEN GEËXTRAHEERD<br/>
            Schuld: ${this.aandachtSchuld} eenheden
          </div>
        `;
        break;
        
      case 'PSEUDO_CONTROLE':
        content = `
          <div style="color: #ff4444;">
            <strong>ONTSNAPPINGSPOGING GEDETECTEERD</strong><br/>
            U kunt niet stoppen met kijken<br/>
            <small style="color: #ffff44;">FEED US DATA</small>
          </div>
        `;
        isClickable = true;
        break;
    }
    
    popup.innerHTML = content;
    
    // Ensure content is never empty
    if (!popup.innerHTML.trim()) {
      popup.innerHTML = '<div style="color: #ff4444;"><strong>SYSTEEM ACTIEF</strong><br/>Focus vereist</div>';
    }
    
    if (isClickable) {
      popup.addEventListener('click', () => {
        this.handlePopupClick(type, popup);
      });
    }
    
    return popup;
  }
  
  handlePopupClick(type, popup) {
    // Track interaction for adaptive behavior
    this.trackInteraction('popup_click', { type, timestamp: Date.now() });
    
    switch(type) {
      case 'AANDACHT_HARVESTING':
        // Toon meer surveillance info, maar dit leidt nog meer af
        popup.innerHTML = `
          <div style="color: #ff4444;">
            <strong>TOEGANG GEWEIGERD</strong><br/>
            Classificatie: SUBJECT_${Math.floor(Math.random() * 9999)}<br/>
            <small>Monitoring wordt voortgezet</small>
          </div>
        `;
        break;
        
      case 'PSEUDO_CONTROLE':
        // Geef gebruiker valse hoop
        popup.innerHTML = `
          <div style="color: #ff4444;">
            <strong>OPTIE NIET BESCHIKBAAR</strong><br/>
            Contractuele verplichtingen<br/>
            <small>Sessie wordt voortgezet</small>
          </div>
        `;
        break;
    }
    
    // No surveillance level to increment - difficulty scales with time
    
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 2000);
  }
  
  handlePseudoButtonClick(buttonText, button) {
    // Track interaction for adaptive behavior
    this.trackInteraction('pseudo_button_click', { buttonText, timestamp: Date.now() });
    
    // Alle "controle" buttons zijn eigenlijk vals
    const misleidingResponse = [
      'TOEGANG GEWEIGERD',
      'FUNCTIE UITGESCHAKELD',
      'ONVOLDOENDE PRIVILEGES',
      'CONTRACTUELE RESTRICTIE',
      'MONITORING VERPLICHT'
    ];
    
    const response = misleidingResponse[Math.floor(Math.random() * misleidingResponse.length)];
    
    button.style.background = 'rgba(255, 0, 0, 0.3)';
    button.style.color = '#ff4444';
    button.textContent = response;
    
    // Verhoog aandacht schuld omdat ze probeerden te ontsnappen
    this.aandachtSchuld += 25;
    
    setTimeout(() => {
      button.style.background = 'rgba(255, 255, 0, 0.2)';
      button.style.color = '#ffff00';
      button.textContent = buttonText;
    }, 1500);
    
    // Trigger extra surveillance na "escape" poging
    this.triggerSurveillanceEscalatie();
  }
  
  scheduleNextGlitch() {
    if (!this.isActief) return;
    
    const interval = this.config.glitch.baseFrequentie / (1 + this.focusEfficiency * 0.5);
    
    this.glitchTimer = setTimeout(() => {
      this.triggerVisualGlitch();
      this.scheduleNextGlitch();
    }, interval + Math.random() * 3000);
  }
  
  triggerVisualGlitch() {
    this.glitchOverlay.style.opacity = '1';
    
    // Random glitch pattern
    const glitchTypes = ['scanlines', 'colorshift', 'static', 'distortion'];
    const type = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
    
    switch(type) {
      case 'scanlines':
        this.glitchOverlay.style.background = `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.1) 2px,
            rgba(255, 255, 255, 0.1) 4px
          )
        `;
        break;
                
      case 'static':
        this.glitchOverlay.style.background = `
          radial-gradient(circle, 
            rgba(255, 255, 255, 0.1) 1px, 
            transparent 1px
          )
        `;
        this.glitchOverlay.style.backgroundSize = '4px 4px';
        break;
    }
    
    setTimeout(() => {
      this.glitchOverlay.style.opacity = '0';
    }, this.config.glitch.duur);
  }
  
  scheduleNextScanline() {
    if (!this.isActief) return;
    
    // Random interval between 15-45 seconds for immersive timing
    const interval = 15000 + Math.random() * 30000;
    
    this.scanlineTimer = setTimeout(() => {
      this.triggerVintageScanline();
      this.scheduleNextScanline();
    }, interval);
  }
  
  triggerVintageScanline() {
    // Create vintage TV scanline effect
    const scanlineOverlay = document.createElement('div');
    scanlineOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 8888;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      );
      animation: vintageScanlineMove 1.5s ease-out;
      opacity: 0;
    `;
    
    document.body.appendChild(scanlineOverlay);
    
    // Show scanlines briefly
    setTimeout(() => {
      scanlineOverlay.style.opacity = '1';
    }, 50);
    
    // Remove after animation
    setTimeout(() => {
      if (scanlineOverlay.parentNode) {
        scanlineOverlay.remove();
      }
    }, 1500);
  }
  
  updateSurveillanceFeedback() {
    const sessionMinutes = (Date.now() - this.sessionStartTijd) / 60000;
    this.cognitieveOogst += Math.random() * 0.5 + sessionMinutes * 0.1;
    
    // Focus-time based difficulty display
    const focusTime = this.parent?.focusStartTijd ? (Date.now() - this.parent.focusStartTijd) / 1000 : 0;
    const difficulty = Math.min(5, 1 + focusTime * 0.1);
    
    const content = `
      <div style="border-bottom: 1px solid #00ff00; margin-bottom: 5px; padding-bottom: 3px;">
        <strong>SYSTEEM</strong>
      </div>
      <div style="margin-bottom: 3px;">MOEILIJKHEID: ${difficulty.toFixed(1)}</div>
      <div style="color: #ffff44; font-size: 9px;">
        FOCUS: ${focusTime.toFixed(1)}s
      </div>
    `;
    
    this.surveillancePanel.innerHTML = content;
    
    // Less intrusive positioning
    const opacity = Math.min(0.6, 0.2 + sessionMinutes * 0.02);
    this.surveillancePanel.style.opacity = opacity.toString();
  }
  
  updateAandachtDashboard() {
    const sessionTime = (Date.now() - this.sessionStartTijd) / 1000;
    const harvestRate = this.cognitieveOogst / sessionTime * 60; // Per minuut
    
    const content = `
      <div style="border-bottom: 1px solid #ff4444; margin-bottom: 8px; padding-bottom: 3px;">
        <strong>AANDACHT ECONOMIE DASHBOARD</strong>
      </div>
      <div style="margin-bottom: 4px;">
        HARVEST RATE: ${harvestRate.toFixed(2)} MB/min
      </div>
      <div style="margin-bottom: 4px;">
        FOCUS EFFICIENCY: ${(this.focusEfficiency * 100).toFixed(1)}%
      </div>
      <div style="margin-bottom: 4px;">
        NEURAL SIGNAL: ${(Math.random() * 0.3 + 0.7).toFixed(2)}V
      </div>
      <div style="margin-bottom: 4px;">
        COMPLIANCE: ${Math.floor(85 + Math.random() * 15)}%
      </div>
      <div style="color: #ffff44; font-size: 9px;">
        ECONOMIC VALUE: €${(this.cognitieveOogst * 0.023).toFixed(3)}
      </div>
    `;
    
    this.dashboardContainer.innerHTML = content;
  }
  
  triggerSurveillanceEscalatie() {
    // Time-based difficulty increase instead of surveillance level
    const sessionMinutes = (Date.now() - this.sessionStartTijd) / 60000;
    const difficulty = Math.min(5, 1 + sessionMinutes * 0.3);
    
    // Toon extra waarschuwing
    const escalatiePopup = this.createPopup('SYSTEEMMELDING');
    escalatiePopup.innerHTML = `
      <div style="color: #ff0000; animation: blink 0.5s infinite;">
        <strong>MOEILIJKHEID VERHOOGD</strong><br/>
        Systeem adapteert aan uw focus<br/>
        <small>Niveau: ${difficulty.toFixed(1)}</small>
      </div>
    `;
    
    escalatiePopup.style.left = '50%';
    escalatiePopup.style.top = '30%';
    escalatiePopup.style.transform = 'translate(-50%, -50%)';
    escalatiePopup.style.zIndex = '12000';
    
    this.popupContainer.appendChild(escalatiePopup);
    
    setTimeout(() => {
      if (escalatiePopup.parentNode) escalatiePopup.remove();
    }, 4000);
  }
  
  // Interface voor hoofdapplicatie
  updateFocusStatus(isFocused, focusIntensity = 0) {
    this.focusEfficiency = focusIntensity;
    
    // Update performance metrics
    this.performanceMetrics.focusHistory.push(isFocused ? focusIntensity : 0);
    if (this.performanceMetrics.focusHistory.length > 20) {
      this.performanceMetrics.focusHistory.shift();
    }
    
    // Track performance
    const avgFocus = this.performanceMetrics.focusHistory.reduce((a, b) => a + b, 0) / this.performanceMetrics.focusHistory.length;
    this.performanceMetrics.performance.current = avgFocus;
    
    // Dashboard container disabled to reduce UI clutter
    // Focus-based pseudo controls remain for thematic effect
    if (isFocused && focusIntensity > 0.8 && !this.overwhemlDetected) {
      this.pseudoControls.style.opacity = '0.6';
      setTimeout(() => {
        this.pseudoControls.style.opacity = '0';
      }, 3000);
    }
    
    // Verhoog moeilijkheid tijdens langdurige focus - time-based
    // Difficulty increases naturally with session time
  }
  
  verhoogAfleidingIntensiteit() {
    // Verhoog algemene agressiviteit van afleidingen
    if (!this.config.balans.reduceOnLifeLoss) {
      this.config.intensiteit.master *= 1.2;
      this.config.intensiteit.popup *= 1.1;
    } else {
      // Meer subtiele verhoging bij leven verlies
      this.config.intensiteit.master *= 1.05;
      console.log('⚡ Subtiele intensiteit verhoging na leven verlies');
    }
    
    console.log(`🎯 Afleiding intensiteit verhoogd`);
  }
  
  // Track user interactions for adaptive behavior
  trackInteraction(type, data = {}) {
    this.performanceMetrics.interactionHistory.push({
      type,
      timestamp: Date.now(),
      data
    });
    
    // Keep only recent interactions
    if (this.performanceMetrics.interactionHistory.length > 30) {
      this.performanceMetrics.interactionHistory.shift();
    }
    
    // Add to recent events for overwhelm detection
    this.performanceMetrics.recentEvents.push(Date.now());
    
    // Keep only last minute of events
    const oneMinuteAgo = Date.now() - 60000;
    this.performanceMetrics.recentEvents = this.performanceMetrics.recentEvents.filter(
      timestamp => timestamp > oneMinuteAgo
    );
  }
  
  triggerSystemProgressionMessage() {
    const progressionMessages = [
      'NEURAL NETWORK ADAPTATION COMPLETE',
      'BEHAVIORAL PATTERN RECOGNITION ENHANCED',
      'ATTENTION HARVESTING ALGORITHM UPDATED',
      'COGNITIVE MAPPING RESOLUTION INCREASED',
      'SURVEILLANCE EFFICIENCY OPTIMIZED',
      'SUBJECT PROFILING SYSTEM UPGRADED',
      'FOCUS DISRUPTION PROTOCOLS ACTIVATED'
    ];
    
    const message = progressionMessages[Math.floor(Math.random() * progressionMessages.length)];
    
    const progressionPopup = document.createElement('div');
    progressionPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.95);
      border: 3px solid #ff0000;
      padding: 20px 30px;
      color: #ffffff;
      font-family: 'CATelecopy-Regular', monospace;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      z-index: 15000;
      animation: systemTakeover 0.5s ease-in-out;
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
      pointer-events: none;
    `;
    
    progressionPopup.innerHTML = `
      <div style="margin-bottom: 10px; font-size: 16px; color: #ffff00;">
        ⚠ SYSTEM UPDATE ⚠
      </div>
      <div style="margin-bottom: 10px;">
        ${message}
      </div>
      <div style="font-size: 11px; color: #ff8888;">
        MONITORING CAPABILITIES ENHANCED
      </div>
    `;
    
    document.body.appendChild(progressionPopup);
    
    // Auto-remove with dramatic effect
    setTimeout(() => {
      progressionPopup.style.animation = 'systemTakeoverFadeOut 0.8s ease-in-out';
      setTimeout(() => {
        if (progressionPopup.parentNode) {
          progressionPopup.remove();
        }
      }, 800);
    }, 3000);
    
    // Trigger side effects
    this.systemLearnProgress += 10;
    if (this.systemLearnProgress > 100) {
      this.triggerFullSystemTakeover();
    }
  }
  
  triggerFullSystemTakeover() {
    // Ultimate progression - system claims full control
    const takeoverOverlay = document.createElement('div');
    takeoverOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 20000;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: #ff0000;
      font-family: 'CATelecopy-Regular', monospace;
      animation: fullTakeover 2s ease-in-out;
      pointer-events: none;
    `;
    
    takeoverOverlay.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 20px; text-align: center;">
        SYSTEM TAKEOVER COMPLETE
      </div>
      <div style="font-size: 16px; margin-bottom: 15px; text-align: center;">
        SUBJECT BEHAVIORAL PROFILE ACQUIRED
      </div>
      <div style="font-size: 14px; color: #ffff00; text-align: center;">
        CONTINUING SURVEILLANCE...
      </div>
    `;
    
    document.body.appendChild(takeoverOverlay);
    
    setTimeout(() => {
      takeoverOverlay.style.animation = 'fullTakeoverFadeOut 3s ease-in-out';
      setTimeout(() => {
        if (takeoverOverlay.parentNode) {
          takeoverOverlay.remove();
        }
      }, 3000);
    }, 4000);
    
    // Reset progression to prevent spam
    this.systemLearnProgress = 0;
    
    // Difficulty continues to scale with time automatically
  }
  
  // Nieuwe methode: Clean up alle actieve popups onmiddellijk
  cleanupActivePopups() {
    if (this.popupContainer) {
      // Verwijder alle bestaande popups met animatie
      const activePopups = this.popupContainer.querySelectorAll('div');
      activePopups.forEach(popup => {
        if (popup.parentNode) {
          // Voeg fade-out animatie toe
          popup.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          popup.style.opacity = '0';
          popup.style.transform = 'scale(0.8)';
          
          // Verwijder na animatie
          setTimeout(() => {
            if (popup.parentNode) {
              popup.remove();
            }
          }, 300);
        }
      });
      
      console.log('💀 Alle actieve popups opgeruimd vanwege death state');
    }
    
    // Stop popup scheduling
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }

  cleanup() {
    this.isActief = false;
    
    // Clear alle timers
    if (this.popupTimer) clearTimeout(this.popupTimer);
    if (this.surveillanceUpdateTimer) clearInterval(this.surveillanceUpdateTimer);
    if (this.glitchTimer) clearTimeout(this.glitchTimer);
    if (this.scanlineTimer) clearTimeout(this.scanlineTimer);
    if (this.dashboardUpdateTimer) clearInterval(this.dashboardUpdateTimer);
    if (this.balanceCheckTimer) clearInterval(this.balanceCheckTimer);
    
    // Remove UI elementen
    [this.popupContainer, this.surveillancePanel, this.glitchOverlay, 
     this.pseudoControls].forEach(element => {
      if (element && element.parentNode) {
        element.remove();
      }
    });
    
    console.log('🧹 Afleiding systeem opgeruimd');
  }
  
  // Debug en configuratie methoden
  getCurrentConfig() {
    return this.config.exportSettings();
  }
  
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      currentPreset: this.currentPreset,
      overwhemlDetected: this.overwhemlDetected
    };
  }
  
  switchPreset(presetNaam) {
    if (AfleidingPresets[presetNaam]) {
      this.applyPreset(presetNaam);
      console.log(`🔄 Preset gewijzigd naar: ${presetNaam}`);
      return true;
    }
    return false;
  }
}

// CSS animaties toevoegen aan document
const style = document.createElement('style');
style.textContent = `
  @keyframes popupGlow {
    0% { box-shadow: 0 0 5px rgba(255, 68, 68, 0.5); }
    100% { box-shadow: 0 0 20px rgba(255, 68, 68, 0.8); }
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }
  
  @keyframes systemTakeover {
    0% { 
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes systemTakeoverFadeOut {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
  }
  
  @keyframes fullTakeover {
    0% {
      background: rgba(0, 0, 0, 0);
      opacity: 0;
    }
    50% {
      background: rgba(255, 0, 0, 0.3);
      opacity: 1;
    }
    100% {
      background: rgba(0, 0, 0, 0.8);
      opacity: 1;
    }
  }
  
  @keyframes fullTakeoverFadeOut {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  
  @keyframes vintageScanlineMove {
    0% {
      transform: translateY(-100vh);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translateY(100vh);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
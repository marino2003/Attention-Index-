// Audio Manager - Handles all audio for the focus installation
// Ambient background music and popup sound effects

// === EASY SOUND TOGGLES ===
const AUDIO_SETTINGS = {
  enableJumpscareSound: true,  // Set to false to disable jumpscare sounds
  enablePopupSounds: true,     // Set to false to disable popup sounds
  enableAmbientMusic: true,    // Set to false to disable ambient music
  enableBootSound: true        // Set to false to disable boot sound
};

export class AudioManager {
  constructor() {
    this.isInitialized = false;
    this.ambientAudio = null;
    this.popupAudio1 = null;
    this.popupAudio2 = null;
    this.jumpscareAudio = null;
    this.bootAudio = null;
    
    // Audio state
    this.isMuted = false;
    this.ambientVolume = 0.3;  // Lower volume for ambient
    this.effectsVolume = 0.6;  // Higher volume for effects
    this.bootVolume = 0.7;     // Volume for boot sound
    
    this.initializeAudio();
  }
  
  initializeAudio() {
    try {
      // Ambient background music
      this.ambientAudio = new Audio('src/audio/Ambience.mp3');
      this.ambientAudio.loop = true;
      this.ambientAudio.volume = this.ambientVolume;
      this.ambientAudio.preload = 'auto';
      
      // Popup sound effects
      this.popupAudio1 = new Audio('src/audio/pop-up-1.mp3');
      this.popupAudio1.volume = this.effectsVolume;
      this.popupAudio1.preload = 'auto';
      
      this.popupAudio2 = new Audio('src/audio/pop-up-2.mp3');
      this.popupAudio2.volume = this.effectsVolume;
      this.popupAudio2.preload = 'auto';
      
      // Jumpscare audio (already exists in HTML)
      this.jumpscareAudio = document.getElementById('jumpscare-audio');
      if (this.jumpscareAudio) {
        this.jumpscareAudio.volume = this.effectsVolume;
      }
      
      // Boot sound
      this.bootAudio = new Audio('src/audio/bootsound.mp3');
      this.bootAudio.volume = this.bootVolume;
      this.bootAudio.preload = 'auto';
      
      this.isInitialized = true;

      
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.isInitialized = false;
    }
  }
  
  // Start ambient background music
  startAmbientMusic() {
    if (!this.isInitialized || this.isMuted || !this.ambientAudio) return;
    
    try {
      // Reset position to start
      this.ambientAudio.currentTime = 0;
      
      const playPromise = this.ambientAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {

          })
          .catch(error => {
            console.warn('Ambient music autoplay blocked:', error);
            // Will start when user interacts with page
          });
      }
    } catch (error) {
      console.warn('Failed to start ambient music:', error);
    }
  }
  
  // Stop ambient background music
  stopAmbientMusic() {
    if (this.ambientAudio && !this.ambientAudio.paused) {
      this.ambientAudio.pause();
      this.ambientAudio.currentTime = 0;

    }
  }
  
  // Play random popup sound effect
  playPopupSound() {
    if (!this.isInitialized || this.isMuted) return;
    
    try {
      // Randomly choose between the two popup sounds
      const audioToPlay = Math.random() < 0.5 ? this.popupAudio1 : this.popupAudio2;
      
      if (audioToPlay) {
        // Reset to start and play
        audioToPlay.currentTime = 0;
        const playPromise = audioToPlay.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {

            })
            .catch(error => {
              console.warn('Popup sound failed to play:', error);
            });
        }
      }
    } catch (error) {
      console.warn('Failed to play popup sound:', error);
    }
  }
  
  // Play boot sound when application starts
  playBootSound() {
    if (!AUDIO_SETTINGS.enableBootSound) {
      console.log('Boot sound disabled in settings');
      return;
    }
    
    if (!this.isInitialized || this.isMuted || !this.bootAudio) return;
    
    try {
      this.bootAudio.currentTime = 0;
      const playPromise = this.bootAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Boot sound played successfully');
          })
          .catch(error => {
            console.warn('Boot sound failed to play (likely autoplay blocked):', error);
          });
      }
    } catch (error) {
      console.warn('Failed to play boot sound:', error);
    }
  }
  
  // Fade out boot sound smoothly
  fadeOutBootSound(duration = 1000) {
    if (!this.bootAudio || this.bootAudio.paused) {
      console.log('Boot sound not playing, skipping fade out');
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      const startVolume = this.bootAudio.volume;
      const fadeSteps = 20;
      const stepDuration = duration / fadeSteps;
      const volumeStep = startVolume / fadeSteps;
      
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
        this.bootAudio.volume = newVolume;
        
        if (currentStep >= fadeSteps || newVolume <= 0) {
          clearInterval(fadeInterval);
          this.bootAudio.pause();
          this.bootAudio.currentTime = 0;
          // Restore original volume for next play
          this.bootAudio.volume = this.bootVolume;
          console.log('Boot sound faded out successfully');
          resolve();
        }
      }, stepDuration);
    });
  }
  
  // Play jumpscare sound
  playJumpscareSound() {
    if (!AUDIO_SETTINGS.enableJumpscareSound) {

      return;
    }
    
    if (!this.isInitialized || this.isMuted || !this.jumpscareAudio) return;
    
    try {
      this.jumpscareAudio.currentTime = 0;
      const playPromise = this.jumpscareAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {

          })
          .catch(error => {
            console.warn('Jumpscare sound failed to play:', error);
          });
      }
    } catch (error) {
      console.warn('Failed to play jumpscare sound:', error);
    }
  }
  
  // Toggle mute for all audio
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopAmbientMusic();

    } else {
      this.startAmbientMusic();

    }
    
    return this.isMuted;
  }
  
  // Set volumes
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientAudio) {
      this.ambientAudio.volume = this.ambientVolume;
    }
  }
  
  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    this.bootVolume = this.effectsVolume; // Boot sound uses same volume as effects
    
    if (this.popupAudio1) this.popupAudio1.volume = this.effectsVolume;
    if (this.popupAudio2) this.popupAudio2.volume = this.effectsVolume;
    if (this.jumpscareAudio) this.jumpscareAudio.volume = this.effectsVolume;
    if (this.bootAudio) this.bootAudio.volume = this.bootVolume;
  }
  
  // Enable audio after user interaction (required for autoplay policies)
  enableAudioAfterUserInteraction() {
    if (!this.isInitialized) return;
    
    // This should be called after first user interaction
    document.addEventListener('click', () => {
      if (!this.isMuted && this.ambientAudio && this.ambientAudio.paused) {
        this.startAmbientMusic();
      }
    }, { once: true });
    
    document.addEventListener('keydown', () => {
      if (!this.isMuted && this.ambientAudio && this.ambientAudio.paused) {
        this.startAmbientMusic();
      }
    }, { once: true });
  }
  
  // Cleanup
  cleanup() {
    this.stopAmbientMusic();
    
    if (this.ambientAudio) {
      this.ambientAudio.remove();
      this.ambientAudio = null;
    }
    
    if (this.popupAudio1) {
      this.popupAudio1.remove();
      this.popupAudio1 = null;
    }
    
    if (this.popupAudio2) {
      this.popupAudio2.remove();
      this.popupAudio2 = null;
    }
    
    if (this.bootAudio) {
      this.bootAudio.remove();
      this.bootAudio = null;
    }
    
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
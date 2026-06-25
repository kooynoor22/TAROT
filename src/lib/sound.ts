/**
 * sound.ts
 * Robust Sound Manager for the Tarot and Lenormand application.
 * 
 * Supports:
 * - Real audio files with multiple language/name fallbacks (English and Spanish):
 *   - Ambient: /sounds/ambient.mp3, /sounds/ambiente.mp3, /ambiente.mp3, /ambient.mp3
 *   - Shuffle: /sounds/shuffle.mp3, /sounds/mezclar.mp3, /sounds/barajar.mp3, /mezclar.mp3, /shuffle.mp3
 *   - Flip: /sounds/flip.mp3, /sounds/girar.mp3, /sounds/voltear.mp3, /sounds/carta.mp3, /girar.mp3, /flip.mp3
 * - Web Audio API synthesizers as high-fidelity fallbacks when files are not found or not yet uploaded.
 * - Global volume/mute state, defaulting to muted/cancelled at startup as requested.
 * - LocalStorage persistence.
 */

class FallbackAudio {
  private urls: string[];
  private currentIndex: number = 0;
  private audio: HTMLAudioElement | null = null;
  private volume: number;
  private loop: boolean;
  private isPlaying: boolean = false;

  constructor(urls: string[], volume: number = 1.0, loop: boolean = false) {
    this.urls = urls;
    this.volume = volume;
    this.loop = loop;
    this.initNext();
  }

  private initNext() {
    if (this.currentIndex >= this.urls.length) {
      this.audio = null;
      return;
    }
    const url = this.urls[this.currentIndex];
    try {
      this.audio = new Audio(url);
      this.audio.volume = this.volume;
      this.audio.loop = this.loop;
      
      // If error loading, automatically try the next fallback in list
      this.audio.onerror = () => {
        console.warn(`Audio source failed to load: ${url}. Trying next fallback if available.`);
        this.currentIndex++;
        this.initNext();
        if (this.isPlaying && this.audio) {
          this.play().catch(() => {});
        }
      };
    } catch (e) {
      console.warn(`Failed to initialize Audio for ${url}:`, e);
      this.currentIndex++;
      this.initNext();
    }
  }

  play(): Promise<void> {
    this.isPlaying = true;
    if (!this.audio) {
      return Promise.reject(new Error("No audio source available"));
    }
    
    return this.audio.play().catch((err) => {
      console.warn(`Failed playing ${this.urls[this.currentIndex]}:`, err);
      // Try next fallback on playback error
      this.currentIndex++;
      this.initNext();
      if (this.audio) {
        return this.play();
      } else {
        throw err;
      }
    });
  }

  pause() {
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
      } catch (e) {
        // Ignore
      }
    }
  }

  set currentTime(time: number) {
    if (this.audio) {
      try {
        this.audio.currentTime = time;
      } catch (e) {
        // Ignore
      }
    }
  }

  get currentTime(): number {
    return this.audio ? this.audio.currentTime : 0;
  }

  setLoop(loop: boolean) {
    this.loop = loop;
    if (this.audio) {
      this.audio.loop = loop;
    }
  }
}

class SoundManager {
  private muted: boolean = true;
  private ambientAudio: FallbackAudio | null = null;
  private shuffleAudio: FallbackAudio | null = null;
  private flipAudio: FallbackAudio | null = null;
  private audioContext: AudioContext | null = null;
  private ambientSynthInterval: any = null;
  private isAmbientPlaying: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    // Determine initial state
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('oraculo_sound_muted');
      if (stored !== null) {
        this.muted = stored === 'true';
      } else {
        // Default to muted on startup as requested: "cancelar sonido al inicio"
        this.muted = true;
      }
      
      // Preload audio files with English and Spanish name fallbacks
      this.ambientAudio = new FallbackAudio([
        '/sounds/ambient.mp3',
        '/sounds/ambiente.mp3',
        '/ambiente.mp3',
        '/ambient.mp3'
      ], 0.25, true);

      this.shuffleAudio = new FallbackAudio([
        'https://res.cloudinary.com/dd4knv7yn/video/upload/v1782351768/freesound_community-tarot-shuffle-89105.mp3',
        '/sounds/shuffle.mp3',
        '/sounds/mezclar.mp3',
        '/sounds/barajar.mp3',
        '/mezclar.mp3',
        '/shuffle.mp3'
      ], 0.5, false);

      this.flipAudio = new FallbackAudio([
        '/sounds/flip.mp3',
        '/sounds/girar.mp3',
        '/sounds/voltear.mp3',
        '/sounds/carta.mp3',
        '/girar.mp3',
        '/flip.mp3'
      ], 0.6, false);
    }
  }

  // Subscribe to mute changes
  subscribe(callback: (muted: boolean) => void) {
    this.listeners.add(callback);
    callback(this.muted);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.muted));
  }

  getMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('oraculo_sound_muted', String(muted));
    }
    this.notify();

    if (muted) {
      this.stopAmbient();
      this.stopShuffleFile();
    } else {
      this.startAmbient();
    }
  }

  // Initialize Web Audio context on user interaction
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // Plays card flipping sound
  playFlip() {
    if (this.muted) return;

    // Try playing real file first
    if (this.flipAudio) {
      this.flipAudio.currentTime = 0;
      this.flipAudio.play().catch(() => {
        // Fallback to synthesis if file playing failed or file not found
        this.synthesizeFlip();
      });
    } else {
      this.synthesizeFlip();
    }
  }

  // Synthesizes an elegant wood/card click sound with Web Audio API
  private synthesizeFlip() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Card flip sweep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.12);
      
      // Gentle envelope
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Fail silently
    }
  }

  // Plays shuffling sound for a duration
  playShuffle(durationMs: number = 4500) {
    if (this.muted) return;

    // Try playing real file
    if (this.shuffleAudio) {
      this.shuffleAudio.currentTime = 0;
      this.shuffleAudio.setLoop(true);
      this.shuffleAudio.play().catch(() => {
        this.synthesizeShuffle(durationMs);
      });
      
      // Stop after duration
      setTimeout(() => {
        this.stopShuffleFile();
      }, durationMs);
    } else {
      this.synthesizeShuffle(durationMs);
    }
  }

  private stopShuffleFile() {
    if (this.shuffleAudio) {
      try {
        this.shuffleAudio.pause();
        this.shuffleAudio.currentTime = 0;
      } catch (e) {
        // Ignore
      }
    }
  }

  // Synthesizes a rhythmic card shuffling sound with Web Audio API
  private synthesizeShuffle(durationMs: number) {
    try {
      const ctx = this.getAudioContext();
      const endTime = ctx.currentTime + (durationMs / 1000);
      
      // Let's create repeated rapid low-pass noise bursts to mimic paper card friction
      const interval = 120; // ms between rustling
      const steps = Math.floor(durationMs / interval);
      
      for (let i = 0; i < steps; i++) {
        const triggerTime = ctx.currentTime + (i * interval / 1000);
        if (triggerTime >= endTime) break;
        
        // Custom short burst
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50 + Math.random() * 40, triggerTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, triggerTime);
        filter.frequency.exponentialRampToValueAtTime(1500, triggerTime + 0.06);
        
        // Very fast decay for each ruffle
        gain.gain.setValueAtTime(0.06 + Math.random() * 0.04, triggerTime);
        gain.gain.exponentialRampToValueAtTime(0.001, triggerTime + 0.09);
        
        osc.start(triggerTime);
        osc.stop(triggerTime + 0.1);
      }
    } catch (e) {
      // Fail silently
    }
  }

  // Starts ambient loop
  startAmbient() {
    if (this.muted) return;
    this.isAmbientPlaying = true;

    // Try playing real file
    if (this.ambientAudio) {
      this.ambientAudio.play().catch(() => {
        // Play synthesized cosmic pad
        this.startAmbientSynth();
      });
    } else {
      this.startAmbientSynth();
    }
  }

  // Stops ambient loop
  stopAmbient() {
    this.isAmbientPlaying = false;
    
    // Stop real file
    if (this.ambientAudio) {
      try {
        this.ambientAudio.pause();
      } catch (e) {
        // Ignore
      }
    }
    
    // Stop synthesized pad
    if (this.ambientSynthInterval) {
      clearInterval(this.ambientSynthInterval);
      this.ambientSynthInterval = null;
    }
  }

  // Synthesizes a beautiful ambient cosmic pad (Major/Minor 7th detuned sine wave chords)
  private startAmbientSynth() {
    if (this.ambientSynthInterval) return;

    const playChord = () => {
      if (this.muted || !this.isAmbientPlaying) return;
      try {
        const ctx = this.getAudioContext();
        
        // Roots for a mystical minor progression (e.g. Dm7 -> Am7)
        const roots = [146.83, 110.00]; // D3, A2
        const root = roots[Math.floor(Math.random() * roots.length)];
        
        // Define clean harmonics (1, 1.5, 1.88, 2.25) representing Root, 5th, Minor 7th, Minor 10th
        const factors = [1, 1.5, 1.88, 2.25, 2.66];
        
        factors.forEach((factor, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          // Detune slightly for lush warmth
          osc.frequency.setValueAtTime(root * factor + (Math.random() - 0.5) * 2, ctx.currentTime);
          
          // Slow swell and long slow decay
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 3.0); // very soft
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 8.5);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 9.0);
        });
      } catch (e) {
        // Ignore errors
      }
    };

    // Play immediately and then repeat every 8 seconds
    playChord();
    this.ambientSynthInterval = setInterval(playChord, 8000);
  }
}

export const soundManager = new SoundManager();

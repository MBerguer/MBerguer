/**
 * Tincho GP - Procedural Web Audio Engine
 * Pure synthesized sound without any external audio assets.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // start muted for autoplay policy
    this.engineGain = null;
    this.engineOsc = null;
    this.engineSub = null;
    this.skidGain = null;
    this.skidFilter = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Limiter
      const masterComp = this.ctx.createDynamicsCompressor();
      masterComp.threshold.value = -12;
      masterComp.knee.value = 10;
      masterComp.ratio.value = 8;
      masterComp.attack.value = 0.003;
      masterComp.release.value = 0.25;
      masterComp.connect(this.ctx.destination);

      // --- Engine Synthesizer ---
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;

      // Primary cylinder oscillator (Sawtooth for raw engine rumble)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;

      // Sub-harmonic for chassis vibration
      this.engineSub = this.ctx.createOscillator();
      this.engineSub.type = 'triangle';
      this.engineSub.frequency.value = 27.5;

      // Lowpass filter for engine warmth
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 800;

      this.engineOsc.connect(engineFilter);
      this.engineSub.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(masterComp);

      this.engineOsc.start();
      this.engineSub.start();

      // --- Tire Skid Synthesizer (White Noise) ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.value = 1200;
      this.skidFilter.Q.value = 3;

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.value = 0;

      whiteNoise.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(masterComp);
      whiteNoise.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext init deferred until user interaction", e);
    }
  }

  toggleMute() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    return !this.isMuted;
  }

  updateEngine(rpmRatio, speedKmh) {
    if (!this.isInitialized || this.isMuted) {
      if (this.engineGain) this.engineGain.gain.value = 0;
      if (this.skidGain) this.skidGain.gain.value = 0;
      return;
    }

    const targetFreq = 45 + rpmRatio * 180;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    this.engineSub.frequency.setTargetAtTime(targetFreq * 0.5, this.ctx.currentTime, 0.05);

    const targetGain = 0.08 + rpmRatio * 0.12;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  updateSkid(driftFactor) {
    if (!this.isInitialized || this.isMuted) return;
    const targetSkid = Math.min(1, Math.max(0, (driftFactor - 0.45) * 2.2));
    this.skidGain.gain.setTargetAtTime(targetSkid * 0.18, this.ctx.currentTime, 0.03);
  }

  playCheckpointChime() {
    if (!this.isInitialized || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(587.33, now); // D5
      chimeOsc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      chimeGain.gain.setValueAtTime(0.2, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(now);
      chimeOsc.stop(now + 0.45);
    } catch (e) {
      // Audio fallback safe
    }
  }
}

window.soundEngine = new SoundEngine();

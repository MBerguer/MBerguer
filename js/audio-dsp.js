/**
 * GRAND PRIX TELEMETRY // PROCEDURAL WEB AUDIO F1 ENGINE DSP SYNTHESIZER
 * Zero-asset audio synthesis: Dual detuned sawtooth oscillators for F1 turbocharged V6,
 * 24dB cascade low-pass filtration, 25Hz AM rev-limiter stutter, procedural tire squeal,
 * and localStorage-backed audio state persistence.
 */

(function () {
  'use strict';

  class F1EngineAudio {
    constructor() {
      this.ctx = null;
      this.isInitialized = false;
      this.isMuted = true;

      // Synthesis Nodes
      this.masterGain = null;
      this.osc1 = null;
      this.osc2 = null;
      this.filter1 = null;
      this.filter2 = null;
      this.amLimiterGain = null;
      this.limiterLfo = null;

      // Tire Squeal Nodes
      this.squealGain = null;
      this.squealFilter = null;
      this.noiseBufferNode = null;

      // State
      this.currentRpm = 800;
      this.btnSound = document.getElementById('btn-sound');

      this.readMutePreference();
      this.initEvents();
    }

    readMutePreference() {
      try {
        const stored = localStorage.getItem('f1_telemetry_muted');
        if (stored !== null) {
          this.isMuted = stored === 'true';
        }
      } catch (_) {}
      this.updateButtonUI();
    }

    saveMutePreference() {
      try {
        localStorage.setItem('f1_telemetry_muted', String(this.isMuted));
      } catch (_) {}
      this.updateButtonUI();
    }

    updateButtonUI() {
      if (!this.btnSound) return;
      this.btnSound.textContent = this.isMuted ? '🔇' : '🔊';
      this.btnSound.title = this.isMuted ? 'Unmute F1 Procedural Sound' : 'Mute Sound';
      this.btnSound.classList.toggle('active', !this.isMuted);
    }

    initEvents() {
      if (this.btnSound) {
        this.btnSound.addEventListener('click', () => {
          this.toggleMute();
        });
      }

      // Unlock AudioContext on first user interaction anywhere
      const unlockAudio = () => {
        if (!this.isInitialized && !this.isMuted) {
          this.initAudio();
        } else if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
          this.ctx.resume();
        }
      };

      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.saveMutePreference();

      if (!this.isMuted) {
        if (!this.isInitialized) {
          this.initAudio();
        } else if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.05);
        }
      } else {
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        }
      }
    }

    unmute() {
      if (this.isMuted) {
        this.toggleMute();
      }
    }

    /**
     * Initializes the Web Audio DSP Graph
     */
    initAudio() {
      if (this.isInitialized) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[AudioDSP] Web Audio API is not supported on this browser.');
        return;
      }

      this.ctx = new AudioCtx();

      // 1. Master Output Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0.0001 : 0.18;
      this.masterGain.connect(this.ctx.destination);

      // 2. AM Rev-Limiter Stutter Node (for 13,000+ RPM cutoff)
      this.amLimiterGain = this.ctx.createGain();
      this.amLimiterGain.gain.value = 1.0;
      this.amLimiterGain.connect(this.masterGain);

      // 3. 24dB Subtractive Low-pass Cascade (Two 12dB biquads in series)
      this.filter1 = this.ctx.createBiquadFilter();
      this.filter1.type = 'lowpass';
      this.filter1.frequency.value = 450;
      this.filter1.Q.value = 3.5;

      this.filter2 = this.ctx.createBiquadFilter();
      this.filter2.type = 'lowpass';
      this.filter2.frequency.value = 450;
      this.filter2.Q.value = 2.0;

      this.filter1.connect(this.filter2);
      this.filter2.connect(this.amLimiterGain);

      // 4. Dual Detuned Sawtooth Oscillators
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.value = 85;

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.value = 85.8; // Slight detune for rich chorused growl

      this.osc1.connect(this.filter1);
      this.osc2.connect(this.filter1);

      this.osc1.start();
      this.osc2.start();

      // 5. Procedural Tire Squeal Generator (Filtered White Noise)
      this.createNoiseGenerator();

      this.isInitialized = true;
      console.log('[AudioDSP] Web Audio subtractive F1 V6 engine graph initialized.');
    }

    createNoiseGenerator() {
      if (!this.ctx) return;

      // 2 seconds buffer of white noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseBufferNode = this.ctx.createBufferSource();
      this.noiseBufferNode.buffer = noiseBuffer;
      this.noiseBufferNode.loop = true;

      this.squealFilter = this.ctx.createBiquadFilter();
      this.squealFilter.type = 'bandpass';
      this.squealFilter.frequency.value = 1400;
      this.squealFilter.Q.value = 4.0;

      this.squealGain = this.ctx.createGain();
      this.squealGain.gain.value = 0.0001; // Silent by default

      this.noiseBufferNode.connect(this.squealFilter);
      this.squealFilter.connect(this.squealGain);
      this.squealGain.connect(this.masterGain);

      this.noiseBufferNode.start();
    }

    /**
     * Modulates base frequency and filters according to engine RPM (800 - 13,500)
     */
    setRpm(rpm) {
      this.currentRpm = Math.max(800, Math.min(13500, rpm));
      if (!this.ctx || !this.isInitialized || this.isMuted) return;

      const now = this.ctx.currentTime;

      // Fundamental frequency mapping: 800 RPM -> ~80 Hz, 13,500 RPM -> ~680 Hz
      const baseFreq = 80 + ((this.currentRpm - 800) / (13500 - 800)) * 600;
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      this.osc2.frequency.setTargetAtTime(baseFreq * 1.008, now, 0.03);

      // Lowpass filter cutoff follows RPM harmonics
      const cutoff = 400 + ((this.currentRpm - 800) / (13500 - 800)) * 2600;
      this.filter1.frequency.setTargetAtTime(cutoff, now, 0.04);
      this.filter2.frequency.setTargetAtTime(cutoff * 0.9, now, 0.04);

      // 25Hz AM Rev-limiter stutter at redline (>13,000 RPM)
      if (this.currentRpm >= 12900) {
        const stutter = (Math.sin(now * 25 * Math.PI * 2) > 0) ? 1.0 : 0.15;
        this.amLimiterGain.gain.setTargetAtTime(stutter, now, 0.008);
      } else {
        this.amLimiterGain.gain.setTargetAtTime(1.0, now, 0.02);
      }
    }

    /**
     * Modulates tire squeal intensity during drifts or hard lockups
     */
    setDriftIntensity(factor) {
      if (!this.squealGain || !this.ctx || this.isMuted) return;
      const intensity = Math.max(0, Math.min(1, factor));
      const targetGain = intensity > 0.2 ? intensity * 0.28 : 0.0001;
      this.squealGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
    }
  }

  const audioInstance = new F1EngineAudio();
  window.EngineAudio = audioInstance;

  // Synchronize audio RPM with car velocity in animation loop
  if (window.CanvasStage && typeof window.CanvasStage.addRender === 'function') {
    window.CanvasStage.addRender(() => {
      if (window.ScrollyCar) {
        audioInstance.setRpm(window.ScrollyCar.rpm);
      } else if (window.HudTelemetry) {
        audioInstance.setRpm(window.HudTelemetry.rpm);
      }
    });
  }

  console.log('[F1EngineAudio] Initialized procedural F1 audio DSP synthesizer.');
})();

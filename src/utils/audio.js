// Pure Web Audio API engine: Timer Chime + Brown Noise + White Noise + Soft Rain
// Zero external audio files required.

class StudyAudioEngine {
  constructor() {
    this.ctx = null;
    this.channels = {
      brown: null,
      white: null,
      rain: null,
    };
    this.volumes = {
      brown: 0,
      white: 0,
      rain: 0,
    };
    this.muted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Gentle harmonic bell chime when a Pomodoro session or break ends
  playChime(isBreakEnd = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isBreakEnd ? [440, 554.37, 659.25] : [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + i * 0.14;
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 1.45);
    });
  }

  createNoiseChannel(type) {
    const ctx = this.ensureContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const out = buffer.getChannelData(ch);
      if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          out[i] = (Math.random() * 2 - 1) * 0.25;
        }
      } else if (type === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          out[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = out[i];
          out[i] *= 2.8;
        }
      } else if (type === 'rain') {
        // Pink-ish noise base + subtle soft droplet texture
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
          // Occasional soft raindrop shimmer
          const drop = Math.random() < 0.0007 ? (Math.random() - 0.5) * 0.35 : 0;
          out[i] = pink + drop;
        }
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === 'white') {
      filter.type = 'lowpass';
      filter.frequency.value = 2600;
    } else if (type === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 420;
    } else {
      filter.type = 'bandpass';
      filter.frequency.value = 1150;
      filter.Q.value = 0.55;
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    return { src, filter, gain };
  }

  setVolume(type, volume) {
    this.volumes[type] = Math.max(0, Math.min(1, volume));
    if (this.volumes[type] > 0 && !this.channels[type]) {
      this.channels[type] = this.createNoiseChannel(type);
    }
    this.applyGain(type);
  }

  setMuted(muted) {
    this.muted = muted;
    Object.keys(this.volumes).forEach((t) => this.applyGain(t));
  }

  applyGain(type) {
    const ch = this.channels[type];
    if (!ch || !this.ctx) return;
    const scale = type === 'white' ? 0.35 : type === 'rain' ? 0.85 : 0.65;
    const target = this.muted ? 0 : this.volumes[type] * scale;
    ch.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }
}

export const studyAudio = new StudyAudioEngine();

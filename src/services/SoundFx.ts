/**
 * SoundFx & Procedural Ambient Synthesizer
 * Generates futuristic audio cues, haptic audio pulses, and generative ambient soundscapes
 * using the Web Audio API without needing external asset files.
 */

export class SoundFx {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private activeAmbientType: string | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Rising dual harmonic chime for session activation
   */
  public playConnect(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  }

  /**
   * Descending gentle resonant tone for disconnect
   */
  public playDisconnect(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.3); // E4

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Crisp digital chirp when Lyraa executes a tool
   */
  public playToolCall(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.setValueAtTime(1567.98, now + 0.06); // G6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  /**
   * Subtle soft pulse when interrupted
   */
  public playInterrupt(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  /**
   * Generative ambient soundscape (rain, space_hum, cyber_breeze, fireplace)
   */
  public playAmbient(type: string, volume: number = 0.08): void {
    this.stopAmbient();
    if (type === 'stop') return;

    try {
      const ctx = this.getContext();
      this.activeAmbientType = type;

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
      this.ambientGain.connect(ctx.destination);

      if (type === 'space_hum') {
        // Deep binaural cosmic drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime);
        osc2.frequency.setValueAtTime(57.5, ctx.currentTime); // 2.5Hz binaural beat

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.ambientGain);

        osc1.start();
        osc2.start();
        this.ambientSource = osc1;
      } else {
        // Generative filtered noise for rain / cyber breeze
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink/brown noise filter
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (type === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, ctx.currentTime);
        } else if (type === 'cyber_breeze') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, ctx.currentTime);
          filter.Q.setValueAtTime(2.0, ctx.currentTime);
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, ctx.currentTime);
        }

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        whiteNoise.start();
        this.ambientSource = whiteNoise;
      }
    } catch (err) {
      console.warn('[SoundFx] Ambient sound failed:', err);
    }
  }

  public stopAmbient(): void {
    if (this.ambientGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        setTimeout(() => {
          if (this.ambientSource) {
            try {
              (this.ambientSource as any).stop?.();
              this.ambientSource.disconnect();
            } catch {}
            this.ambientSource = null;
          }
        }, 550);
      } catch {}
    }
    this.activeAmbientType = null;
  }

  public getActiveAmbient(): string | null {
    return this.activeAmbientType;
  }
}

export const soundFx = new SoundFx();

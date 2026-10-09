/**
 * AudioPlayer - High precision Web Audio API 24kHz PCM gapless scheduler
 * with instant interruption handling and real-time output analyser.
 */

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor(
    onStateChange?: (isPlaying: boolean) => void,
    onLevel?: (level: number) => void
  ) {
    if (onStateChange) this.onStateChange = onStateChange;
    if (onLevel) this.onLevelCallback = onLevel;
  }

  public setOnStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChange = cb;
  }

  public setOnLevel(cb: (level: number) => void) {
    this.onLevelCallback = cb;
  }

  public async init(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') return;

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioContext = new AudioCtxClass({ sampleRate: 24000 });
    } catch {
      this.audioContext = new AudioCtxClass();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.5;

    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.nextStartTime = this.audioContext.currentTime;
    this.startLevelMonitor();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Schedules a 24kHz raw PCM chunk for seamless gapless playback.
   * @param base64Pcm Base64 encoded 16-bit PCM little-endian audio chunk
   */
  public async queueAudioChunk(base64Pcm: string): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    if (!this.audioContext || !this.gainNode) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Decode base64 to Float32Array at 24000Hz
    const float32Samples = this.base64ToFloat32(base64Pcm);
    if (float32Samples.length === 0) return;

    const buffer = this.audioContext.createBuffer(1, float32Samples.length, 24000);
    buffer.getChannelData(0).set(float32Samples);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    const currentTime = this.audioContext.currentTime;
    // Schedule ahead: if nextStartTime fell behind due to silence or lag, jump to currentTime + 10ms buffer
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.01;
    }

    const scheduledTime = this.nextStartTime;
    source.start(scheduledTime);
    this.nextStartTime += buffer.duration;

    this.activeSources.add(source);
    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    }

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0) {
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
      }
    };
  }

  /**
   * Immediate interruption: abruptly stops all active and queued audio nodes.
   * Critical for fluid voice conversation when user interrupts Lyraa.
   */
  public interrupt(): void {
    console.log('[AudioPlayer] Interruption triggered: clearing audio queue');
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources.clear();

    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    }
    if (this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public stop(): void {
    this.interrupt();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private startLevelMonitor(): void {
    const update = () => {
      if (this.analyserNode && this.isPlaying) {
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, (avg / 128) * 1.2);
        if (this.onLevelCallback) {
          this.onLevelCallback(normalized);
        }
      } else if (this.onLevelCallback && !this.isPlaying) {
        this.onLevelCallback(0);
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit PCM little-endian to Float32
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      const sample = int16Array[i];
      float32Array[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
    }

    return float32Array;
  }
}

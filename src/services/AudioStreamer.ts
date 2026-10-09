/**
 * AudioStreamer - Captures microphone input, resamples to 16kHz PCM16 little-endian,
 * and streams base64 chunks for Gemini Live API.
 */

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private isStreaming: boolean = false;
  private onChunkCallback: ((base64Pcm: string) => void) | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;

  constructor(
    onChunk?: (base64Pcm: string) => void,
    onLevel?: (level: number) => void
  ) {
    if (onChunk) this.onChunkCallback = onChunk;
    if (onLevel) this.onLevelCallback = onLevel;
  }

  public setOnChunk(cb: (base64Pcm: string) => void) {
    this.onChunkCallback = cb;
  }

  public setOnLevel(cb: (level: number) => void) {
    this.onLevelCallback = cb;
  }

  public async start(): Promise<void> {
    if (this.isStreaming) return;

    try {
      // Request mic with echo cancellation and noise suppression
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Try creating context with 16000Hz, fall back if system requires native rate
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.audioContext = new AudioCtxClass({ sampleRate: 16000 });
      } catch {
        this.audioContext = new AudioCtxClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analyser for real-time visualization of user speech
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.4;
      this.sourceNode.connect(this.analyserNode);

      // ScriptProcessor with buffer size 4096 (or 2048)
      // 4096 samples at 16kHz is ~256ms chunk
      const bufferSize = 2048;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (!this.isStreaming || this.isMuted) return;

        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);

        // Calculate RMS for visualizer
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
          sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);
        const level = Math.min(1, rms * 5); // Normalized level boost
        if (this.onLevelCallback) {
          this.onLevelCallback(level);
        }

        // Resample to 16000 if native rate is different
        const currentRate = this.audioContext ? this.audioContext.sampleRate : 16000;
        const pcm16Data = this.resampleAndEncodePCM16(channelData, currentRate, 16000);

        if (pcm16Data.length > 0 && this.onChunkCallback) {
          const base64 = this.arrayBufferToBase64(pcm16Data.buffer);
          this.onChunkCallback(base64);
        }
      };

      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isStreaming = true;
    } catch (err) {
      console.error('[AudioStreamer] Failed to start microphone capture:', err);
      this.stop();
      throw err;
    }
  }

  public stop(): void {
    this.isStreaming = false;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsStreaming(): boolean {
    return this.isStreaming;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Resamples Float32 audio to target sample rate (16kHz) and converts to Int16 PCM.
   */
  private resampleAndEncodePCM16(
    input: Float32Array,
    inputRate: number,
    targetRate: number
  ): Int16Array {
    let outputFloat: Float32Array;

    if (inputRate === targetRate) {
      outputFloat = input;
    } else {
      const ratio = inputRate / targetRate;
      const targetLength = Math.round(input.length / ratio);
      outputFloat = new Float32Array(targetLength);

      for (let i = 0; i < targetLength; i++) {
        const srcIndex = i * ratio;
        const low = Math.floor(srcIndex);
        const high = Math.min(low + 1, input.length - 1);
        const weight = srcIndex - low;
        outputFloat[i] = input[low] * (1 - weight) + input[high] * weight;
      }
    }

    // Convert Float32 [-1.0, 1.0] to 16-bit PCM Signed Integer Little-Endian
    const outputInt16 = new Int16Array(outputFloat.length);
    for (let i = 0; i < outputFloat.length; i++) {
      const s = Math.max(-1, Math.min(1, outputFloat[i]));
      outputInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return outputInt16;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

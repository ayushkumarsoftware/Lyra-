/**
 * LiveSession - Manages WebSocket connection to the server's Gemini Live bridge,
 * audio stream exchange, heartbeat, tool call events, and conversation history sync.
 */

import { ToolCall, ConversationTurn } from '../types';

export interface LiveSessionCallbacks {
  onSessionReady?: (info: { model: string; voice: string; sessionId?: string; user?: any }) => void;
  onAudioChunk?: (base64Audio: string) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onToolCall?: (call: ToolCall) => void;
  onHistoryUpdate?: (history: ConversationTurn[]) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private callbacks: LiveSessionCallbacks = {};
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private pingInterval: number | null = null;
  private activeModel: string = 'gemini-3.1-flash-live-preview';
  private activeVoice: string = 'Aoede';

  constructor(callbacks: LiveSessionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: LiveSessionCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public connect(token?: string | null): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let wsUrl = `${protocol}//${window.location.host}/live`;
        if (token) {
          wsUrl += `?token=${encodeURIComponent(token)}`;
        }
        console.log(`[LiveSession] Connecting to ${wsUrl}...`);

        this.ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (this.isConnecting) {
            this.disconnect();
            reject(new Error('Connection timed out. Please check network and server status.'));
          }
        }, 15000);

        this.ws.onopen = () => {
          console.log('[LiveSession] WebSocket connection open');
          this.isConnecting = false;
          this.isConnected = true;
          clearTimeout(connectionTimeout);
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          console.error('[LiveSession] WebSocket error:', event);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          if (this.callbacks.onError) {
            this.callbacks.onError('WebSocket connection error');
          }
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          console.log('[LiveSession] WebSocket closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.cleanup();
          if (this.callbacks.onClose) {
            this.callbacks.onClose();
          }
        };
      } catch (err: any) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  public sendAudioChunk(base64Pcm: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'audio',
          audio: base64Pcm,
        })
      );
    }
  }

  public sendUserTranscript(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'user_transcript',
          text,
        })
      );
    }
  }

  public switchVoice(voice: string): void {
    this.activeVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'switch_voice',
          voice,
        })
      );
    }
  }

  public sendToolResult(id: string, name: string, response: Record<string, any>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'client_tool_result',
          id,
          name,
          response,
        })
      );
    }
  }

  public disconnect(): void {
    this.cleanup();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getModel(): string {
    return this.activeModel;
  }

  public getVoice(): string {
    return this.activeVoice;
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'session_ready':
          this.activeModel = msg.model || this.activeModel;
          this.activeVoice = msg.voice || this.activeVoice;
          console.log(`[LiveSession] Session ready: model=${this.activeModel}, voice=${this.activeVoice}`);
          if (this.callbacks.onSessionReady) {
            this.callbacks.onSessionReady({
              model: this.activeModel,
              voice: this.activeVoice,
              sessionId: msg.sessionId,
              user: msg.user,
            });
          }
          break;

        case 'audio':
          if (msg.audio && this.callbacks.onAudioChunk) {
            this.callbacks.onAudioChunk(msg.audio);
          }
          break;

        case 'history_update':
          if (msg.history && this.callbacks.onHistoryUpdate) {
            this.callbacks.onHistoryUpdate(msg.history);
          }
          break;

        case 'interrupted':
          console.log('[LiveSession] Interruption event received from server');
          if (this.callbacks.onInterrupted) {
            this.callbacks.onInterrupted();
          }
          break;

        case 'turn_complete':
          if (this.callbacks.onTurnComplete) {
            this.callbacks.onTurnComplete();
          }
          break;

        case 'tool_call':
          if (msg.call && this.callbacks.onToolCall) {
            this.callbacks.onToolCall({
              id: msg.call.id,
              name: msg.call.name,
              args: msg.call.args,
              timestamp: Date.now(),
            });
          }
          break;

        case 'error':
          console.error('[LiveSession] Server error:', msg.error);
          if (this.callbacks.onError) {
            this.callbacks.onError(msg.error);
          }
          break;

        case 'pong':
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[LiveSession] Failed to parse incoming message:', err);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup(): void {
    this.isConnecting = false;
    this.isConnected = false;
    this.stopHeartbeat();
  }
}

/**
 * ToolManager - Executes browser actions triggered by Gemini Live function calls,
 * dispatches notifications, handles haptics, and maintains session memories.
 */

import { ToolCall, ToolActionRecord, VoiceNote } from '../types';
import { soundFx } from './SoundFx';

export interface ToolManagerCallbacks {
  onAtmosphereChange?: (themeKey: string) => void;
  onNewToolAction?: (action: ToolActionRecord) => void;
  onNewVoiceNote?: (note: VoiceNote) => void;
  onWebsiteOpenRequest?: (url: string, title?: string) => void;
}

export class ToolManager {
  private callbacks: ToolManagerCallbacks = {};
  private actionHistory: ToolActionRecord[] = [];
  private voiceNotes: VoiceNote[] = [];

  constructor(callbacks: ToolManagerCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: ToolManagerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public async executeTool(call: ToolCall): Promise<Record<string, any>> {
    const { name, args } = call;
    console.log(`[ToolManager] Executing ${name} with args:`, args);

    soundFx.playToolCall();
    this.triggerHaptic(50);

    let resultRecord: ToolActionRecord = {
      id: call.id,
      name,
      title: name,
      description: '',
      icon: 'sparkles',
      timestamp: Date.now(),
      data: args,
    };

    let executionResult: Record<string, any> = { success: true };

    try {
      switch (name) {
        case 'openWebsite': {
          let url = (args.url || '').trim();
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
          }
          const title = args.title || url;

          resultRecord.title = 'Opening Website';
          resultRecord.description = `Navigating to ${title}`;
          resultRecord.icon = 'globe';

          // Safe browser navigation
          if (this.callbacks.onWebsiteOpenRequest) {
            this.callbacks.onWebsiteOpenRequest(url, title);
          }

          // Try window.open safely
          try {
            window.open(url, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('[ToolManager] window.open blocked by browser:', e);
          }

          executionResult = {
            status: 'opened',
            url,
            title,
            message: `Website ${url} opened in new tab.`,
          };
          break;
        }

        case 'changeAtmosphere': {
          const theme = args.theme || 'cyber_cyan';
          resultRecord.title = 'Atmosphere Shift';
          resultRecord.description = args.reason || `Changed aura to ${theme}`;
          resultRecord.icon = 'palette';

          if (this.callbacks.onAtmosphereChange) {
            this.callbacks.onAtmosphereChange(theme);
          }

          executionResult = {
            status: 'updated',
            theme,
            message: `Aura shifted to ${theme}.`,
          };
          break;
        }

        case 'getDeviceStatus': {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

          resultRecord.title = 'Device Status Query';
          resultRecord.description = `${timeStr} • ${dateStr}`;
          resultRecord.icon = 'cpu';

          executionResult = {
            localTime: timeStr,
            localDate: dateStr,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine,
            platform: navigator.platform,
          };
          break;
        }

        case 'playAmbientSound': {
          const sound = (args.sound || 'rain').toLowerCase();
          resultRecord.title = sound === 'stop' ? 'Ambient Sound Stopped' : 'Ambient Soundscape';
          resultRecord.description = sound === 'stop' ? 'Turned off background audio' : `Playing ${sound} soundscape`;
          resultRecord.icon = 'music';

          soundFx.playAmbient(sound);

          executionResult = {
            sound,
            status: sound === 'stop' ? 'stopped' : 'playing',
          };
          break;
        }

        case 'takeVoiceNote': {
          const noteText = args.note || 'Empty note';
          const category = (args.category || 'general') as any;

          const voiceNote: VoiceNote = {
            id: 'note_' + Date.now(),
            note: noteText,
            category,
            timestamp: Date.now(),
          };

          this.voiceNotes.unshift(voiceNote);

          resultRecord.title = 'Memory Stored';
          resultRecord.description = `"${noteText.length > 50 ? noteText.slice(0, 50) + '...' : noteText}"`;
          resultRecord.icon = 'bookmark';

          if (this.callbacks.onNewVoiceNote) {
            this.callbacks.onNewVoiceNote(voiceNote);
          }

          executionResult = {
            status: 'saved',
            id: voiceNote.id,
            note: noteText,
          };
          break;
        }

        default:
          resultRecord.description = `Executed ${name}`;
          executionResult = { status: 'executed', name, args };
          break;
      }
    } catch (err: any) {
      console.error(`[ToolManager] Execution error in ${name}:`, err);
      resultRecord.description = `Failed: ${err.message}`;
      executionResult = { error: err.message };
    }

    this.actionHistory.unshift(resultRecord);
    if (this.callbacks.onNewToolAction) {
      this.callbacks.onNewToolAction(resultRecord);
    }

    return executionResult;
  }

  public getActionHistory(): ToolActionRecord[] {
    return this.actionHistory;
  }

  public getVoiceNotes(): VoiceNote[] {
    return this.voiceNotes;
  }

  public deleteVoiceNote(id: string): void {
    this.voiceNotes = this.voiceNotes.filter((n) => n.id !== id);
  }

  private triggerHaptic(durationMs = 40): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {}
    }
  }
}

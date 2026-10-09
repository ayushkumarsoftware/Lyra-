/**
 * Lyraa - Real-time Voice-to-Voice AI Companion
 * Fullscreen futuristic glassmorphism dark interface powered by Gemini Live API.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AnimationIntensity,
  AssistantState,
  AtmosphereTheme,
  ConversationTurn,
  ToolActionRecord,
  UserProfile,
  VoiceNote,
  VoiceOption,
  WaveformStyle,
} from './types';
import { ATMOSPHERE_THEMES } from './theme/atmospheres';
import { AudioStreamer } from './services/AudioStreamer';
import { AudioPlayer } from './services/AudioPlayer';
import { LiveSession } from './services/LiveSession';
import { ToolManager } from './services/ToolManager';
import { authService } from './services/AuthService';
import { soundFx } from './services/SoundFx';
import { CosmicBackground } from './components/CosmicBackground';
import { StatusHeader } from './components/StatusHeader';
import { LyraaAnimeAvatar } from './components/LyraaAnimeAvatar';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ControlsFooter } from './components/ControlsFooter';
import { ToolActivityOverlay } from './components/ToolActivityOverlay';
import { InteractionFeedbackOverlay, FeedbackEvent } from './components/InteractionFeedbackOverlay';
import { MemoryDrawer } from './components/MemoryDrawer';
import { ConversationHistoryDrawer } from './components/ConversationHistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getUser());

  // Core Assistant States & Customization
  const [assistantState, setAssistantState] = useState<AssistantState>('disconnected');
  const [activeThemeId, setActiveThemeId] = useState<string>(
    currentUser?.preferredTheme || 'cyber_cyan'
  );
  const [activeVoice, setActiveVoice] = useState<VoiceOption>(
    currentUser?.preferredVoice || 'Aoede'
  );
  const [activeWaveform, setActiveWaveform] = useState<WaveformStyle>(
    currentUser?.preferredWaveform || 'fluid_spline'
  );
  const [activeIntensity, setActiveIntensity] = useState<AnimationIntensity>(
    currentUser?.animationIntensity || 'balanced'
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.95);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);

  // Audio Telemetry & Session
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedModel, setConnectedModel] = useState<string>('gemini-3.1-flash-live-preview');

  // Conversation History & Memories
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  // Overlays and Drawers
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentToolAction, setCurrentToolAction] = useState<ToolActionRecord | null>(null);

  // Interaction Feedback Animations (Subtle Screen-Shake & Edge-Glow)
  const [feedbackEvent, setFeedbackEvent] = useState<FeedbackEvent | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const shakeTimeoutRef = useRef<number | null>(null);

  // Service Instances
  const streamerRef = useRef<AudioStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const currentActionTimeoutRef = useRef<number | null>(null);

  const theme: AtmosphereTheme = ATMOSPHERE_THEMES[activeThemeId] || ATMOSPHERE_THEMES.cyber_cyan;

  // Trigger tactile screen shake and edge glow feedback
  const triggerInteractionFeedback = useCallback((type: 'tool' | 'note' | 'atmosphere', color?: string) => {
    setFeedbackEvent({
      id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      type,
      color,
    });

    setIsScreenShaking(true);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsScreenShaking(false);
    }, 450);
  }, []);

  // Subscribe to Auth changes and refresh profile
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        if (user.preferredTheme && ATMOSPHERE_THEMES[user.preferredTheme]) {
          setActiveThemeId(user.preferredTheme);
        }
        if (user.preferredVoice) {
          setActiveVoice(user.preferredVoice);
        }
        if (user.preferredWaveform) {
          setActiveWaveform(user.preferredWaveform);
        }
        if (user.animationIntensity) {
          setActiveIntensity(user.animationIntensity);
        }
      }
    });

    authService.fetchCurrentProfile().catch(() => {});

    return () => {
      unsubscribe();
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  // Initialize ToolManager with tactile feedback hooks
  useEffect(() => {
    const tm = new ToolManager({
      onAtmosphereChange: (themeKey) => {
        if (ATMOSPHERE_THEMES[themeKey]) {
          setActiveThemeId(themeKey);
          triggerInteractionFeedback('atmosphere', ATMOSPHERE_THEMES[themeKey].accent);
        }
      },
      onNewToolAction: (action) => {
        setCurrentToolAction(action);
        triggerInteractionFeedback(action.name === 'takeVoiceNote' ? 'note' : 'tool');
        if (currentActionTimeoutRef.current) {
          clearTimeout(currentActionTimeoutRef.current);
        }
        currentActionTimeoutRef.current = window.setTimeout(() => {
          setCurrentToolAction(null);
        }, 6000);
      },
      onNewVoiceNote: (note) => {
        setVoiceNotes((prev) => [note, ...prev]);
        triggerInteractionFeedback('note', '#f59e0b');
      },
      onWebsiteOpenRequest: (url, title) => {
        console.log(`[App] Website open requested: ${title} (${url})`);
      },
    });

    toolManagerRef.current = tm;

    return () => {
      if (currentActionTimeoutRef.current) {
        clearTimeout(currentActionTimeoutRef.current);
      }
    };
  }, [triggerInteractionFeedback]);

  // Handle Model Interruption
  const handleInterrupt = useCallback(() => {
    soundFx.playInterrupt();
    if (playerRef.current) {
      playerRef.current.interrupt();
    }
    setAssistantState('listening');
  }, []);

  // Connect to Lyraa Live Session
  const startSession = async () => {
    setErrorMessage(null);
    setAssistantState('connecting');

    try {
      // 1. Initialize Audio Player for 24kHz output
      if (!playerRef.current) {
        playerRef.current = new AudioPlayer(
          (isPlaying) => {
            setAssistantState(isPlaying ? 'speaking' : 'listening');
          },
          (level) => {
            setOutputLevel(level);
          }
        );
      }
      await playerRef.current.init();
      playerRef.current.setVolume(volume);

      // 2. Initialize LiveSession WebSocket
      if (!sessionRef.current) {
        sessionRef.current = new LiveSession();
      }

      sessionRef.current.setCallbacks({
        onSessionReady: (info) => {
          console.log('[App] Session established with Gemini Live:', info);
          setConnectedModel(info.model);
          soundFx.playConnect();
          setAssistantState('listening');
        },
        onAudioChunk: (base64Audio) => {
          if (playerRef.current) {
            playerRef.current.queueAudioChunk(base64Audio);
          }
        },
        onHistoryUpdate: (history) => {
          setConversationHistory(history);
        },
        onInterrupted: () => {
          console.log('[App] Interrupted by server');
          handleInterrupt();
        },
        onTurnComplete: () => {
          if (!playerRef.current?.getIsPlaying()) {
            setAssistantState('listening');
          }
        },
        onToolCall: async (call) => {
          if (toolManagerRef.current) {
            await toolManagerRef.current.executeTool(call);
          }
        },
        onError: (err) => {
          console.error('[App] Session error:', err);
          setErrorMessage(err);
          disconnectSession();
        },
        onClose: () => {
          console.log('[App] Session closed');
          disconnectSession();
        },
      });

      // Pass token if user is authenticated
      const token = authService.getToken();
      await sessionRef.current.connect(token);

      // 3. Initialize AudioStreamer for 16kHz microphone capture
      if (!streamerRef.current) {
        streamerRef.current = new AudioStreamer(
          (base64Chunk) => {
            if (sessionRef.current?.getIsConnected()) {
              sessionRef.current.sendAudioChunk(base64Chunk);
            }
          },
          (level) => {
            setInputLevel(level);
          }
        );
      }
      await streamerRef.current.start();
      streamerRef.current.setMute(isMuted);

    } catch (err: any) {
      console.error('[App] Failed to start Lyraa session:', err);
      disconnectSession();
      setErrorMessage(
        err?.message || 'Could not connect to microphone or Gemini Live server.'
      );
    }
  };

  // Disconnect Session
  const disconnectSession = useCallback(() => {
    soundFx.playDisconnect();

    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }

    setAssistantState('disconnected');
    setInputLevel(0);
    setOutputLevel(0);
  }, []);

  // Toggle Connection Power
  const handleTogglePower = () => {
    if (assistantState === 'disconnected') {
      startSession();
    } else {
      disconnectSession();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (streamerRef.current) {
      streamerRef.current.setMute(nextMute);
    }
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
    }
  };

  // Voice Persona Switcher
  const handleSelectVoice = (voice: VoiceOption) => {
    setActiveVoice(voice);
    if (sessionRef.current && assistantState !== 'disconnected') {
      sessionRef.current.switchVoice(voice);
    }
    if (currentUser) {
      authService.updateProfile({ preferredVoice: voice }).catch(() => {});
    }
  };

  // Waveform Style Switcher
  const handleSelectWaveform = (waveform: WaveformStyle) => {
    setActiveWaveform(waveform);
    if (currentUser) {
      authService.updateProfile({ preferredWaveform: waveform }).catch(() => {});
    }
  };

  // Animation Intensity Switcher
  const handleSelectIntensity = (intensity: AnimationIntensity) => {
    setActiveIntensity(intensity);
    if (currentUser) {
      authService.updateProfile({ animationIntensity: intensity }).catch(() => {});
    }
  };

  // Theme Switcher
  const handleSelectTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    triggerInteractionFeedback('atmosphere', ATMOSPHERE_THEMES[themeId]?.accent);
    if (currentUser) {
      authService.updateProfile({ preferredTheme: themeId }).catch(() => {});
    }
  };

  // Ambient Sound Toggle
  const handleToggleAmbient = () => {
    const sounds = ['rain', 'space_hum', 'cyber_breeze', 'stop'];
    const currentIndex = activeAmbient ? sounds.indexOf(activeAmbient) : -1;
    const nextSound = sounds[(currentIndex + 1) % sounds.length];
    const soundToPlay = nextSound === 'stop' ? null : nextSound;

    setActiveAmbient(soundToPlay);
    soundFx.playAmbient(nextSound);
    triggerInteractionFeedback('tool', '#06b6d4');
  };

  const displayAudioLevel = assistantState === 'speaking' ? outputLevel : inputLevel;

  const activeAnalyser =
    assistantState === 'speaking'
      ? playerRef.current?.getAnalyser() || null
      : streamerRef.current?.getAnalyser() || null;

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#04060d] text-slate-100 font-['Plus_Jakarta_Sans'] select-none will-change-transform ${
        isScreenShaking ? 'screen-shake' : ''
      }`}
    >
      {/* Background Cosmic Atmosphere */}
      <CosmicBackground
        theme={theme}
        state={assistantState}
        audioLevel={displayAudioLevel}
      />

      {/* Edge-Glow & Shockwave Feedback Animation Overlay */}
      <InteractionFeedbackOverlay
        event={feedbackEvent}
        theme={theme}
      />

      {/* Top HUD Navigation */}
      <StatusHeader
        state={assistantState}
        theme={theme}
        isMuted={isMuted}
        notesCount={voiceNotes.length}
        historyCount={conversationHistory.length}
        currentUser={currentUser}
        onToggleMute={handleToggleMute}
        onOpenNotes={() => setIsMemoryOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAtmosphereMenu={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Error / Warning Alert Banner */}
      {errorMessage && (
        <div className="w-full max-w-md mx-auto px-4 z-30 animate-in fade-in slide-in-from-top-2">
          <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-3 backdrop-blur-xl shadow-xl flex items-center justify-between gap-3 text-rose-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={startSession}
              aria-label="Retry connection"
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Central Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative z-10">
        {/* Animated Realistic Anime AI Companion Avatar */}
        <LyraaAnimeAvatar
          state={assistantState}
          theme={theme}
          audioLevel={displayAudioLevel}
          isMuted={isMuted}
          onTogglePower={handleTogglePower}
          onInterrupt={handleInterrupt}
        />

        {/* Dynamic Spectrum Waveform Visualizer */}
        <div className="mt-3 sm:mt-5 w-full flex justify-center">
          <WaveformVisualizer
            analyserNode={activeAnalyser}
            state={assistantState}
            theme={theme}
            waveformStyle={activeWaveform}
            intensity={activeIntensity}
            height={70}
          />
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <ControlsFooter
        state={assistantState}
        theme={theme}
        volume={volume}
        activeAmbient={activeAmbient}
        onVolumeChange={handleVolumeChange}
        onInterrupt={handleInterrupt}
        onToggleAmbient={handleToggleAmbient}
      />

      {/* Real-time Tool Activity Notification Overlay */}
      <ToolActivityOverlay
        action={currentToolAction}
        theme={theme}
        onDismiss={() => setCurrentToolAction(null)}
      />

      {/* Memory Core Slide-over Drawer */}
      <MemoryDrawer
        isOpen={isMemoryOpen}
        notes={voiceNotes}
        theme={theme}
        onClose={() => setIsMemoryOpen(false)}
        onDeleteNote={(id) => {
          setVoiceNotes((prev) => prev.filter((n) => n.id !== id));
          toolManagerRef.current?.deleteVoiceNote(id);
        }}
      />

      {/* Session Dialogue Memory Drawer */}
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        history={conversationHistory}
        theme={theme}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Settings & Customization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        activeVoice={activeVoice}
        activeThemeId={activeThemeId}
        activeWaveform={activeWaveform}
        activeIntensity={activeIntensity}
        theme={theme}
        modelName={connectedModel}
        currentUser={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        onSelectVoice={handleSelectVoice}
        onSelectTheme={handleSelectTheme}
        onSelectWaveform={handleSelectWaveform}
        onSelectIntensity={handleSelectIntensity}
      />

      {/* User Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        theme={theme}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
        }}
      />
    </div>
  );
}

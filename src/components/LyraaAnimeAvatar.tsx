import React from 'react';
import {
  Activity,
  Headphones,
  Mic,
  MicOff,
  Power,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { AssistantState, AtmosphereTheme } from '../types';

interface LyraaAnimeAvatarProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  audioLevel: number;
  isMuted: boolean;
  onTogglePower: () => void;
  onInterrupt?: () => void;
}

const AVATAR_IMAGES = {
  idle: '/src/assets/images/lyraa_anime_idle_1791528667060.jpg',
  listening: '/src/assets/images/lyraa_anime_listening_1791528680436.jpg',
  speaking: '/src/assets/images/lyraa_anime_speaking_1791528692691.jpg',
};

export const LyraaAnimeAvatar: React.FC<LyraaAnimeAvatarProps> = ({
  state,
  theme,
  audioLevel,
  isMuted,
  onTogglePower,
  onInterrupt,
}) => {
  const isConnected = state !== 'disconnected' && state !== 'connecting';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';

  // Determine active avatar image based on assistant state
  const activeImage =
    state === 'speaking'
      ? AVATAR_IMAGES.speaking
      : state === 'listening'
      ? AVATAR_IMAGES.listening
      : AVATAR_IMAGES.idle;

  const handleClick = () => {
    if (state === 'disconnected') {
      onTogglePower();
    } else if (state === 'speaking' && onInterrupt) {
      onInterrupt();
    } else {
      onTogglePower();
    }
  };

  // Dynamic audio-reactive scale
  const reactiveScale = 1 + (isSpeaking || isListening ? audioLevel * 0.09 : 0);
  const ringScale = 1 + (isSpeaking || isListening ? audioLevel * 0.22 : 0);

  return (
    <div className="relative flex flex-col items-center justify-center select-none my-auto">
      {/* Outer Holographic Energy Aura */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        {/* Ambient Color Glow behind character */}
        <div
          className="absolute inset-0 rounded-full blur-3xl transition-all duration-300 pointer-events-none"
          style={{
            backgroundColor: theme.accent,
            opacity: isConnected ? 0.35 + audioLevel * 0.45 : 0.12,
            transform: `scale(${ringScale})`,
          }}
        />

        {/* Outer Rotating Cyber Gyroscope Ring */}
        <div
          className={`absolute -inset-2 sm:-inset-4 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
            isConnecting
              ? 'animate-spin border-cyan-400 opacity-90'
              : isConnected
              ? 'border-cyan-500/40 opacity-70 animate-[spin_28s_linear_infinite]'
              : 'border-slate-800/60 opacity-30'
          }`}
          style={{
            borderColor: isConnected ? `${theme.accent}66` : undefined,
          }}
        />

        {/* Inner Counter-Rotating Telemetry Ring with Node Points */}
        <div
          className={`absolute inset-2 sm:inset-3 rounded-full border transition-all duration-500 pointer-events-none ${
            isConnecting
              ? 'animate-[spin_4s_linear_infinite_reverse] border-cyan-300/80'
              : isConnected
              ? 'border-cyan-500/40 animate-[spin_38s_linear_infinite_reverse]'
              : 'border-slate-800/40'
          }`}
          style={{
            borderColor: isConnected ? `${theme.orbColorSecondary}77` : undefined,
          }}
        >
          {/* Orbital Cyan Node Points */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-lg"
            style={{ backgroundColor: theme.accent }}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.orbColorTertiary }}
          />
          <div
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          <div
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: theme.orbColorSecondary }}
          />
        </div>

        {/* Pulse Waves when Speaking or Listening */}
        {(isSpeaking || isListening) && (
          <>
            <div
              className="absolute inset-4 rounded-full border border-current animate-ping opacity-30 pointer-events-none"
              style={{
                color: theme.accent,
                animationDuration: isSpeaking ? '1.8s' : '2.5s',
              }}
            />
            <div
              className="absolute inset-8 rounded-full border border-current animate-ping opacity-20 pointer-events-none delay-300"
              style={{
                color: theme.orbColorTertiary,
                animationDuration: isSpeaking ? '2.2s' : '3s',
              }}
            />
          </>
        )}

        {/* Central Realistic Anime Holographic Portal */}
        <button
          onClick={handleClick}
          aria-label={
            state === 'disconnected'
              ? 'Awaken Lyraa'
              : isSpeaking
              ? 'Interrupt Lyraa'
              : 'Disconnect Lyraa'
          }
          className="group relative w-56 h-56 sm:w-64 sm:h-64 md:w-76 md:h-76 rounded-full cursor-pointer flex items-center justify-center p-0 transition-transform duration-200 outline-none focus:outline-none active:scale-95 z-10 shadow-2xl overflow-hidden border-2"
          style={{
            transform: `scale(${reactiveScale})`,
            borderColor: isConnected ? theme.accent : 'rgba(51, 65, 85, 0.6)',
            boxShadow: isConnected
              ? `0 0 50px ${theme.glowColor}, inset 0 0 35px rgba(255,255,255,0.15)`
              : '0 0 25px rgba(0,0,0,0.8)',
          }}
        >
          {/* Subtle Cyber Vignette Background */}
          <div className="absolute inset-0 bg-slate-950/80 -z-10" />

          {/* Realistic Anime Character Portrait */}
          <img
            src={activeImage}
            alt="Lyraa Anime AI Companion"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
              state === 'disconnected'
                ? 'grayscale-60 brightness-75 contrast-95 scale-100'
                : 'brightness-105 contrast-105 scale-102'
            }`}
          />

          {/* Idle Natural Breathing Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

          {/* Holographic Scanlines & Digital Glaze */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
            }}
          />

          {/* Glowing Radial Color Tint around character rim */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 60%, ${theme.accent}33 100%)`,
              opacity: isConnected ? 0.7 + audioLevel * 0.4 : 0.2,
            }}
          />

          {/* State Overlay Badges */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-white pointer-events-none transition-all">
            {state === 'disconnected' && (
              <>
                <Power className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 group-hover:text-white">
                  Tap to Awaken
                </span>
              </>
            )}

            {state === 'connecting' && (
              <>
                <Activity className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span className="text-[11px] font-bold tracking-wider text-amber-300">
                  Calibrating...
                </span>
              </>
            )}

            {state === 'listening' && (
              <>
                {isMuted ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-bold tracking-wider text-rose-300 uppercase">
                      Muted
                    </span>
                  </>
                ) : (
                  <>
                    <Mic
                      className="w-3.5 h-3.5 transition-transform"
                      style={{
                        color: theme.accent,
                        transform: `scale(${1 + audioLevel * 0.4})`,
                      }}
                    />
                    <span
                      className="text-[11px] font-bold tracking-wider uppercase"
                      style={{ color: theme.orbColorTertiary }}
                    >
                      Listening
                    </span>
                  </>
                )}
              </>
            )}

            {state === 'speaking' && (
              <>
                <Volume2
                  className="w-3.5 h-3.5 text-purple-300 transition-transform animate-pulse"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.5})`,
                  }}
                />
                <span className="text-[11px] font-bold tracking-wider uppercase text-purple-200">
                  Speaking
                </span>
              </>
            )}

            {state === 'processing' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span className="text-[11px] font-bold tracking-wider text-cyan-200">
                  Thinking
                </span>
              </>
            )}
          </div>

          {/* Specular Highlight Arc */}
          <div className="absolute top-2 left-6 right-6 h-1/3 rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-[1px] pointer-events-none" />
        </button>
      </div>

      {/* Futuristic Floating Telemetry Pills below Avatar */}
      <div className="mt-3 flex items-center gap-2 z-10">
        <div className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
          <Headphones className="w-3 h-3 text-cyan-400" />
          <span>REAL-TIME NEURAL VOICE</span>
        </div>

        {isConnected && (
          <div
            className="px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 text-[10px] font-mono font-semibold"
            style={{
              backgroundColor: `${theme.accent}15`,
              borderColor: `${theme.accent}40`,
              color: theme.orbColorTertiary,
            }}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>24kHz HD AUDIO</span>
          </div>
        )}
      </div>
    </div>
  );
};

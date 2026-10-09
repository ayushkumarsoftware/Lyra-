import React from 'react';
import { Mic, MicOff, Power, Radio, Sparkles, Volume2 } from 'lucide-react';
import { AssistantState, AtmosphereTheme } from '../types';

interface LyraaOrbProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  audioLevel: number; // 0.0 to 1.0 (mic level when listening, output level when speaking)
  isMuted: boolean;
  onTogglePower: () => void;
  onInterrupt?: () => void;
}

export const LyraaOrb: React.FC<LyraaOrbProps> = ({
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

  // Dynamic scale factoring audio reactivity
  const dynamicScale = isSpeaking || isListening ? 1 + audioLevel * 0.35 : 1;
  const ringScale = isSpeaking || isListening ? 1 + audioLevel * 0.5 : 1;

  const handleClick = () => {
    if (state === 'disconnected') {
      onTogglePower();
    } else if (state === 'speaking' && onInterrupt) {
      onInterrupt();
    } else {
      onTogglePower();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer Gyroscope Rings */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 flex items-center justify-center">
        {/* Ambient Outer Halo Pulse */}
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-300 pointer-events-none"
          style={{
            backgroundColor: theme.accent,
            opacity: isConnected ? 0.35 + audioLevel * 0.45 : 0.12,
            transform: `scale(${ringScale})`,
          }}
        />

        {/* Outer Ring 1 - Counter Clockwise Gyro */}
        <div
          className={`absolute inset-4 sm:inset-6 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
            isConnecting
              ? 'animate-spin border-cyan-400 opacity-90'
              : isConnected
              ? 'border-cyan-500/30 opacity-70 animate-[spin_24s_linear_infinite]'
              : 'border-slate-800 opacity-40'
          }`}
          style={{
            borderColor: isConnected ? `${theme.accent}55` : undefined,
          }}
        />

        {/* Outer Ring 2 - Clockwise Gyro with Accent Dots */}
        <div
          className={`absolute inset-8 sm:inset-10 rounded-full border transition-all duration-500 pointer-events-none ${
            isConnecting
              ? 'animate-[spin_4s_linear_infinite_reverse] border-cyan-300/80'
              : isConnected
              ? 'border-cyan-500/40 animate-[spin_32s_linear_infinite_reverse]'
              : 'border-slate-800/60'
          }`}
          style={{
            borderColor: isConnected ? `${theme.orbColorSecondary}66` : undefined,
          }}
        >
          {/* Orbital telemetry ticks */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg"
            style={{ backgroundColor: theme.accent }}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: theme.orbColorTertiary }}
          />
        </div>

        {/* Sound Wave Ripple Layer when Speaking or Listening */}
        {(isSpeaking || isListening) && (
          <>
            <div
              className="absolute inset-10 rounded-full border border-current animate-ping opacity-25 pointer-events-none duration-1000"
              style={{
                color: theme.accent,
                animationDuration: isSpeaking ? '1.8s' : '2.4s',
              }}
            />
            <div
              className="absolute inset-16 rounded-full border border-current animate-ping opacity-20 pointer-events-none duration-700 delay-300"
              style={{
                color: theme.orbColorTertiary,
                animationDuration: isSpeaking ? '2.2s' : '3s',
              }}
            />
          </>
        )}

        {/* Connecting Radar Scanner Beam */}
        {isConnecting && (
          <div
            className="absolute inset-12 rounded-full border-t-2 border-r-2 animate-spin pointer-events-none"
            style={{
              borderColor: theme.accent,
              filter: `drop-shadow(0 0 12px ${theme.accent})`,
            }}
          />
        )}

        {/* Central Core Sphere / Interactive Orb Button */}
        <button
          onClick={handleClick}
          aria-label={
            state === 'disconnected'
              ? 'Activate Lyraa AI'
              : isSpeaking
              ? 'Interrupt Lyraa'
              : 'Disconnect Lyraa'
          }
          className={`group relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full cursor-pointer flex flex-col items-center justify-center p-0 transition-transform duration-200 outline-none focus:outline-none active:scale-95 z-10 shadow-2xl overflow-hidden`}
          style={{
            transform: `scale(${dynamicScale})`,
            boxShadow: isConnected
              ? `0 0 45px ${theme.glowColor}, inset 0 0 35px rgba(255,255,255,0.2)`
              : '0 0 20px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05)',
          }}
        >
          {/* Glass Orb Shell Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-black backdrop-blur-2xl" />

          {/* Dynamic Core Shimmer Plasma Gradient */}
          <div
            className={`absolute inset-0 opacity-80 transition-opacity duration-700 ${
              isConnected ? 'animate-pulse' : 'opacity-20'
            }`}
            style={{
              background: isConnected
                ? `radial-gradient(circle at 35% 35%, ${theme.orbColorTertiary} 0%, ${theme.orbColorSecondary} 40%, ${theme.orbColorPrimary} 75%, transparent 100%)`
                : 'radial-gradient(circle at 40% 40%, #1e293b 0%, #0f172a 60%, transparent 100%)',
            }}
          />

          {/* Specular Highlight Gloss Arch */}
          <div className="absolute top-2 left-4 right-4 h-1/2 rounded-full bg-gradient-to-b from-white/25 via-white/5 to-transparent blur-[1px] pointer-events-none" />

          {/* Fluid Core Center Visual */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white pointer-events-none">
            {state === 'disconnected' && (
              <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:border-cyan-400/60 group-hover:bg-slate-800 transition-all">
                  <Power className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
                  Tap to Awaken
                </span>
              </div>
            )}

            {state === 'connecting' && (
              <div className="flex flex-col items-center gap-2">
                <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 animate-pulse" />
                <span className="text-xs sm:text-sm font-medium tracking-wide text-cyan-200">
                  Calibrating...
                </span>
              </div>
            )}

            {state === 'listening' && (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform"
                  style={{
                    backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : `${theme.accent}30`,
                    border: `1.5px solid ${isMuted ? '#ef4444' : theme.accent}`,
                  }}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />
                  ) : (
                    <Mic
                      className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-100"
                      style={{
                        transform: `scale(${1 + audioLevel * 0.4})`,
                      }}
                    />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white drop-shadow">
                  {isMuted ? 'Muted' : 'Listening'}
                </span>
                <span className="text-[10px] text-white/80 font-mono tracking-tighter">
                  Speak naturally
                </span>
              </div>
            )}

            {state === 'speaking' && (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.accent}40`,
                    border: `2px solid ${theme.orbColorTertiary}`,
                  }}
                >
                  <Volume2
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-75"
                    style={{
                      transform: `scale(${1 + audioLevel * 0.45})`,
                    }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white drop-shadow">
                  Speaking
                </span>
                <span className="text-[10px] text-white/75 font-mono tracking-tighter">
                  Tap to interrupt
                </span>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
                <span className="text-xs font-medium text-amber-200">
                  Processing...
                </span>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

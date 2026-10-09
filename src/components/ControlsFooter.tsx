import React from 'react';
import {
  CloudRain,
  Hand,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { AssistantState, AtmosphereTheme } from '../types';

interface ControlsFooterProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  volume: number;
  activeAmbient: string | null;
  onVolumeChange: (vol: number) => void;
  onInterrupt: () => void;
  onToggleAmbient: () => void;
}

export const ControlsFooter: React.FC<ControlsFooterProps> = ({
  state,
  theme,
  volume,
  activeAmbient,
  onVolumeChange,
  onInterrupt,
  onToggleAmbient,
}) => {
  const isSpeaking = state === 'speaking';
  const isConnected = state !== 'disconnected' && state !== 'connecting';

  return (
    <footer className="w-full max-w-lg mx-auto px-4 pb-6 pt-2 flex flex-col items-center gap-3 z-20">
      {/* Dynamic Status Feedback Banner */}
      <div className="w-full text-center">
        {state === 'disconnected' && (
          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Tap the central core to awaken Lyraa
          </p>
        )}
        {state === 'connecting' && (
          <p className="text-xs sm:text-sm text-amber-300 font-medium tracking-wide animate-pulse">
            Establishing 16kHz & 24kHz HD Neural Voice Channel...
          </p>
        )}
        {state === 'listening' && (
          <p className="text-xs sm:text-sm text-cyan-300 font-medium tracking-wide flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            Lyraa is listening • Speak naturally
          </p>
        )}
        {state === 'speaking' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs sm:text-sm text-white font-medium tracking-wide flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              Lyraa is speaking • Barge in or interrupt anytime
            </p>
            {/* Quick Instant Interrupt Action Button */}
            <button
              onClick={onInterrupt}
              className="px-4 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold tracking-wide flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-rose-950/30 transition-all active:scale-95 cursor-pointer"
            >
              <Hand className="w-3.5 h-3.5" />
              Tap to Interrupt
            </button>
          </div>
        )}
      </div>

      {/* Glassmorphism Control Dock */}
      {isConnected && (
        <div className="w-full bg-slate-900/75 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
          {/* Ambient Soundscape Toggle */}
          <button
            onClick={onToggleAmbient}
            aria-label="Toggle ambient soundscape"
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeAmbient
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-950/30'
                : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeAmbient === 'rain' ? (
              <CloudRain className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">
              {activeAmbient ? `Ambience: ${activeAmbient}` : 'Ambience'}
            </span>
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              style={{ accentColor: theme.accent }}
            />
            <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </footer>
  );
};

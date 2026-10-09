import React from 'react';
import {
  Activity,
  Bookmark,
  BrainCircuit,
  Mic,
  MicOff,
  Palette,
  Settings2,
  Sparkles,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AssistantState, AtmosphereTheme, UserProfile } from '../types';

interface StatusHeaderProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  isMuted: boolean;
  notesCount: number;
  historyCount: number;
  currentUser: UserProfile | null;
  onToggleMute: () => void;
  onOpenNotes: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAtmosphereMenu: () => void;
  onOpenAuth: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  state,
  theme,
  isMuted,
  notesCount,
  historyCount,
  currentUser,
  onToggleMute,
  onOpenNotes,
  onOpenHistory,
  onOpenSettings,
  onOpenAtmosphereMenu,
  onOpenAuth,
}) => {
  const isConnected = state !== 'disconnected' && state !== 'connecting';

  return (
    <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between z-20">
      {/* Brand & Assistant Identity */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center p-0.5 border shadow-lg transition-colors cursor-pointer"
          onClick={onOpenSettings}
          style={{
            borderColor: `${theme.accent}60`,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            boxShadow: `0 0 15px ${theme.glowColor}`,
          }}
        >
          <Sparkles
            className="w-5 h-5 transition-transform duration-300"
            style={{ color: theme.accent }}
          />
          {isConnected && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: theme.accent }}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-['Space_Grotesk']">
              LYRAA
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase font-semibold border"
                style={{
                  backgroundColor: `${theme.accent}20`,
                  color: theme.orbColorTertiary,
                  borderColor: `${theme.accent}40`,
                }}
              >
                LIVE
              </span>
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">
            {currentUser ? `Companion to ${currentUser.name}` : 'Witty • Voice-Only • Neural AI'}
          </p>
        </div>
      </div>

      {/* Connection & Quick Action HUD */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Real-time State Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium backdrop-blur-md">
          {state === 'disconnected' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px]">STANDBY</span>
            </>
          ) : state === 'connecting' ? (
            <>
              <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300 font-mono text-[11px]">SYNCING</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono text-[11px]">AUDIO-TO-AUDIO</span>
            </>
          )}
        </div>

        {/* User Account / Auth Button */}
        <button
          onClick={onOpenAuth}
          aria-label={currentUser ? 'Manage profile' : 'Sign In'}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            currentUser
              ? 'bg-slate-900/90 border-slate-700 text-white hover:border-slate-600'
              : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
          }`}
          style={{
            borderColor: currentUser ? `${theme.accent}50` : undefined,
          }}
        >
          {currentUser ? (
            <>
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-black font-extrabold"
                style={{ backgroundColor: theme.accent }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.name}</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </>
          )}
        </button>

        {/* Mic Mute Toggle */}
        {isConnected && (
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`p-2 sm:p-2.5 rounded-xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-rose-900/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>
        )}

        {/* Conversation History Drawer Button */}
        <button
          onClick={onOpenHistory}
          aria-label="Conversation History"
          title="Conversation dialogue memory"
          className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <BrainCircuit className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          {historyCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-black font-mono"
              style={{ backgroundColor: theme.accent }}
            >
              {historyCount}
            </span>
          )}
        </button>

        {/* Atmosphere Theme Selector Button */}
        <button
          onClick={onOpenAtmosphereMenu}
          aria-label="Change Atmosphere"
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Palette className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: theme.accent }} />
        </button>

        {/* Memory Core Button */}
        <button
          onClick={onOpenNotes}
          aria-label="Open Memory Core"
          className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Bookmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          {notesCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-black font-mono"
              style={{ backgroundColor: theme.accent }}
            >
              {notesCount}
            </span>
          )}
        </button>

        {/* Settings Modal Toggle */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Settings2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </header>
  );
};

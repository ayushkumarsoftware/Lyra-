import React from 'react';
import {
  ExternalLink,
  Globe,
  Palette,
  Bookmark,
  Cpu,
  Music,
  X,
  Sparkles,
} from 'lucide-react';
import { ToolActionRecord, AtmosphereTheme } from '../types';

interface ToolActivityOverlayProps {
  action: ToolActionRecord | null;
  theme: AtmosphereTheme;
  onDismiss: () => void;
}

export const ToolActivityOverlay: React.FC<ToolActivityOverlayProps> = ({
  action,
  theme,
  onDismiss,
}) => {
  if (!action) return null;

  const renderIcon = () => {
    switch (action.name) {
      case 'openWebsite':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'changeAtmosphere':
        return <Palette className="w-5 h-5 text-purple-400" />;
      case 'takeVoiceNote':
        return <Bookmark className="w-5 h-5 text-amber-400" />;
      case 'getDeviceStatus':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'playAmbientSound':
        return <Music className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  const isWebsiteOpen = action.name === 'openWebsite' && action.data?.url;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div
        className="relative bg-slate-900/90 border rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 transition-all"
        style={{
          borderColor: `${theme.accent}60`,
          boxShadow: `0 10px 30px -10px ${theme.glowColor}`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center p-1 border shadow-inner"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderColor: `${theme.accent}40`,
              }}
            >
              {renderIcon()}
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-300 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Browser Action Executed
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {action.title}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Dismiss action notification"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 pl-1 leading-relaxed">
          {action.description}
        </p>

        {isWebsiteOpen && (
          <div className="pt-1 flex items-center gap-2">
            <a
              href={action.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-cyan-950/20"
            >
              <span>Visit Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

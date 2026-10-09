import React from 'react';
import { Bookmark, Check, Copy, Trash2, X } from 'lucide-react';
import { VoiceNote, AtmosphereTheme } from '../types';

interface MemoryDrawerProps {
  isOpen: boolean;
  notes: VoiceNote[];
  theme: AtmosphereTheme;
  onClose: () => void;
  onDeleteNote: (id: string) => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  notes,
  theme,
  onClose,
  onDeleteNote,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm h-full bg-slate-950/95 border-l border-slate-800 p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300"
        style={{
          boxShadow: `-10px 0 40px ${theme.glowColor}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border"
              style={{
                backgroundColor: `${theme.accent}15`,
                borderColor: `${theme.accent}40`,
                color: theme.accent,
              }}
            >
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Memory Core
              </h3>
              <p className="text-[11px] text-slate-400">
                {notes.length} {notes.length === 1 ? 'entry' : 'entries'} captured by Lyraa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close memory drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Bookmark className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium text-slate-400">
                Memory Core is empty
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Ask Lyraa in conversation:{' '}
                <span className="text-cyan-400">
                  "Lyraa, remember to send the project brief tomorrow"
                </span>
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: `${theme.accent}15`,
                      borderColor: `${theme.accent}30`,
                      color: theme.orbColorTertiary,
                    }}
                  >
                    {note.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(note.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {note.note}
                </p>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/50">
                  <button
                    onClick={() => handleCopy(note.id, note.note)}
                    aria-label="Copy note"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedId === note.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    aria-label="Delete note"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

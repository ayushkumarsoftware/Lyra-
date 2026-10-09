import React from 'react';
import {
  BrainCircuit,
  Check,
  Copy,
  MessageSquare,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { AtmosphereTheme, ConversationTurn } from '../types';

interface ConversationHistoryDrawerProps {
  isOpen: boolean;
  history: ConversationTurn[];
  theme: AtmosphereTheme;
  onClose: () => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  isOpen,
  history,
  theme,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = history
      .map(
        (t) =>
          `[${new Date(t.timestamp).toLocaleTimeString()}] ${
            t.role === 'user' ? 'User' : 'Lyraa'
          }: ${t.text}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-slate-950/95 border-l border-slate-800 p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300"
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
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Session Dialogue Memory
                </h3>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold border"
                  style={{
                    backgroundColor: `${theme.accent}20`,
                    color: theme.orbColorTertiary,
                    borderColor: `${theme.accent}40`,
                  }}
                >
                  LIVE CONTEXT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Last {history.length} dialogue turns accessible to Gemini Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                onClick={handleCopyTranscript}
                title="Copy entire session transcript"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close dialogue memory"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Context Pill */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>
            Lyraa recalls past statements in this active session naturally via continuous context.
          </span>
        </div>

        {/* Conversation Turns List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium text-slate-400">
                No conversation turns yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Speak with Lyraa using the central core to build real-time conversational memory.
              </p>
            </div>
          ) : (
            history.map((turn) => {
              const isUser = turn.role === 'user';
              return (
                <div
                  key={turn.id}
                  className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all ${
                    isUser
                      ? 'bg-slate-900/40 border-slate-800/60 ml-4'
                      : 'bg-slate-900/85 border-slate-800 mr-4'
                  }`}
                  style={{
                    borderColor: !isUser ? `${theme.accent}30` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isUser ? (
                        <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                          <User className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-black"
                          style={{ backgroundColor: theme.accent }}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-white tracking-tight">
                        {isUser ? 'You' : 'Lyraa'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(turn.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal pl-0.5">
                    {turn.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

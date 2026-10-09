import React, { useState } from 'react';
import {
  Activity,
  Check,
  Disc3,
  Flame,
  Info,
  Palette,
  Sparkles,
  Volume2,
  Waves,
  X,
} from 'lucide-react';
import {
  AnimationIntensity,
  AtmosphereTheme,
  UserProfile,
  VoiceOption,
  WaveformStyle,
} from '../types';
import { ATMOSPHERE_THEMES } from '../theme/atmospheres';
import { authService } from '../services/AuthService';

interface SettingsModalProps {
  isOpen: boolean;
  activeVoice: VoiceOption;
  activeThemeId: string;
  activeWaveform: WaveformStyle;
  activeIntensity: AnimationIntensity;
  theme: AtmosphereTheme;
  modelName: string;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSelectVoice: (voice: VoiceOption) => void;
  onSelectTheme: (themeId: string) => void;
  onSelectWaveform: (waveform: WaveformStyle) => void;
  onSelectIntensity: (intensity: AnimationIntensity) => void;
}

const VOICE_OPTIONS: Array<{
  id: VoiceOption;
  name: string;
  desc: string;
  gender: string;
}> = [
  { id: 'Aoede', name: 'Aoede', desc: 'Charming, lively, expressive female tone (Default)', gender: 'Female' },
  { id: 'Kore', name: 'Kore', desc: 'Warm, melodious, relaxed conversational vibe', gender: 'Female' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Energetic, crisp, futuristic voice', gender: 'Neutral' },
  { id: 'Puck', name: 'Puck', desc: 'Spirited, playful, enthusiastic voice', gender: 'Neutral' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Deep, resonant, grounded tone', gender: 'Male' },
];

const WAVEFORM_STYLES: Array<{
  id: WaveformStyle;
  name: string;
  desc: string;
}> = [
  { id: 'fluid_spline', name: 'Fluid Spline', desc: 'Flowing harmonic sine ribbon' },
  { id: 'cyber_bars', name: 'Cyber Equalizer', desc: 'High-tech neon spectrum bars' },
  { id: 'radial_halo', name: 'Radial Halo', desc: 'Pulsing circular audio starburst' },
  { id: 'quantum_dots', name: 'Quantum Nodes', desc: 'Floating particle frequency points' },
];

const INTENSITY_OPTIONS: Array<{
  id: AnimationIntensity;
  name: string;
  desc: string;
}> = [
  { id: 'subtle', name: 'Subtle', desc: 'Smooth, gentle atmospheric motion' },
  { id: 'balanced', name: 'Balanced', desc: 'Natural voice-reactive kinetics' },
  { id: 'energetic', name: 'Energetic', desc: 'Dynamic high-amplitude kinetic glow' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  activeVoice,
  activeThemeId,
  activeWaveform,
  activeIntensity,
  theme,
  modelName,
  currentUser,
  onClose,
  onSelectVoice,
  onSelectTheme,
  onSelectWaveform,
  onSelectIntensity,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'animations' | 'voice' | 'specs'>('themes');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveToProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await authService.updateProfile({
        preferredVoice: activeVoice,
        preferredTheme: activeThemeId,
        preferredWaveform: activeWaveform,
        animationIntensity: activeIntensity,
      });
      setSavedNotice('Preferences saved to your cloud profile.');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      console.error('Failed to sync profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-950/95 border rounded-3xl p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        style={{
          borderColor: `${theme.accent}40`,
          boxShadow: `0 20px 50px ${theme.glowColor}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center p-1 border shadow-inner"
              style={{
                backgroundColor: `${theme.accent}15`,
                borderColor: `${theme.accent}40`,
                color: theme.accent,
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Lyraa Customization & Settings
              </h3>
              <p className="text-xs text-slate-400">
                Themes, waveform kinetics, voice personas, and telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span>Themes</span>
          </button>
          <button
            onClick={() => setActiveTab('animations')}
            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'animations'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span>Animation</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span>Voice</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Engine</span>
          </button>
        </div>

        {/* TAB 1: COLOR THEMES */}
        {activeTab === 'themes' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-400">
              Select an atmospheric lighting aura for Lyraa's interface:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(ATMOSPHERE_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTheme(t.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    activeThemeId === t.id
                      ? 'bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: activeThemeId === t.id ? t.accent : undefined,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-xl border shadow-inner flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: t.accent,
                      borderColor: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {activeThemeId === t.id && (
                      <Check className="w-4 h-4 text-black stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white tracking-tight">
                      {t.name}
                    </h5>
                    <div className="flex gap-1 mt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.orbColorPrimary }}
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.orbColorSecondary }}
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.orbColorTertiary }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ANIMATION STYLES */}
        {activeTab === 'animations' && (
          <div className="flex flex-col gap-4">
            {/* Waveform Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                Waveform Geometry
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WAVEFORM_STYLES.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => onSelectWaveform(w.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeWaveform === w.id
                        ? 'bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: activeWaveform === w.id ? theme.accent : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{w.name}</span>
                      {activeWaveform === w.id && (
                        <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{w.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Intensity */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                Kinetic Pulse Intensity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {INTENSITY_OPTIONS.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => onSelectIntensity(i.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      activeIntensity === i.id
                        ? 'bg-slate-900 border-cyan-400 shadow-md'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: activeIntensity === i.id ? theme.accent : undefined,
                    }}
                  >
                    <span className="text-xs font-bold text-white block">{i.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{i.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VOICE PERSONAS */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs text-slate-400">
              Select Lyraa's prebuilt voice synthesis character:
            </span>
            <div className="space-y-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeVoice === v.id
                      ? 'bg-slate-900 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                  style={{
                    borderColor: activeVoice === v.id ? theme.accent : undefined,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {v.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {v.gender}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{v.desc}</p>
                  </div>
                  {activeVoice === v.id && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-black"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ENGINE TELEMETRY */}
        {activeTab === 'specs' && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Real-time Neural Channel Metrics
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MODEL</span>
                <span className="text-white font-semibold">{modelName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PIPELINE</span>
                <span className="text-emerald-400 font-semibold">Audio-to-Audio (STRICT)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MICROPHONE</span>
                <span className="text-white">16,000 Hz PCM16</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SPEECH PLAYBACK</span>
                <span className="text-white">24,000 Hz HD PCM</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Sync Button */}
        {currentUser && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Logged in as <strong className="text-white">{currentUser.name}</strong>
            </span>
            <button
              onClick={handleSaveToProfile}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: theme.accent }}
            >
              {saving ? 'Saving...' : 'Sync Preferences'}
            </button>
          </div>
        )}

        {savedNotice && (
          <p className="text-[11px] text-emerald-400 text-center font-medium animate-pulse">
            {savedNotice}
          </p>
        )}
      </div>
    </div>
  );
};

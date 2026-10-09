/**
 * Core type definitions for Lyraa Real-time Voice AI Companion
 */

export type AssistantState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'processing';

export type VoiceOption = 'Aoede' | 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir';

export type WaveformStyle = 'fluid_spline' | 'cyber_bars' | 'radial_halo' | 'quantum_dots';

export type AnimationIntensity = 'subtle' | 'balanced' | 'energetic';

export interface AtmosphereTheme {
  id: string;
  name: string;
  accent: string;
  glowColor: string;
  orbColorPrimary: string;
  orbColorSecondary: string;
  orbColorTertiary: string;
  bgGradient: string;
  badgeBg: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
}

export interface ToolActionRecord {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  timestamp: number;
  data?: any;
}

export interface VoiceNote {
  id: string;
  note: string;
  category: 'reminder' | 'idea' | 'personal' | 'general';
  timestamp: number;
}

export interface AudioMetrics {
  inputLevel: number; // 0.0 to 1.0
  outputLevel: number; // 0.0 to 1.0
  isSpeaking: boolean;
  isListening: boolean;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  toolCalls?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferredVoice: VoiceOption;
  preferredTheme: string;
  preferredWaveform: WaveformStyle;
  animationIntensity: AnimationIntensity;
  customBio?: string;
  createdAt: number;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

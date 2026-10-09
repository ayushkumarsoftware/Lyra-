import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserProfile, VoiceOption, WaveformStyle, AnimationIntensity } from '../types';

export interface UserRecord extends UserProfile {
  passwordHash: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'lyraa-cyber-live-secret-key-2026';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with users.json
let usersMap: Map<string, UserRecord> = new Map();

function loadUsers(): void {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: UserRecord[] = JSON.parse(data);
      usersMap.clear();
      list.forEach((u) => usersMap.set(u.id, u));
      return;
    }
  } catch (err) {
    console.error('[Auth] Failed to load users.json, initializing fresh store:', err);
  }

  // Seed default guest user if no users exist
  seedDefaultUser();
}

function saveUsers(): void {
  try {
    const list = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Auth] Failed to save users.json:', err);
  }
}

function seedDefaultUser(): void {
  const defaultPasswordHash = bcrypt.hashSync('lyraa2026', 10);
  const guestUser: UserRecord = {
    id: 'usr_guest_demo',
    email: 'guest@lyraa.ai',
    passwordHash: defaultPasswordHash,
    name: 'Cyber Voyager',
    preferredVoice: 'Aoede',
    preferredTheme: 'cyber_cyan',
    preferredWaveform: 'fluid_spline',
    animationIntensity: 'balanced',
    customBio: 'Exploring voice-native artificial intelligence.',
    createdAt: Date.now(),
  };
  usersMap.set(guestUser.id, guestUser);
  saveUsers();
}

loadUsers();

export function toPublicProfile(u: UserRecord): UserProfile {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    preferredVoice: u.preferredVoice,
    preferredTheme: u.preferredTheme,
    preferredWaveform: u.preferredWaveform,
    animationIntensity: u.animationIntensity,
    customBio: u.customBio,
    createdAt: u.createdAt,
  };
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  preferredVoice?: VoiceOption;
  preferredTheme?: string;
}): Promise<{ token: string; user: UserProfile }> {
  const emailClean = params.email.trim().toLowerCase();
  if (!emailClean || !emailClean.includes('@')) {
    throw new Error('Valid email address is required.');
  }

  if (!params.password || params.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Check duplicate email
  for (const existing of usersMap.values()) {
    if (existing.email.toLowerCase() === emailClean) {
      throw new Error('An account with this email already exists.');
    }
  }

  const passwordHash = await bcrypt.hash(params.password, 10);
  const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const newUser: UserRecord = {
    id,
    email: emailClean,
    name: params.name.trim() || emailClean.split('@')[0],
    passwordHash,
    preferredVoice: params.preferredVoice || 'Aoede',
    preferredTheme: params.preferredTheme || 'cyber_cyan',
    preferredWaveform: 'fluid_spline',
    animationIntensity: 'balanced',
    createdAt: Date.now(),
  };

  usersMap.set(id, newUser);
  saveUsers();

  const token = jwt.sign({ userId: id, email: newUser.email }, JWT_SECRET, {
    expiresIn: '30d',
  });

  return { token, user: toPublicProfile(newUser) };
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  const emailClean = params.email.trim().toLowerCase();

  let targetUser: UserRecord | null = null;
  for (const u of usersMap.values()) {
    if (u.email.toLowerCase() === emailClean) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(params.password, targetUser.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign(
    { userId: targetUser.id, email: targetUser.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { token, user: toPublicProfile(targetUser) };
}

export function getUserById(id: string): UserProfile | null {
  const record = usersMap.get(id);
  if (!record) return null;
  return toPublicProfile(record);
}

export function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): UserProfile {
  const record = usersMap.get(id);
  if (!record) {
    throw new Error('User not found.');
  }

  if (updates.name !== undefined) record.name = updates.name.trim();
  if (updates.preferredVoice !== undefined) record.preferredVoice = updates.preferredVoice;
  if (updates.preferredTheme !== undefined) record.preferredTheme = updates.preferredTheme;
  if (updates.preferredWaveform !== undefined) record.preferredWaveform = updates.preferredWaveform;
  if (updates.animationIntensity !== undefined) record.animationIntensity = updates.animationIntensity;
  if (updates.customBio !== undefined) record.customBio = updates.customBio;

  usersMap.set(id, record);
  saveUsers();

  return toPublicProfile(record);
}

export function verifyJwtToken(token: string): { userId: string; email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return payload;
  } catch {
    return null;
  }
}

import React, { useState } from 'react';
import {
  Check,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { AtmosphereTheme, UserProfile } from '../types';
import { authService } from '../services/AuthService';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  theme: AtmosphereTheme;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  theme,
  onClose,
  onAuthSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'profile'>(
    currentUser ? 'profile' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState(currentUser?.customBio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      setTab('profile');
      setName(currentUser.name);
      setBio(currentUser.customBio || '');
    } else {
      setTab('login');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.register({
        email,
        password,
        name: name || email.split('@')[0],
      });
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await authService.login('guest@lyraa.ai', 'lyraa2026');
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await authService.updateProfile({
        name,
        customBio: bio,
      });
      onAuthSuccess(updated);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-950/95 border rounded-3xl p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentUser ? 'User Profile' : 'Neural Authentication'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser
                  ? 'Manage your identity and preferences'
                  : 'Secure JWT sign-in for customized conversation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle if not logged in */}
        {!currentUser && (
          <div className="flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Login Form */}
        {!currentUser && tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: theme.accent }}
            >
              {loading ? 'Authenticating...' : 'Sign In with JWT'}
            </button>

            {/* Quick Demo Login Option */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-mono">
                or instant access
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              1-Click Demo Login (Cyber Voyager)
            </button>
          </form>
        )}

        {/* Register Form */}
        {!currentUser && tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your preferred name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: theme.accent }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Profile Management Form */}
        {currentUser && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-black"
                style={{ backgroundColor: theme.accent }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{currentUser.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Custom Profile Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your interests or style so Lyraa tailors her conversation..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: theme.accent }}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

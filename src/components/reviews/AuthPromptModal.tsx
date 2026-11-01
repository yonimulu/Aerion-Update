import React, { useState } from 'react';
import { X, LogIn, UserCheck, ShieldCheck, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { AuthService, AppUser } from '../../services/authService';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: AppUser) => void;
  title?: string;
  subtitle?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  title = 'Engineer Verification Required',
  subtitle = 'Please authenticate to submit ratings, peer reviews, and helpfulness votes.'
}) => {
  const [mode, setMode] = useState<'quick' | 'supabase_login' | 'supabase_signup'>('quick');

  // Quick engineer credentials
  const [quickName, setQuickName] = useState('Dr. Alex Morgan');
  const [quickEmail, setQuickEmail] = useState('a.morgan@aerospace.org');

  // Supabase Auth credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickEmail.trim()) return;
    const user = AuthService.signInAsEngineer(quickName, quickEmail);
    onAuthenticated(user);
    onClose();
  };

  const handleAdminQuickSignIn = () => {
    const user = AuthService.signInAsEngineer('Admin Binyam', 'Binyamawiw@gmail.com');
    onAuthenticated(user);
    onClose();
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'supabase_login') {
        const res = await AuthService.signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          onAuthenticated(res.user);
          onClose();
        }
      } else {
        const res = await AuthService.signUp(email, password, fullName);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          onAuthenticated(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white font-mono">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Tabs: Quick Engineer Profile vs Supabase Credentials */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-mono">
          <button
            onClick={() => { setMode('quick'); setError(null); }}
            className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors cursor-pointer ${
              mode === 'quick'
                ? 'border-black dark:border-white text-zinc-950 dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Quick Engineer Profile
          </button>
          <button
            onClick={() => { setMode('supabase_login'); setError(null); }}
            className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors cursor-pointer ${
              mode !== 'quick'
                ? 'border-black dark:border-white text-zinc-950 dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Supabase Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-mono">
            {error}
          </div>
        )}

        {mode === 'quick' ? (
          <form onSubmit={handleQuickSignIn} className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Set your engineer name and work email for review attribution. No password required for catalog peer reviews.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Engineer Name & Role:</span>
              </label>
              <input
                type="text"
                required
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. Dr. Sarah Vance (Propulsion Engineer)"
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Work / Affiliation Email:</span>
              </label>
              <input
                type="email"
                required
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="name@organization.aero"
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Continue as Engineer</span>
              </button>

              <button
                type="button"
                onClick={handleAdminQuickSignIn}
                className="w-full py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Sign in as Admin (Binyamawiw@gmail.com)</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSupabaseAuth} className="space-y-4">
            <div className="flex space-x-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('supabase_login')}
                className={`px-2.5 py-1 rounded-md ${mode === 'supabase_login' ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : 'text-zinc-500'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('supabase_signup')}
                className={`px-2.5 py-1 rounded-md ${mode === 'supabase_signup' ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : 'text-zinc-500'}`}
              >
                Create Account
              </button>
            </div>

            {mode === 'supabase_signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Glenn"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@aerion.space"
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                Password:
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? 'Authenticating...' : mode === 'supabase_login' ? 'Sign In with Supabase' : 'Create Supabase Account'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

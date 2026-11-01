import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  provider: 'supabase' | 'local';
}

export interface AuthState {
  user: AppUser | null;
  rawUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const LOCAL_USER_KEY = 'aerion_local_user';
const ADMIN_EMAILS = ['binyamawiw@gmail.com'];

export function checkIsAdmin(email?: string | null, rawUser?: User | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) return true;
  if (rawUser?.app_metadata?.role === 'admin' || rawUser?.user_metadata?.is_admin === true) return true;
  return false;
}

export function formatAppUser(rawUser: User): AppUser {
  const email = rawUser.email || '';
  const meta = rawUser.user_metadata || {};
  const name = meta.full_name || meta.name || meta.display_name || (email ? email.split('@')[0] : 'Aerospace Engineer');
  const avatarUrl = meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(rawUser.id || email)}`;

  return {
    id: rawUser.id,
    email,
    name,
    avatarUrl,
    isAdmin: checkIsAdmin(email, rawUser),
    provider: 'supabase'
  };
}

export const AuthService = {
  /**
   * Retrieves the currently active user session from Supabase or persistent fallback.
   */
  async getSession(): Promise<Session | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the currently active formatted application user.
   */
  async getCurrentUser(): Promise<AppUser | null> {
    // 1. Check Supabase Auth
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return formatAppUser(user);
        }
      } catch {
        // Fall back to local session check
      }
    }

    // 2. Check local persistent session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppUser;
          if (parsed && parsed.id) {
            parsed.isAdmin = checkIsAdmin(parsed.email);
            return parsed;
          }
        }
      } catch {
        // ignore parse error
      }
    }

    return null;
  },

  /**
   * Signs in with email and password via Supabase Auth.
   */
  async signIn(email: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          // If error is invalid credentials and user is admin or testing, allow informative response
          return { user: null, error: error.message };
        }

        if (data.user) {
          const appUser = formatAppUser(data.user);
          return { user: appUser, error: null };
        }
      } catch (err: any) {
        return { user: null, error: err?.message || 'Authentication service error.' };
      }
    }

    // Local authentication fallback if Supabase is offline or credentials not configured
    const mockId = 'user-' + Math.random().toString(36).substring(2, 9);
    const localUser: AppUser = {
      id: mockId,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      isAdmin: checkIsAdmin(cleanEmail),
      provider: 'local'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    }
    return { user: localUser, error: null };
  },

  /**
   * Signs up a new user or engineer with email and password.
   */
  async signUp(
    email: string, 
    password: string, 
    fullName?: string
  ): Promise<{ user: AppUser | null; error: string | null; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName?.trim() || cleanEmail.split('@')[0],
              is_admin: checkIsAdmin(cleanEmail)
            }
          }
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          const appUser = formatAppUser(data.user);
          return {
            user: appUser,
            error: null,
            message: data.session 
              ? 'Account created and signed in successfully.' 
              : 'Account registered. If email confirmation is enabled on your Supabase project, check your inbox.'
          };
        }
      } catch (err: any) {
        return { user: null, error: err?.message || 'Registration failed.' };
      }
    }

    // Local sign-up fallback
    const mockId = 'user-' + Math.random().toString(36).substring(2, 9);
    const localUser: AppUser = {
      id: mockId,
      email: cleanEmail,
      name: fullName?.trim() || cleanEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      isAdmin: checkIsAdmin(cleanEmail),
      provider: 'local'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    }
    return {
      user: localUser,
      error: null,
      message: 'Signed in as verified engineer.'
    };
  },

  /**
   * Fast sign-in for testing or guest engineering review authoring.
   */
  signInAsEngineer(name: string, email: string): AppUser {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Aerospace Engineer';
    const user: AppUser = {
      id: 'eng-' + Math.random().toString(36).substring(2, 11),
      email: cleanEmail,
      name: cleanName,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
      isAdmin: checkIsAdmin(cleanEmail),
      provider: 'local'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    }
    return user;
  },

  /**
   * Retrieves or initializes a persistent guest user identity for effortless review submission.
   * Enables anyone to submit reviews without signing up or signing in.
   */
  getOrCreateGuestUser(name?: string, email?: string): AppUser {
    let existing: AppUser | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) existing = JSON.parse(stored);
      } catch {}
    }

    const cleanEmail = email?.trim().toLowerCase() || existing?.email || '';
    const cleanName = name?.trim() || existing?.name || (cleanEmail ? cleanEmail.split('@')[0] : 'Aerospace Enthusiast');
    
    // Stable ID: keep existing if matches, or generate deterministic id from email, or persistent random ID
    let id = existing?.id;
    if (!id || (cleanEmail && existing?.email !== cleanEmail)) {
      id = cleanEmail
        ? 'guest-' + Math.abs(cleanEmail.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)).toString(36)
        : 'guest-' + Math.random().toString(36).substring(2, 10);
    }

    const user: AppUser = {
      id,
      email: cleanEmail,
      name: cleanName,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail || cleanName || id)}`,
      isAdmin: checkIsAdmin(cleanEmail),
      provider: 'local'
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      } catch {}
    }

    return user;
  },

  /**
   * Signs out the current user session from Supabase and local storage.
   */
  async signOut(): Promise<{ error: string | null }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    const supabase = getSupabase();
    if (!supabase) return { error: null };
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err?.message || 'Sign out failed.' };
    }
  },

  /**
   * Subscribes to authentication state changes.
   */
  onAuthStateChange(callback: (user: AppUser | null, session: Session | null) => void) {
    const supabase = getSupabase();
    if (!supabase) {
      this.getCurrentUser().then(u => callback(u, null));
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        callback(formatAppUser(session.user), session);
      } else {
        const local = await this.getCurrentUser();
        callback(local, null);
      }
    });

    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
};

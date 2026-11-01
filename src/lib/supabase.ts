import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'aerion_supabase_url';
const STORAGE_KEY_KEY = 'aerion_supabase_anon_key';

/**
 * Returns active Supabase credentials prioritizing:
 * 1. Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. User-provided in-app configuration (stored securely in browser localStorage)
 */
export function getActiveSupabaseCredentials(): { url: string; anonKey: string; source: 'env' | 'storage' | 'none' } {
  // Check both un-prefixed SUPABASE_URL and VITE_SUPABASE_URL (plus process.env fallback)
  const envUrl = (
    (typeof import.meta !== 'undefined' && (import.meta.env?.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)) ||
    (typeof process !== 'undefined' && (process.env?.SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) ||
    ''
  ).trim();

  // Check un-prefixed SUPABASE_ANON_KEY/SUPABASE_KEY and VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_KEY
  const envKey = (
    (typeof import.meta !== 'undefined' && (
      import.meta.env?.SUPABASE_ANON_KEY ||
      import.meta.env?.SUPABASE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY ||
      import.meta.env?.VITE_SUPABASE_KEY
    )) ||
    (typeof process !== 'undefined' && (
      process.env?.SUPABASE_ANON_KEY ||
      process.env?.SUPABASE_KEY ||
      process.env?.VITE_SUPABASE_ANON_KEY ||
      process.env?.VITE_SUPABASE_KEY
    )) ||
    ''
  ).trim();

  if (envUrl && envKey && !envUrl.includes('your-project.supabase.co')) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }


  if (typeof window !== 'undefined') {
    const storedUrl = (localStorage.getItem(STORAGE_URL_KEY) || '').trim();
    const storedKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
    if (storedUrl && storedKey) {
      return { url: storedUrl, anonKey: storedKey, source: 'storage' };
    }
  }

  return { url: envUrl, anonKey: envKey, source: envUrl ? 'env' : 'none' };
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

/**
 * Returns the singleton Supabase client or null if not yet configured.
 */
export function getSupabase(): SupabaseClient | null {
  const creds = getActiveSupabaseCredentials();

  if (!creds.url || !creds.anonKey || creds.url.includes('your-project.supabase.co')) {
    return null;
  }

  if (!supabaseInstance || currentUrl !== creds.url || currentKey !== creds.anonKey) {
    currentUrl = creds.url;
    currentKey = creds.anonKey;
    supabaseInstance = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return supabaseInstance;
}

/**
 * Checks whether valid Supabase configuration is present.
 */
export function isSupabaseConfigured(): boolean {
  const creds = getActiveSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey && !creds.url.includes('your-project.supabase.co'));
}

/**
 * Stores custom Supabase credentials in browser localStorage for in-app connection.
 */
export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  supabaseInstance = null; // Re-instantiate on next access
}

/**
 * Clears custom stored Supabase credentials.
 */
export function clearCustomSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  supabaseInstance = null;
}

/**
 * Performs a lightweight health-check test query against the Supabase database.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  count?: number;
  tablesFound?: boolean;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Publishable Anon Key not configured.'
    };
  }

  try {
    const { data, count, error } = await client
      .from('encyclopedia_entries')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, return helpful schema migration advice
      if (error.code === '42P01' || error.message.includes('relation "public.encyclopedia_entries" does not exist')) {
        return {
          success: false,
          tablesFound: false,
          message: 'Connected to Supabase project, but "encyclopedia_entries" table does not exist yet. Please run supabase/schema.sql in the Supabase SQL Editor.'
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message} (${error.code || 'unknown'})`
      };
    }

    return {
      success: true,
      tablesFound: true,
      count: count ?? 0,
      message: `Successfully connected to Supabase database (${count ?? 0} records found).`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection to Supabase failed.'
    };
  }
}

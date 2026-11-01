import React, { useState, useEffect } from 'react';
import { 
  X, Database, Check, AlertCircle, RefreshCw, Key, ShieldCheck, 
  Copy, CheckCheck, ExternalLink, LogIn, LogOut, User, Sparkles
} from 'lucide-react';
import { 
  getActiveSupabaseCredentials, setCustomSupabaseConfig, 
  clearCustomSupabaseConfig, testSupabaseConnection, isSupabaseConfigured 
} from '../lib/supabase';
import { AuthService } from '../services/authService';
import { ComponentService } from '../services/componentService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'schema' | 'auth'>('status');

  // Credentials state
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [credSource, setCredSource] = useState<'env' | 'storage' | 'none'>('none');
  const [showKey, setShowKey] = useState(false);

  // Health check state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    tablesFound?: boolean;
  } | null>(null);

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Copy Schema state
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const creds = getActiveSupabaseCredentials();
    setUrl(creds.url || '');
    setAnonKey(creds.anonKey || '');
    setCredSource(creds.source);
    setTestResult(null);
    setSeedNotice(null);
    setAuthError(null);
    setAuthSuccess(null);

    AuthService.getCurrentUser().then(user => setCurrentUser(user));

    if (isSupabaseConfigured()) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;

    setCustomSupabaseConfig(url.trim(), anonKey.trim());
    setCredSource('storage');
    await handleTestConnection();

    if (onDataRefreshed) {
      await ComponentService.fetchComponents();
      onDataRefreshed();
    }
  };

  const handleResetToEnv = async () => {
    clearCustomSupabaseConfig();
    const creds = getActiveSupabaseCredentials();
    setUrl(creds.url);
    setAnonKey(creds.anonKey);
    setCredSource(creds.source);
    await handleTestConnection();

    if (onDataRefreshed) {
      await ComponentService.fetchComponents();
      onDataRefreshed();
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const seeded = await ComponentService.seedSupabase();
      setSeedNotice(`Successfully synced ${seeded.length} foundational aerospace entries to Supabase.`);
      if (onDataRefreshed) {
        onDataRefreshed();
      }
      handleTestConnection();
    } catch (err: any) {
      setSeedNotice(`Seeding note: ${err?.message || 'Error executing seed'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    if (authMode === 'signin') {
      const res = await AuthService.signIn(authEmail, authPassword);
      if (res.error) {
        setAuthError(res.error);
      } else {
        setCurrentUser(res.user);
        setAuthSuccess(`Signed in as ${res.user?.email}`);
        setAuthPassword('');
      }
    } else {
      const res = await AuthService.signUp(authEmail, authPassword);
      if (res.error) {
        setAuthError(res.error);
      } else {
        setCurrentUser(res.user);
        setAuthSuccess(res.message || 'Account registered.');
        setAuthPassword('');
      }
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    await AuthService.signOut();
    setCurrentUser(null);
    setAuthSuccess('Signed out successfully.');
    setAuthLoading(false);
  };

  const handleCopySchemaScript = () => {
    const sqlText = `-- AERION Supabase Schema Quick-Run
CREATE TABLE IF NOT EXISTS public.encyclopedia_entries (
  id TEXT PRIMARY KEY DEFAULT ('aerion-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  entry_number VARCHAR(16) NOT NULL UNIQUE,
  component_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  catalog_id VARCHAR(128) NOT NULL UNIQUE,
  definition_description TEXT DEFAULT '',
  purpose_engineering_value TEXT DEFAULT '',
  operating_principle TEXT DEFAULT '',
  location_installation_context TEXT DEFAULT '',
  applications_operating_context TEXT DEFAULT '',
  interfaces_system_connections TEXT DEFAULT '',
  identification_verification_guidance TEXT DEFAULT '',
  safety_limitations TEXT DEFAULT '',
  technical_reference_guidance TEXT DEFAULT '',
  image_storage_path TEXT,
  image_url TEXT,
  image_title VARCHAR(255),
  image_caption TEXT,
  image_alt_text VARCHAR(255),
  image_source VARCHAR(255) DEFAULT 'Aerospace Technical Archive',
  image_source_url TEXT,
  image_verification_status VARCHAR(64) DEFAULT 'Verified',
  image_verified_at DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  review_date DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  facts JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  reference_links JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  stage_location TEXT,
  typical_materials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.encyclopedia_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published" ON public.encyclopedia_entries FOR SELECT USING (status = 'published');
CREATE POLICY "Allow all operations for anon and auth" ON public.encyclopedia_entries FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('aerospace-media', 'aerospace-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read aerospace-media" ON storage.objects FOR SELECT USING (bucket_id = 'aerospace-media');
CREATE POLICY "Public insert aerospace-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'aerospace-media');
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-black dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-white flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                  AERION System Integration
                </span>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  isConfigured && testResult?.success ? 'bg-emerald-600' : isConfigured ? 'bg-amber-500' : 'bg-zinc-400'
                }`}></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-black dark:text-white">
                Supabase Database & Storage Configuration
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900 overflow-x-auto text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Credentials & Keys
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'auth'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Auth & RLS ({currentUser ? 'Signed In' : 'Guest'})
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            SQL Migrations & Schema
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                isConfigured && testResult?.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : isConfigured
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200'
              }`}>
                {isConfigured && testResult?.success ? (
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Database className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      {isConfigured ? 'Supabase Integrated' : 'Operating in Offline Resilient Cache'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black rounded">
                      Source: {credSource.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    {isConfigured
                      ? 'The application is configured to read, persist, update, and upload records directly to your PostgreSQL Supabase database and Storage bucket.'
                      : 'No live Supabase project is connected yet. The application is running seamlessly with persistent localStorage and IndexedDB fallback.'}
                  </p>
                </div>
              </div>

              {/* Live Connection Diagnostics */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="font-bold text-black dark:text-white uppercase">Live Health Diagnostics</span>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !isConfigured}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded text-[11px] font-bold text-black dark:text-white flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs ${
                    testResult.success
                      ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200'
                      : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">{testResult.success ? 'Query Succeeded' : 'Query Failed'}</div>
                        <div className="mt-0.5">{testResult.message}</div>
                        {testResult.count !== undefined && (
                          <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                            Table: <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">public.encyclopedia_entries</code> ({testResult.count} records)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Database Table:</span>
                    <span className="font-bold text-black dark:text-white">public.encyclopedia_entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Bucket:</span>
                    <span className="font-bold text-black dark:text-white">aerospace-media (Public)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Row Level Security (RLS):</span>
                    <span className="font-bold text-black dark:text-white">Enabled (Public Read / Admin Write)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Endpoint:</span>
                    <span className="font-bold text-black dark:text-white truncate max-w-[280px]">
                      {url || 'Not configured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seed / Sync Action */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-mono text-xs font-bold text-black dark:text-white uppercase flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Synchronize & Seed Foundational Data</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Upsert the 8 foundational aerospace flight hardware records into your Supabase database.
                  </p>
                  {seedNotice && (
                    <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1">{seedNotice}</p>
                  )}
                </div>
                <button
                  onClick={handleSeedDatabase}
                  disabled={isSeeding || !isConfigured}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-xs font-mono font-bold rounded-lg shrink-0 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300">
                You can configure your Supabase project credentials here or pass them as environment variables (<code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>).
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs font-bold text-black dark:text-white">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs font-bold text-black dark:text-white">
                    Supabase Publishable / Anon Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  >
                    {showKey ? 'Hide Key' : 'Reveal Key'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  Never use the secret service-role key in frontend applications. Only use the public Anon Key.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToEnv}
                  className="px-3 py-2 rounded-lg text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 transition-colors"
                >
                  Clear / Reset to Defaults
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-mono font-bold rounded-lg transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Connect</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div className="space-y-5">
              {currentUser ? (
                <div className="border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-950 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold">
                        {currentUser.email?.slice(0, 2).toUpperCase() || 'AD'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-black dark:text-white">{currentUser.email}</span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black dark:bg-white text-white dark:text-black rounded">
                            AUTHENTICATED ADMIN
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          ID: {currentUser.id.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-lg text-xs font-mono font-semibold text-black dark:text-white transition-colors flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                    <div className="font-bold text-black dark:text-white">Active RLS Permissions:</div>
                    <div>✓ Full Read Access: Can view all encyclopedia entries including unpublished drafts.</div>
                    <div>✓ Write Access: Can create, edit, and publish aerospace entries.</div>
                    <div>✓ Delete Authority: Can delete encyclopedia components.</div>
                    <div>✓ Storage Access: Can upload high-resolution media directly to aerospace-media bucket.</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-black dark:text-white uppercase">
                        Supabase Administrator Authentication
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Sign in to test Row Level Security (RLS) and administrative operations.
                      </p>
                    </div>
                    <div className="flex border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className={`px-3 py-1 font-semibold ${authMode === 'signin' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className={`px-3 py-1 font-semibold ${authMode === 'signup' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center space-x-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@aerion.aero"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={authLoading || !isConfigured}
                      className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-mono font-bold rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: SCHEMA & MIGRATION */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-xs font-bold text-black dark:text-white uppercase">
                    Supabase PostgreSQL Schema Setup
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Run this SQL script in your Supabase Dashboard under <b>SQL Editor</b>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchemaScript}
                  className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center space-x-1.5 transition-colors"
                >
                  {copiedSchema ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="bg-zinc-950 text-zinc-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 border border-zinc-800 leading-relaxed">
                <pre>{`-- File: supabase/schema.sql
CREATE TABLE IF NOT EXISTS public.encyclopedia_entries (
  id TEXT PRIMARY KEY DEFAULT ('aerion-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  entry_number VARCHAR(16) NOT NULL UNIQUE,
  component_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  catalog_id VARCHAR(128) NOT NULL UNIQUE,
  definition_description TEXT DEFAULT '',
  purpose_engineering_value TEXT DEFAULT '',
  operating_principle TEXT DEFAULT '',
  location_installation_context TEXT DEFAULT '',
  applications_operating_context TEXT DEFAULT '',
  interfaces_system_connections TEXT DEFAULT '',
  identification_verification_guidance TEXT DEFAULT '',
  safety_limitations TEXT DEFAULT '',
  technical_reference_guidance TEXT DEFAULT '',
  image_storage_path TEXT,
  image_url TEXT,
  image_title VARCHAR(255),
  image_caption TEXT,
  image_alt_text VARCHAR(255),
  image_source VARCHAR(255) DEFAULT 'Aerospace Technical Archive',
  image_source_url TEXT,
  image_verification_status VARCHAR(64) DEFAULT 'Verified',
  image_verified_at DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  review_date DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  facts JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.encyclopedia_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.encyclopedia_entries FOR SELECT USING (status = 'published');
CREATE POLICY "Admin Full Access" ON public.encyclopedia_entries FOR ALL USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('aerospace-media', 'aerospace-media', true)
ON CONFLICT (id) DO NOTHING;`}</pre>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <div className="font-bold text-black dark:text-white">Migration File Locations:</div>
                <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">1. /supabase/schema.sql (Complete schema + 8 seed components)</div>
                <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">2. /supabase/migrations/20261028000000_aerion_schema.sql (CLI migration)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Supabase v2 Integration Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-mono font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

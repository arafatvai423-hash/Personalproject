import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or local storage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Allow dynamic configuration from UI Settings if environment variable was not baked in
export const getSupabaseConfig = () => {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('pc_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('pc_supabase_key') : null;

  return {
    url: storedUrl || envUrl || '',
    key: storedKey || envKey || '',
    isConfigured: Boolean((storedUrl || envUrl) && (storedKey || envKey)),
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('pc_supabase_url', url.trim());
      localStorage.setItem('pc_supabase_key', key.trim());
    } else {
      localStorage.removeItem('pc_supabase_url');
      localStorage.removeItem('pc_supabase_key');
    }
  }
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
};

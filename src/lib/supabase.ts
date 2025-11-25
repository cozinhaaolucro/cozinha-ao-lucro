
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables missing. Auth features will be disabled.');
}

// Create a mock client if keys are missing to prevent app crash
const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
    signUp: () => Promise.reject(new Error('Supabase not configured')),
    signOut: () => Promise.resolve(),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
  })
} as any;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;

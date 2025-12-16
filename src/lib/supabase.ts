import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables missing. Auth features will be disabled.');
} else if (!supabaseUrl.startsWith('http')) {
  console.warn('Supabase URL must start with http:// or https://');
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
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
    subscribe: () => ({ unsubscribe: () => { } }),
  }),
} as unknown as ReturnType<typeof createClient>;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (Toast-inspired live updates)
// ============================================================================

/**
 * Subscribe to real-time order changes for a specific user.
 * Returns a channel that can be unsubscribed.
 */
export const subscribeToOrders = (
  userId: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel(`orders-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload) => onInsert?.(payload)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload) => onUpdate?.(payload)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload) => onDelete?.(payload)
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to ingredient stock changes (for low-stock alerts).
 */
export const subscribeToIngredients = (
  userId: string,
  onUpdate?: (payload: any) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured) return null;

  return supabase
    .channel(`ingredients-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'ingredients', filter: `user_id=eq.${userId}` },
      (payload) => onUpdate?.(payload)
    )
    .subscribe();
};

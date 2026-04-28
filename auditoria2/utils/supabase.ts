import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const fallbackSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    signOut: async () => ({ error: new Error('Supabase no está configurado') }),
    signUp: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    updateUser: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    setSession: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
  },
  from: () => ({
    select: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    insert: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    update: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    delete: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    eq: function () { return this; },
    in: function () { return this; },
    order: function () { return this; },
    limit: function () { return this; },
    single: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    maybeSingle: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    match: function () { return this; },
    filter: function () { return this; },
    range: function () { return this; },
    returns: function () { return this; },
    upsert: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
  }),
  rpc: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
  storage: {
    from: () => ({
      download: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
      upload: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
      list: async () => ({ data: null, error: new Error('Supabase no está configurado') }),
    }),
  },
} as unknown as SupabaseClient;

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    })
  : fallbackSupabase; 
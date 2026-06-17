// supabase.js — single Supabase client for COMPOUND.
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment
// (.env.local in dev, Vercel env vars in prod). If they're absent the app runs
// in LOCAL-ONLY mode — every store falls back to localStorage and the auth gate
// is skipped — so development keeps working until the keys are wired in.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anon);

export const supabase = supabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.info('[COMPOUND] Supabase not configured — running in local-only mode (localStorage).');
}

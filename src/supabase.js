// supabase.js — single Supabase client for COMPOUND.
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment
// (.env.local in dev, Vercel env vars in prod). If they're absent the app runs
// in LOCAL-ONLY mode — every store falls back to localStorage and the auth gate
// is skipped — so development keeps working until the keys are wired in.
import { createClient } from '@supabase/supabase-js';

// Known-good PUBLIC values (the URL and publishable/anon key are safe to ship).
// We hardcode them as a fallback because the Vercel env-var copy of the anon key
// is corrupted with a stray em-dash, which the browser rejects as an HTTP header
// ("string contains no ISO-8859-1 code point"). Only use an env value if it is
// actually a clean Latin-1 string; otherwise fall back to the literal below.
const FALLBACK_URL = 'https://jzlimmbllpbbovyvssfp.supabase.co';
const FALLBACK_ANON = 'sb_publishable_TJ3WQjGO5pAvz37WjnzRXA_gktZf6LE';
const clean = (s, fb) => (typeof s === 'string' && s && /^[\x00-\xFF]*$/.test(s) ? s : fb);

const url = clean(import.meta.env.VITE_SUPABASE_URL, FALLBACK_URL);
const anon = clean(import.meta.env.VITE_SUPABASE_ANON_KEY, FALLBACK_ANON);

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

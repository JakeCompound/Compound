// cloud-sync.js — keeps localStorage (the app's synchronous source of truth) in
// sync with Supabase. The UI never changes: it keeps reading/writing localStorage.
//
//   • On login we HYDRATE localStorage from the user's cloud rows (or, on first
//     login with empty cloud, IMPORT existing local data up — one-time).
//   • We MIRROR every compound:* write to its mapped table, debounced.
//
// Photos (base64) are NOT synced yet — they stay local until Storage upload lands
// in a later pass. compound:workoutPostpones has no table yet → local-only too.
import { supabase } from './supabase.js';

const ORIG_SET = localStorage.setItem.bind(localStorage);
const J = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const setJSON = (k, v) => ORIG_SET(k, JSON.stringify(v));
const setRaw = (k, v) => ORIG_SET(k, String(v));
const del = (k) => localStorage.removeItem(k);
const iso = (ms) => (ms ? new Date(Number(ms)).toISOString() : null);
const ms = (t) => (t ? new Date(t).getTime() : Date.now());

let uid = null;
let hydrating = false;
let patched = false;

async function replaceRows(table, rows) {
  await supabase.from(table).delete().eq('user_id', uid);
  if (rows && rows.length) { const { error } = await supabase.from(table).insert(rows); if (error) throw error; }
}

// ── Domains: each owns one or more localStorage keys + push/pull ─────────────
const DOMAINS = [
  {
    name: 'profile',
    keys: ['compound:onboarding', 'compound:targets', 'compound:notifs', 'compound:nipLimit', 'compound:plateauDismissed'],
    async push() {
      const onboarding = J('compound:onboarding') || {};
      const targets = J('compound:targets');
      const notif_prefs = J('compound:notifs') || {};
      const nip_limit = parseInt(localStorage.getItem('compound:nipLimit'), 10) || 55;
      const plateau_dismissed = iso(localStorage.getItem('compound:plateauDismissed'));
      await supabase.from('profiles').upsert({
        id: uid, onboarding, targets: targets ?? null, notif_prefs, nip_limit, plateau_dismissed,
        food_tracking_on: !!(onboarding && onboarding.dietTracking), updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    },
    async pull() {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (!data) return;
      setJSON('compound:onboarding', data.onboarding || {});
      if (data.targets != null) setJSON('compound:targets', data.targets); else del('compound:targets');
      setJSON('compound:notifs', data.notif_prefs || {});
      setRaw('compound:nipLimit', data.nip_limit ?? 55);
      if (data.plateau_dismissed) setRaw('compound:plateauDismissed', ms(data.plateau_dismissed)); else del('compound:plateauDismissed');
    },
  },
  {
    name: 'weighins', keys: ['compound:weighins'],
    async push() { const a = J('compound:weighins') || []; await replaceRows('weighins', a.map((w) => ({ user_id: uid, date: w.date, value: w.value }))); },
    async pull() { const { data } = await supabase.from('weighins').select('*').eq('user_id', uid).order('date'); setJSON('compound:weighins', (data || []).map((r) => ({ date: r.date, value: Number(r.value) }))); },
  },
  {
    name: 'checkins', keys: ['compound:checkins'],
    async push() { const a = J('compound:checkins') || []; await replaceRows('checkins', a.map((e) => ({ user_id: uid, date: e.date, data: e }))); },
    async pull() { const { data } = await supabase.from('checkins').select('*').eq('user_id', uid).order('date'); setJSON('compound:checkins', (data || []).map((r) => r.data)); },
  },
  {
    name: 'workouts', keys: ['compound:workouts'],
    async push() { const a = J('compound:workouts') || []; await replaceRows('workouts', a.map((s) => ({ user_id: uid, date: s.date, data: s }))); },
    async pull() { const { data } = await supabase.from('workouts').select('*').eq('user_id', uid).order('date'); setJSON('compound:workouts', (data || []).map((r) => r.data)); },
  },
  {
    name: 'saved_workouts', keys: ['compound:savedWorkouts'],
    async push() { const a = J('compound:savedWorkouts') || []; await replaceRows('saved_workouts', a.map((t) => ({ user_id: uid, name: t.name || 'Workout', data: t }))); },
    async pull() { const { data } = await supabase.from('saved_workouts').select('*').eq('user_id', uid).order('created_at'); setJSON('compound:savedWorkouts', (data || []).map((r) => r.data)); },
  },
  {
    name: 'workout_week', keys: ['compound:workoutWeek'],
    async push() { const o = J('compound:workoutWeek') || {}; await replaceRows('workout_week', Object.entries(o).map(([week_start, d]) => ({ user_id: uid, week_start, data: d }))); },
    async pull() { const { data } = await supabase.from('workout_week').select('*').eq('user_id', uid); const o = {}; (data || []).forEach((r) => { o[r.week_start] = r.data; }); setJSON('compound:workoutWeek', o); },
  },
  {
    name: 'food', keys: ['compound:food'],
    async push() {
      const o = J('compound:food') || {};
      const rows = [];
      Object.entries(o).forEach(([date, meals]) => (meals || []).forEach((m) => rows.push({
        user_id: uid, date, name: m.name || null, photo_url: null,
        kcal: m.kcal ?? null, protein: m.p ?? null, carbs: m.c ?? null, fat: m.f ?? null,
        confidence: m.confidence || null, health: m.health || null, info: m.info || null,
        questions: m.questions || [], ts: iso(m.ts) || new Date().toISOString(),
      })));
      await replaceRows('food_entries', rows);
    },
    async pull() {
      const { data } = await supabase.from('food_entries').select('*').eq('user_id', uid).order('ts');
      const o = {};
      (data || []).forEach((r) => {
        (o[r.date] = o[r.date] || []).push({
          id: 'f-db-' + r.id, name: r.name, photo: null, kcal: r.kcal, p: Number(r.protein || 0), c: Number(r.carbs || 0), f: Number(r.fat || 0),
          confidence: r.confidence, health: r.health, info: r.info, questions: r.questions || [], ts: ms(r.ts),
        });
      });
      setJSON('compound:food', o);
    },
  },
  {
    name: 'nip_days', keys: ['compound:nipsToday', 'compound:alcoholKcal'],
    async push() {
      const nips = J('compound:nipsToday') || {};
      const kcal = J('compound:alcoholKcal') || {};
      const dates = new Set([...Object.keys(nips), ...Object.keys(kcal)]);
      await replaceRows('nip_days', [...dates].map((date) => ({ user_id: uid, date, nips: nips[date] || 0, alcohol_kcal: kcal[date] || 0 })));
    },
    async pull() {
      const { data } = await supabase.from('nip_days').select('*').eq('user_id', uid);
      const nips = {}, kcal = {};
      (data || []).forEach((r) => { nips[r.date] = Number(r.nips); kcal[r.date] = Number(r.alcohol_kcal); });
      setJSON('compound:nipsToday', nips); setJSON('compound:alcoholKcal', kcal);
    },
  },
  {
    name: 'measurements', keys: ['compound:measurements'],
    async push() { const a = J('compound:measurements') || []; await replaceRows('measurements', a.map((e) => ({ user_id: uid, date: e.date, data: e }))); },
    async pull() { const { data } = await supabase.from('measurements').select('*').eq('user_id', uid).order('date'); setJSON('compound:measurements', (data || []).map((r) => r.data)); },
  },
  {
    name: 'step_log', keys: ['compound:stepLog'],
    async push() { const o = J('compound:stepLog') || {}; await replaceRows('step_days', Object.entries(o).map(([date, entries]) => ({ user_id: uid, date, entries }))); },
    async pull() {
      // Throw on error so a missing table (schema not run yet) leaves the
      // local ledger untouched instead of overwriting it with {}.
      const { data, error } = await supabase.from('step_days').select('*').eq('user_id', uid);
      if (error) throw error;
      const o = {}; (data || []).forEach((r) => { o[r.date] = r.entries; }); setJSON('compound:stepLog', o);
    },
  },
  {
    name: 'todo_state', keys: ['compound:todostate'],
    async push() { const o = J('compound:todostate') || {}; await replaceRows('todo_state', Object.entries(o).map(([date, d]) => ({ user_id: uid, date, data: d }))); },
    async pull() { const { data } = await supabase.from('todo_state').select('*').eq('user_id', uid); const o = {}; (data || []).forEach((r) => { o[r.date] = r.data; }); setJSON('compound:todostate', o); },
  },
  {
    name: 'nutrition_messages', keys: ['compound:nutrition'],
    async push() { const a = J('compound:nutrition') || []; await replaceRows('nutrition_messages', a.map((m) => ({ user_id: uid, role: m.role, content: m.content, ts: iso(m.ts) || new Date().toISOString() }))); },
    async pull() { const { data } = await supabase.from('nutrition_messages').select('*').eq('user_id', uid).order('ts'); setJSON('compound:nutrition', (data || []).map((r) => ({ role: r.role, content: r.content, ts: ms(r.ts) }))); },
  },
];

const KEY_TO_DOMAIN = {};
DOMAINS.forEach((d) => d.keys.forEach((k) => { KEY_TO_DOMAIN[k] = d; }));
const SYNCED_KEYS = Object.keys(KEY_TO_DOMAIN);

async function pullAll() { hydrating = true; try { for (const d of DOMAINS) { try { await d.pull(); } catch (e) { console.warn('[sync] pull failed', d.name, e.message); } } } finally { hydrating = false; } }
async function pushAll() { for (const d of DOMAINS) { try { await d.push(); } catch (e) { console.warn('[sync] push failed', d.name, e.message); } } }

function clearSyncedLocal() { SYNCED_KEYS.forEach(del); }

// One-time import vs hydrate, with account-switch safety.
export async function syncOnLogin(userId) {
  uid = userId;
  const prevUser = localStorage.getItem('compound:cloudUser');
  if (prevUser && prevUser !== userId) clearSyncedLocal(); // different account on this device

  let prof = null;
  try { const { data } = await supabase.from('profiles').select('onboarding').eq('id', userId).maybeSingle(); prof = data; } catch (e) {}
  const cloudHasData = prof && prof.onboarding && Object.keys(prof.onboarding).length > 0;

  if (cloudHasData) {
    await pullAll();                       // cloud → local
  } else {
    const localOnb = J('compound:onboarding');
    if (localOnb && Object.keys(localOnb).length > 0) await pushAll(); // first-login import: local → cloud
    // else brand-new account, nothing local → onboarding
  }
  setRaw('compound:cloudUser', userId);
  installMirror();
}

// Mirror compound:* writes → Supabase (debounced per domain).
const timers = {};
function schedule(domain) {
  clearTimeout(timers[domain.name]);
  timers[domain.name] = setTimeout(() => { domain.push().catch((e) => console.warn('[sync] mirror push failed', domain.name, e.message)); }, 800);
}
function installMirror() {
  if (patched) return; patched = true;
  localStorage.setItem = function (key, val) {
    ORIG_SET(key, val);
    if (!uid || hydrating) return;
    const d = KEY_TO_DOMAIN[key];
    if (d) schedule(d);
  };
  // Offline outbox (simple): on reconnect, re-push everything from local → cloud.
  // localStorage stays the source of truth while offline, so a full re-push reconciles.
  window.addEventListener('online', () => { if (uid) pushAll().catch(() => {}); });
}

export function teardownSync() { uid = null; }

// Permanently delete every cloud row for a user (used by Settings → Clear all
// cloud data, after password re-auth). RLS lets a signed-in user delete their own
// rows, so no service role is needed. push_sent is a server-only dedup log
// (client can't and needn't touch it). The caller wipes localStorage + signs out.
export async function clearAllCloudData(userId) {
  if (!userId) throw new Error('No user');
  const userKeyed = [
    'weighins', 'checkins', 'workouts', 'saved_workouts', 'workout_week',
    'food_entries', 'nip_days', 'measurements', 'todo_state', 'nutrition_messages',
    'push_subscriptions',
  ];
  for (const t of userKeyed) {
    const { error } = await supabase.from(t).delete().eq('user_id', userId);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw new Error(`profiles: ${error.message}`);
}

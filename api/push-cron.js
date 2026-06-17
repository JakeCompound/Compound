// api/push-cron.js — Vercel serverless sender for Web Push reminders.
//
// Called once a minute by the scheduler (Supabase pg_cron → pg_net, see
// BUILD_TIER_B/PUSH_CRON.sql). It:
//   1) authenticates via a shared CRON_SECRET header,
//   2) reads every saved device + that user's reminder times/toggles,
//   3) works out who is due *right now* in their own timezone,
//   4) sends the push (web-push, signed with the VAPID private key),
//   5) dedups so each reminder fires at most once per day per device,
//   6) prunes dead subscriptions (410/404).
//
// Manual test:  POST { "test": true }  with the secret header → sends a test
// push to every saved device immediately (used in step 7).
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jzlimmbllpbbovyvssfp.supabase.co';
// Public VAPID key (safe). Private key + service role + cron secret come from env.
const VAPID_PUBLIC = (process.env.VAPID_PUBLIC_KEY || 'BGOLrpKztH3ZxR9yNLKbz8HrZFg5iLGJCgG0qFgxoUsk2DQPh3h-wfTZ0Wp3L1P9m5Wcfd-yBbYPsZXbmCUozj4').trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:reminders@compound.app').trim();

// ── helpers ──────────────────────────────────────────────────────────────────
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function normHHMM(s) {
  if (!s || typeof s !== 'string' || !s.includes(':')) return null;
  const [h, m] = s.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function minus30(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  let t = (h * 60 + m - 30 + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
// Current wall-clock in a given IANA timezone.
function localNow(tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz || 'UTC', hour12: false, weekday: 'short',
    hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const hour = parseInt(p.hour, 10) % 24;
  return {
    hhmm: `${String(hour).padStart(2, '0')}:${String(parseInt(p.minute, 10)).padStart(2, '0')}`,
    dow: DOW[p.weekday],
    date: `${p.year}-${p.month}-${p.day}`,
  };
}

const MSG = {
  nightly: { title: 'COMPOUND', body: 'Nightly check-in — 9 questions, 60 seconds.', tag: 'nightly', url: '/' },
  weighin: { title: 'COMPOUND', body: 'Friday weigh-in. One number, pre-water.', tag: 'weighin', url: '/' },
  workout: { title: 'COMPOUND', body: 'Workout in 30 min. Get ready.', tag: 'workout', url: '/' },
};

// Which reminders are due for this subscriber right now?
function dueKinds(prof, now) {
  const onb = (prof && prof.onboarding) || {};
  const prefs = (prof && prof.notif_prefs) || {};
  const on = (k) => prefs[k] !== false; // default ON
  const out = [];
  const checkIn = normHHMM(onb.checkInTime);
  const weighIn = normHHMM(onb.weighInTime);
  const workout = normHHMM(onb.workoutTime);
  const days = Array.isArray(onb.workoutDays) ? onb.workoutDays : [];

  if (on('nightly') && checkIn && now.hhmm === checkIn) out.push('nightly');
  if (on('weighin') && weighIn && now.dow === 5 && now.hhmm === weighIn) out.push('weighin');
  if (on('workout') && workout && days.includes(now.dow) && now.hhmm === minus30(workout)) out.push('workout');
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }

  // 1) Auth — shared secret only the scheduler knows.
  const got = (req.headers['x-cron-secret'] || '').trim();
  if (!CRON_SECRET || got !== CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  if (!VAPID_PRIVATE) return res.status(500).json({ error: 'VAPID_PRIVATE_KEY not set' });
  if (!SERVICE_ROLE) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: subs, error: subErr } = await supa
    .from('push_subscriptions').select('endpoint,user_id,p256dh,auth,timezone');
  if (subErr) return res.status(500).json({ error: 'read subs failed', detail: subErr.message });
  if (!subs || !subs.length) return res.status(200).json({ checked: 0, sent: 0 });

  const isTest = req.body && req.body.test === true;
  let profMap = {};
  if (!isTest) {
    const { data: profs } = await supa.from('profiles').select('id,onboarding,notif_prefs');
    (profs || []).forEach((p) => { profMap[p.id] = p; });
  }

  const send = async (sub, payload) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      return true;
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        await supa.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); // dead device
      }
      return false;
    }
  };

  let sent = 0;
  const errors = [];

  for (const sub of subs) {
    if (isTest) {
      const ok = await send(sub, { title: 'COMPOUND', body: 'Test notification — push is working. 💪', tag: 'test', url: '/' });
      if (ok) sent++; else errors.push(sub.endpoint.slice(-12));
      continue;
    }
    const now = localNow(sub.timezone);
    const kinds = dueKinds(profMap[sub.user_id], now);
    for (const kind of kinds) {
      // Atomic claim: insert dedup row; if it already existed, skip (already sent today).
      const { data: claimed } = await supa
        .from('push_sent')
        .upsert({ endpoint: sub.endpoint, kind, sent_on: now.date }, { onConflict: 'endpoint,kind,sent_on', ignoreDuplicates: true })
        .select();
      if (!claimed || !claimed.length) continue;
      const ok = await send(sub, MSG[kind]);
      if (ok) sent++;
      else { errors.push(`${kind}:${sub.endpoint.slice(-12)}`); await supa.from('push_sent').delete().match({ endpoint: sub.endpoint, kind, sent_on: now.date }); }
    }
  }

  return res.status(200).json({ checked: subs.length, sent, errors });
}

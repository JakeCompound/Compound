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
function dueKinds(prof, now, ud) {
  const onb = (prof && prof.onboarding) || {};
  const prefs = (prof && prof.notif_prefs) || {};
  const on = (k) => prefs[k] !== false; // default ON
  const out = [];
  const checkIn = normHHMM(onb.checkInTime);
  const weighIn = normHHMM(onb.weighInTime);
  // Per-day workout time override (user.workoutTimes = { dayIndex: 'HH:MM' });
  // falls back to the usual workoutTime.
  const wtOverride = onb.workoutTimes && onb.workoutTimes[now.dow];
  const workout = normHHMM(wtOverride != null ? wtOverride : onb.workoutTime);
  const days = effectiveWorkoutDays(onb, ud, now);

  if (on('nightly') && checkIn && now.hhmm === checkIn) out.push('nightly');
  if (on('weighin') && weighIn && now.dow === 5 && now.hhmm === weighIn) out.push('weighin');
  if (on('workout') && workout && days.includes(now.dow) && now.hhmm === minus30(workout)) out.push('workout');
  return out;
}

// ── Event-based reminders (streaks / missed / comeback / urgency / report) ──
// Computed from the user's stored check-ins + workouts. Each fires at one local
// time per day when its condition holds; push_sent dedups.
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];
const EVENT_TIME = { streaks: '21:30', missed: '20:00', comeback: '18:00', urgency: '12:30', report: '09:00' };
const EVENT_MSG = {
  streaks: (n) => ({ title: 'COMPOUND', body: `${n}-day check-in streak. Don't break the chain. 🔥`, tag: 'streak', url: '/' }),
  missed: { title: 'COMPOUND', body: "Missed today's workout? Move it to another day — a short one still counts.", tag: 'missed', url: '/' },
  urgency: { title: 'COMPOUND', body: "Midday nudge: the week's tight on workouts. A quick session keeps it on track.", tag: 'urgency', url: '/' },
  report: { title: 'COMPOUND', body: 'Your monthly report is ready — see how last month stacked up.', tag: 'report', url: '/' },
};
// Rewarming copy by how long they've been gone — flat tone, no cheerleading.
function comebackMsg(gap) {
  let body;
  if (gap <= 3) body = 'Three days quiet. Nothing to catch up on — tonight\'s check-in just starts the count again.';
  else if (gap <= 7) body = 'A week out. The plan hasn\'t moved. Check in tonight and you\'re current — no backlog.';
  else {
    const rotate = [
      'Still here when you\'re ready. One check-in is the whole restart.',
      'No streak to rebuild, nothing to make up. Just log today.',
      'The month is still recoverable. 90 seconds tonight.',
    ];
    body = rotate[Math.floor(gap / 3) % rotate.length];
  }
  return { title: 'COMPOUND', body, tag: 'comeback', url: '/' };
}

// Meal-slot reminders: fire when that slot is still empty at its local time.
// Slot is inferred from WHEN an entry was logged (same rule as the app's
// Breakfast/Lunch/Dinner sections): before 11am = breakfast, before 4pm =
// lunch, after = dinner. No reminders for members gone cold 3+ days — the
// rewarming sequence owns them; three meal nags a day would bury it.
const MEAL_TIME = { breakfast: '10:00', lunch: '15:00', dinner: '20:00' };
// Meal payloads carry action buttons (Android shows them; iOS shows a plain
// notification whose tap opens the app): "Log it" deep-links into the food
// sheet ready to type, "Skipped it" records the skip without opening the app.
const MEAL_ACTIONS = [
  { action: 'log', title: 'Log it' },
  { action: 'skip', title: 'Skipped it' },
];
const MEAL_MSG = {
  breakfast: { title: 'COMPOUND', body: "Breakfast isn't logged. Type it or snap it — 20 seconds.", tag: 'meal', url: '/', slot: 'breakfast', actions: MEAL_ACTIONS },
  lunch: { title: 'COMPOUND', body: 'No lunch on the log yet. Get it in while you still remember it.', tag: 'meal', url: '/', slot: 'lunch', actions: MEAL_ACTIONS },
  dinner: { title: 'COMPOUND', body: "Dinner's not logged. Close out the day's food.", tag: 'meal', url: '/', slot: 'dinner', actions: MEAL_ACTIONS },
};
function slotForHour(h) { return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner'; }
// Local hour + date of a timestamp in the subscriber's timezone.
function localHourDate(ts, tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz || 'UTC', hour12: false, hour: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return { hour: parseInt(p.hour, 10) % 24, date: `${p.year}-${p.month}-${p.day}` };
}

const isoFromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);
const dnum = (s) => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, (m || 1) - 1, d || 1); };
const daysBetween = (a, b) => Math.round((dnum(b) - dnum(a)) / 86400000);
function streakEndingOn(dateSet, endStr) {
  let n = 0; let cur = dnum(endStr);
  while (dateSet.has(isoFromUTC(cur))) { n += 1; cur -= 86400000; }
  return n;
}

// Effective scheduled workout days for `now`'s week: the base onboarding
// schedule, overridden by any in-week postpone/cancel made in the app
// (compound:workoutWeek → workout_week table, keyed by week start). Without
// this, postponing or cancelling a day in the app wouldn't stop that day's
// "missed workout" / "midday urgency" push — the whole point of offering
// postpone/cancel is that the app stops nagging about a day you've handled.
function effectiveWorkoutDays(onb, ud, now) {
  const base = Array.isArray(onb.workoutDays) ? onb.workoutDays : [];
  const weekStart = isoFromUTC(dnum(now.date) - now.dow * 86400000);
  const override = ud && ud.weekOverride && ud.weekOverride[weekStart];
  return Array.isArray(override) ? override : base;
}

// Returns [{kind, msg}] of event reminders due now. ignoreTime skips the
// time-of-day gate (used by the dry-run debug path).
function eventKinds(prof, now, ud, ignoreTime, tz) {
  const prefs = (prof && prof.notif_prefs) || {};
  const onb = (prof && prof.onboarding) || {};
  const on = (k) => prefs[k] !== false;
  const at = (k) => ignoreTime || now.hhmm === EVENT_TIME[k];
  const ci = (ud && ud.checkins) || new Set();
  const wo = (ud && ud.workouts) || new Set();
  const out = [];

  if (on('streaks') && at('streaks')) {
    const s = streakEndingOn(ci, now.date);
    if (STREAK_MILESTONES.includes(s)) out.push({ kind: `streak-${s}`, msg: EVENT_MSG.streaks(s) });
  }
  if (on('missed') && at('missed')) {
    const days = effectiveWorkoutDays(onb, ud, now);
    if (days.includes(now.dow) && !wo.has(now.date)) out.push({ kind: 'missed', msg: EVENT_MSG.missed });
  }
  // Rewarming ladder: day 3, day 7, then every 3 days; weekly after a month
  // so a member who's clearly stepped away isn't nagged forever.
  const lastCi = ci.size ? [...ci].sort().pop() : null;
  const gap = lastCi ? daysBetween(lastCi, now.date) : 0;
  if (on('comeback') && at('comeback') && lastCi) {
    const due = gap === 3 || gap === 7
      || (gap > 7 && gap <= 30 && (gap - 7) % 3 === 0)
      || (gap > 30 && gap % 7 === 0);
    if (due) out.push({ kind: 'comeback', msg: comebackMsg(gap) });
  }

  // Meal-slot reminders — only for active members with food tracking on.
  if (on('meals') && onb.dietTracking) {
    const foodLocal = ((ud && ud.foodTs) || []).map((t) => localHourDate(t, tz));
    const recentFood = foodLocal.some((f) => daysBetween(f.date, now.date) <= 2);
    const cold = (lastCi ? gap >= 3 : true) && !recentFood;
    if (!cold) {
      const todaysHours = foodLocal.filter((f) => f.date === now.date).map((f) => f.hour);
      for (const slot of ['breakfast', 'lunch', 'dinner']) {
        if (!(ignoreTime || now.hhmm === MEAL_TIME[slot])) continue;
        if (!todaysHours.some((h) => slotForHour(h) === slot)) out.push({ kind: `meal-${slot}`, msg: MEAL_MSG[slot] });
      }
    }
  }
  if (on('urgency') && at('urgency')) {
    const days = effectiveWorkoutDays(onb, ud, now);
    const target = days.length ? days.length : (onb.trainingDays || 3);
    const weekStart = isoFromUTC(dnum(now.date) - now.dow * 86400000);
    let done = 0; wo.forEach((d) => { if (d >= weekStart && d <= now.date) done += 1; });
    const daysLeft = 7 - now.dow; // includes today
    const remaining = Math.max(0, target - done);
    if (remaining > 0 && remaining >= daysLeft) out.push({ kind: 'urgency', msg: EVENT_MSG.urgency });
  }
  if (on('report') && at('report') && parseInt(now.date.slice(8, 10), 10) === 1) {
    out.push({ kind: 'report', msg: EVENT_MSG.report });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }

  // 1) Auth — shared secret only the scheduler knows.
  const got = (req.headers['x-cron-secret'] || '').trim();
  if (!CRON_SECRET || got !== CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  // Synthetic event dry-run — pure logic, needs no subscriptions/DB. Debug only.
  if (req.body && req.body.eventsDryRun === true && req.body.sample) {
    const s = req.body.sample;
    const prof = { onboarding: s.onboarding || {}, notif_prefs: s.notif_prefs || {} };
    const ud = { checkins: new Set(s.checkins || []), workouts: new Set(s.workouts || []), foodTs: s.foodTs || [] };
    const now = s.now || localNow(s.timezone);
    return res.status(200).json({ dryRun: true, sample: true, now, events: eventKinds(prof, now, ud, true, s.timezone).map((e) => e.kind) });
  }

  if (!VAPID_PRIVATE) return res.status(500).json({ error: 'VAPID_PRIVATE_KEY not set' });
  if (!SERVICE_ROLE) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: subs, error: subErr } = await supa
    .from('push_subscriptions').select('endpoint,user_id,p256dh,auth,timezone');
  if (subErr) return res.status(500).json({ error: 'read subs failed', detail: subErr.message });
  if (!subs || !subs.length) return res.status(200).json({ checked: 0, sent: 0 });

  const isTest = req.body && req.body.test === true;
  const isDry = req.body && req.body.eventsDryRun === true; // debug: compute events, don't send
  let profMap = {};
  const udByUser = {};
  if (!isTest) {
    const { data: profs } = await supa.from('profiles').select('id,onboarding,notif_prefs');
    (profs || []).forEach((p) => { profMap[p.id] = p; });
    // Event reminders need the user's check-in + workout dates, plus any
    // in-week postpone/cancel override so a handled day doesn't get nagged.
    const ensure = (u) => (udByUser[u] = udByUser[u] || { checkins: new Set(), workouts: new Set(), weekOverride: {}, foodTs: [] });
    const { data: cRows } = await supa.from('checkins').select('user_id,date');
    const { data: wRows } = await supa.from('workouts').select('user_id,date');
    const { data: wwRows } = await supa.from('workout_week').select('user_id,week_start,data');
    (cRows || []).forEach((r) => ensure(r.user_id).checkins.add(r.date));
    (wRows || []).forEach((r) => ensure(r.user_id).workouts.add(r.date));
    (wwRows || []).forEach((r) => { ensure(r.user_id).weekOverride[r.week_start] = r.data; });
    // Recent food entries feed the meal-slot reminders (a 4-day window covers
    // "today" in any timezone plus the 3-day activity gate).
    const { data: fRows } = await supa.from('food_entries').select('user_id,ts').gte('ts', new Date(Date.now() - 4 * 86400000).toISOString());
    (fRows || []).forEach((r) => ensure(r.user_id).foodTs.push(r.ts));
  }

  if (isDry) {
    // Synthetic-sample path: verify the event logic in isolation, no real data.
    if (req.body.sample) {
      const s = req.body.sample;
      const prof = { onboarding: s.onboarding || {}, notif_prefs: s.notif_prefs || {} };
      const ud = { checkins: new Set(s.checkins || []), workouts: new Set(s.workouts || []), foodTs: s.foodTs || [] };
      const now = s.now || localNow(s.timezone);
      return res.status(200).json({ dryRun: true, sample: true, now, events: eventKinds(prof, now, ud, true, s.timezone).map((e) => e.kind) });
    }
    const rows = subs.map((sub) => ({
      endpoint: sub.endpoint.slice(-12),
      now: localNow(sub.timezone),
      events: eventKinds(profMap[sub.user_id], localNow(sub.timezone), udByUser[sub.user_id], true, sub.timezone).map((e) => e.kind),
    }));
    return res.status(200).json({ dryRun: true, subs: rows });
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
    const kinds = dueKinds(profMap[sub.user_id], now, udByUser[sub.user_id]);
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

    // Event-based reminders (same atomic-claim + dedup pattern).
    const events = eventKinds(profMap[sub.user_id], now, udByUser[sub.user_id], false, sub.timezone);
    for (const ev of events) {
      const { data: claimed } = await supa
        .from('push_sent')
        .upsert({ endpoint: sub.endpoint, kind: ev.kind, sent_on: now.date }, { onConflict: 'endpoint,kind,sent_on', ignoreDuplicates: true })
        .select();
      if (!claimed || !claimed.length) continue;
      const ok = await send(sub, ev.msg);
      if (ok) sent++;
      else { errors.push(`${ev.kind}:${sub.endpoint.slice(-12)}`); await supa.from('push_sent').delete().match({ endpoint: sub.endpoint, kind: ev.kind, sent_on: now.date }); }
    }
  }

  return res.status(200).json({ checked: subs.length, sent, errors });
}

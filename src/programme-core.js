// programme-core.js — pure logic for preset programmes (the 3-Week Reset).
// No window / localStorage here: this file is shared by the app (src/programme.js)
// and the push sender (api/push-cron.js) so both agree on the schedule, what
// counts as a missed day, and what each reminder says.
//
// Dates are 'YYYY-MM-DD' strings in the user's local calendar; weekday maths
// runs in UTC on those strings so it never drifts with the device timezone.

export const DAY_MS = 86400000;
const dnum = (s) => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, (m || 1) - 1, d || 1); };
const fromNum = (n) => new Date(n).toISOString().slice(0, 10);
export const addDays = (s, n) => fromNum(dnum(s) + n * DAY_MS);
export const daysBetween = (a, b) => Math.round((dnum(b) - dnum(a)) / DAY_MS);
export const dowOf = (s) => new Date(dnum(s)).getUTCDay(); // 0 = Sun

// ── The preset ─────────────────────────────────────────────────────────────
// Each lift: exercise id (workout-data.jsx), optional alternates offered first
// when swapping, sets, rep range. `unit` is shown instead of "reps" where a set
// isn't counted in reps (farmer's carry = one 40 m carry per set).
export const RESET_DAYS = {
  A: {
    name: 'Push',
    lifts: [
      { exId: 'bench', alts: ['dbbench'], sets: 4, lo: 6, hi: 8 },
      { exId: 'ohp', sets: 3, lo: 8, hi: 10 },
      { exId: 'inclbench', sets: 3, lo: 10, hi: 10 },
      { exId: 'lateral', sets: 3, lo: 12, hi: 12 },
      { exId: 'tripress', sets: 3, lo: 12, hi: 12 },
    ],
  },
  B: {
    name: 'Pull',
    lifts: [
      { exId: 'deadlift', alts: ['rdl'], sets: 4, lo: 6, hi: 6 },
      { exId: 'pulldown', alts: ['chinup'], sets: 4, lo: 8, hi: 10 },
      { exId: 'row', sets: 3, lo: 10, hi: 10 },
      { exId: 'dbcurl', sets: 3, lo: 10, hi: 10 },
      { exId: 'hangraise', alts: ['cablecrunch'], sets: 3, lo: 15, hi: 15 },
    ],
  },
  C: {
    name: 'Legs + Full Body',
    lifts: [
      { exId: 'squat', alts: ['goblet'], sets: 4, lo: 8, hi: 8 },
      { exId: 'dblunge', sets: 3, lo: 10, hi: 10, note: 'each leg' },
      { exId: 'dbbench', sets: 3, lo: 10, hi: 10 },
      { exId: 'dbbentrow', sets: 3, lo: 10, hi: 10 },
      { exId: 'farmer', sets: 3, lo: 1, hi: 1, note: '40 m per carry' },
    ],
  },
};

export const SAVERS = [
  { k: 'S', t: 'Silence', d: 'Pray beside the bed' },
  { k: 'A', t: 'Affirmations', d: 'Verse + declaration out loud' },
  { k: 'V', t: 'Visualization', d: 'Picture today going right' },
  { k: 'E', t: 'Exercise', d: 'Jog (Wed/Fri) or 20 push-ups' },
  { k: 'R', t: 'Reading', d: 'Bible + a few pages' },
  { k: 'S', t: 'Scribing', d: 'Journal one line' },
];

export const DANGER_TIMES = ['After tea', 'Kids in bed', 'Mates over', 'None'];
export const OVER_REASONS = ['Tired', 'Stress', 'Social', 'Boredom', 'No plan'];
export const STEP_TARGET = 8000;
export const JOG_STEPS_MIN = 5000;
export const JOG_KM = 7;
export const GYM_TIME = '17:05';
export const JOG_TIME = '05:50';

export function makeResetProgramme(startDate, lengthDays = 21) {
  return {
    id: 'reset-' + startDate,
    preset: 'reset-3wk',
    name: '3-Week Reset',
    startDate,
    lengthDays, // null = no end date
    status: 'active',
    notifs: {}, // { [notifId]: { on, time } } — overrides on top of RESET_NOTIFS
    createdAt: Date.now(),
  };
}

// ── Calendar ───────────────────────────────────────────────────────────────
export const endDateOf = (p) => (p && p.lengthDays ? addDays(p.startDate, p.lengthDays - 1) : null);
export const dayNumber = (p, date) => daysBetween(p.startDate, date) + 1;
export function inProgramme(p, date) {
  if (!p || date < p.startDate) return false;
  const end = endDateOf(p);
  return !end || date <= end;
}
// First Monday on/after the start — before it is the "week 1 exception".
export function firstMonday(p) {
  const d = dowOf(p.startDate);
  return addDays(p.startDate, d === 1 ? 0 : (8 - d) % 7);
}
export function weekNumber(p, date) {
  const fm = firstMonday(p);
  if (date < fm) return 1;
  return Math.floor(daysBetween(fm, date) / 7) + (p.startDate < fm ? 2 : 1);
}

// What's on for `date`? → { lift: 'A'|'B'|'C'|null, liftDue, jog }
// liftDue = a miss if not done. Week 1 runs A, B, C on consecutive days from
// the start; C may slide to any later day before the first Monday and is only
// "due" (a miss) on the last of those days. No jogs in week 1.
export function planFor(p, date, liftDates) {
  const out = { lift: null, liftDue: false, jog: false };
  if (!inProgramme(p, date)) return out;
  const fm = firstMonday(p);
  if (date < fm) {
    const k = daysBetween(p.startDate, date);
    const windowDays = daysBetween(p.startDate, fm);
    if (k === 0) return { ...out, lift: 'A', liftDue: true };
    if (k === 1) return { ...out, lift: 'B', liftDue: true };
    if (windowDays < 3) return out;
    // C: shown from day 3 until done; due on the window's last day.
    for (let j = 2; j < k; j++) if (liftDates && liftDates.has(addDays(p.startDate, j))) return out;
    return { ...out, lift: 'C', liftDue: k === windowDays - 1 };
  }
  const d = dowOf(date);
  // Monday and Sunday are rest days.
  if (d === 2) return { ...out, lift: 'A', liftDue: true };
  if (d === 4) return { ...out, lift: 'B', liftDue: true };
  if (d === 6) return { ...out, lift: 'C', liftDue: true };
  if (d === 3 || d === 5) return { ...out, jog: true };
  return out;
}

// ── Day status ────────────────────────────────────────────────────────────
// ctx: { days: {[date]: dayData}, liftDates: Set, runDates: Set,
//        stepsOn(date) → n, checkinDates: Set, nipsOn(date) → n }
export const saversCount = (day) => ((day && day.savers) || []).filter(Boolean).length;
export function drinksActual(day, ctx, date) {
  const n = day && day.night && day.night.drinks;
  if (typeof n === 'number') return n;
  return ctx && ctx.nipsOn ? ctx.nipsOn(date) : null;
}
export function jogDone(ctx, date) {
  return !!(ctx.runDates && ctx.runDates.has(date)) || (ctx.stepsOn ? ctx.stepsOn(date) : 0) >= JOG_STEPS_MIN;
}
export function sessionDone(p, ctx, date) {
  const plan = planFor(p, date, ctx.liftDates);
  if (plan.lift) return ctx.liftDates.has(date);
  if (plan.jog) return jogDone(ctx, date);
  return null; // nothing scheduled
}
// Why a day counts as missed ("any slip"): returns a list of reasons, empty = fine.
export function missReasons(p, ctx, date) {
  if (!inProgramme(p, date)) return [];
  const day = (ctx.days || {})[date] || {};
  const r = [];
  if (saversCount(day) < 6) r.push('savers');
  const plan = planFor(p, date, ctx.liftDates);
  if (plan.lift && plan.liftDue && !ctx.liftDates.has(date)) r.push('lift');
  if (plan.jog && !jogDone(ctx, date)) r.push('jog');
  const num = day.number;
  const act = drinksActual(day, ctx, date);
  if (typeof num === 'number' && typeof act === 'number' && act > num) r.push('drinks');
  if (!(ctx.checkinDates && ctx.checkinDates.has(date))) r.push('checkin');
  return r;
}
export const missedYesterday = (p, ctx, today) => {
  const y = addDays(today, -1);
  return inProgramme(p, y) && missReasons(p, ctx, y).length > 0;
};

// Streaks. `today` never breaks a streak while it's still in progress.
function streak(p, ctx, today, test) {
  let best = 0, run = 0, current = 0;
  const last = endDateOf(p) && endDateOf(p) < today ? endDateOf(p) : today;
  for (let d = p.startDate; d <= last; d = addDays(d, 1)) {
    const v = test(d); // true = extends, false = breaks, null = not applicable
    if (v === null) continue;
    if (v) { run += 1; best = Math.max(best, run); } else if (d !== today) run = 0;
  }
  current = run;
  return { current, best };
}
export function programmeStreaks(p, ctx, today) {
  return {
    savers: streak(p, ctx, today, (d) => {
      const ok = saversCount((ctx.days || {})[d]) >= 6;
      return d === today && !ok ? null : ok;
    }),
    drinks: streak(p, ctx, today, (d) => {
      const day = (ctx.days || {})[d] || {};
      if (typeof day.number !== 'number') return d === today ? null : false;
      const done = ctx.checkinDates && ctx.checkinDates.has(d);
      if (d === today && !done) return null;
      const act = drinksActual(day, ctx, d);
      return typeof act === 'number' ? act <= day.number : null;
    }),
    sessions: streak(p, ctx, today, (d) => {
      const plan = planFor(p, d, ctx.liftDates);
      if (!plan.lift && !plan.jog) return null;
      const done = sessionDone(p, ctx, d);
      if (plan.lift && !plan.liftDue && !done) return null; // optional C day
      if (d === today && !done) return null;
      return !!done;
    }),
  };
}

// ── End-of-programme summary ──────────────────────────────────────────────
export function programmeSummary(p, ctx, weighins, today) {
  const end = endDateOf(p) && endDateOf(p) < today ? endDateOf(p) : today;
  const ws = (weighins || []).filter((w) => w.date >= p.startDate && w.date <= end).sort((a, b) => (a.date < b.date ? -1 : 1));
  // Day-1 weight: the weigh-in on/just before the start if there's none in range yet.
  // Day-1 weight: a weigh-in on the start day; else one from the 3 days before
  // it; else the first one logged during the programme.
  const before = (weighins || []).filter((w) => w.date < p.startDate && daysBetween(w.date, p.startDate) <= 3).sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
  const first = (ws[0] && ws[0].date === p.startDate ? ws[0] : null) || before || ws[0] || null;
  const last = ws.length ? ws[ws.length - 1] : null;
  let liftsDone = 0, liftsSched = 0, jogsDone = 0, jogsSched = 0, mm = 0, nightsUnder = 0, nightsNumbered = 0;
  const weeks = {};
  const overReasons = {};
  const feel = { afterUnder: [], afterOver: [], mondays: [], all: [] };
  const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  for (let d = p.startDate; d <= end; d = addDays(d, 1)) {
    const plan = planFor(p, d, ctx.liftDates);
    if (plan.lift) {
      const done = ctx.liftDates.has(d);
      if (plan.liftDue || done) { liftsSched += 1; if (done) liftsDone += 1; }
    }
    if (plan.jog) { jogsSched += 1; if (jogDone(ctx, d)) jogsDone += 1; }
    const day = (ctx.days || {})[d] || {};
    if (saversCount(day) >= 6) mm += 1;
    const act = drinksActual(day, ctx, d);
    if (typeof day.number === 'number' && typeof act === 'number') {
      nightsNumbered += 1;
      if (act <= day.number) nightsUnder += 1;
      else if (day.night && day.night.overReason) overReasons[day.night.overReason] = (overReasons[day.night.overReason] || 0) + 1;
    }
    // Morning feel (1–5), split by how the night before went.
    if (typeof day.feel === 'number') {
      const prevDate = addDays(d, -1);
      const prev = (ctx.days || {})[prevDate] || {};
      const pAct = drinksActual(prev, ctx, prevDate);
      const bucket = typeof prev.number === 'number' && typeof pAct === 'number' ? (pAct <= prev.number ? feel.afterUnder : feel.afterOver) : null;
      if (bucket) bucket.push(day.feel);
      if (dowOf(d) === 1) feel.mondays.push(day.feel);
      feel.all.push(day.feel);
    }
    const wk = weekNumber(p, d);
    const w = (weeks[wk] = weeks[wk] || { week: wk, total: 0, nights: 0 });
    if (typeof act === 'number') { w.total += act; w.nights += 1; }
  }
  const s = programmeStreaks(p, ctx, end);
  return {
    weight: { first: first ? first.value : null, firstDate: first ? first.date : null, last: last ? last.value : null, lastDate: last ? last.date : null },
    lifts: { done: liftsDone, scheduled: liftsSched },
    jogs: { done: jogsDone, scheduled: jogsSched },
    miracleMorning: mm,
    days: daysBetween(p.startDate, end) + 1,
    drinks: {
      nightsUnder, nightsNumbered,
      byWeek: Object.values(weeks).sort((a, b) => a.week - b.week).map((w) => ({ week: w.week, avg: w.nights ? Math.round((w.total / w.nights) * 10) / 10 : null })),
    },
    overReasons,
    feel: { afterUnder: avg(feel.afterUnder), afterOver: avg(feel.afterOver), mondays: avg(feel.mondays), all: avg(feel.all) },
    longest: { savers: s.savers.best, drinks: s.drinks.best, sessions: s.sessions.best },
  };
}

// ── Progressive overload ──────────────────────────────────────────────────
// Week 1: start where the lift was last logged (or blank) and aim for the low
// end of the range at ~2 reps in reserve. After that, per lift per session:
// every working set at the top of the range → +2.5 kg back to the low end;
// otherwise same weight, one more rep (capped at the top).
export function suggestFor(lift, lastSets) {
  if (!lastSets || !lastSets.length) return { weight: null, reps: lift.lo };
  const top = lastSets.reduce((m, s) => (s.w > m.w ? s : m), lastSets[0]);
  const minReps = Math.min(...lastSets.map((s) => s.r || 0));
  if (lift.hi > lift.lo ? minReps >= lift.hi : minReps >= lift.lo) {
    return { weight: Math.round((top.w + 2.5) / 2.5) * 2.5, reps: lift.lo };
  }
  return { weight: top.w, reps: Math.min(lift.hi, Math.max(lift.lo, minReps + 1)) };
}

// ── Reminders ─────────────────────────────────────────────────────────────
// days: weekdays it can fire (0 = Sun). when(p, date, ctx) narrows by schedule.
// Tonight's committed number, phrased for a push. `when` = 'tonight' | 'today'.
function committed(ctx, date, when = 'tonight') {
  const day = ((ctx && ctx.days) || {})[date] || {};
  return typeof day.number === 'number' ? `You committed to ${day.number} ${when}.` : `${when === 'today' ? "Today's" : "Tonight's"} number isn't set - set it now.`;
}
const SAVERS_BODY = "Miracle Morning - SAVERS. Set tonight's number.";
const WEEKDAYS = [1, 2, 3, 4, 5];
export const RESET_NOTIFS = [
  { id: 'savers', label: 'Miracle Morning', hint: 'Weekdays · non-jog days', time: '06:30', days: WEEKDAYS,
    when: (p, date) => !planFor(p, date).jog, body: () => SAVERS_BODY },
  { id: 'saversJog', label: 'Miracle Morning (jog days)', hint: 'Wed · Fri', time: '05:50', days: WEEKDAYS,
    when: (p, date) => planFor(p, date).jog, body: () => SAVERS_BODY },
  { id: 'saversSat', label: 'Miracle Morning (Saturday)', hint: 'Sat', time: '07:00', days: [6],
    body: () => "Saturday. SAVERS first, then the day's yours. Set tonight's number before the first invite." },
  { id: 'saversSun', label: "Miracle Morning (Lord's Day)", hint: 'Sun · 10 minutes before you leave', time: '05:15', days: [0],
    body: () => "Ten minutes before the Lord's Supper. SAVERS, then set today's number - one you'll be glad of at 6am tomorrow." },
  { id: 'gym', label: 'Gym reminder', hint: 'Weekday lift days', time: '17:00', days: WEEKDAYS,
    when: (p, date, ctx) => { const pl = planFor(p, date, ctx && ctx.liftDates); return !!pl.lift && !(ctx && ctx.liftDates && ctx.liftDates.has(date)); },
    body: (p, date, ctx) => `Gym at 5:05 - Day ${planFor(p, date, ctx && ctx.liftDates).lift}. Two lifts still counts.` },
  { id: 'gymWeekend', label: 'Gym reminder (weekend)', hint: 'Sat · Day C', time: '08:00', days: [6, 0],
    when: (p, date, ctx) => { const pl = planFor(p, date, ctx && ctx.liftDates); return !!pl.lift && !(ctx && ctx.liftDates && ctx.liftDates.has(date)); },
    body: (p, date, ctx) => `Day ${planFor(p, date, ctx && ctx.liftDates).lift} today. Two lifts still counts.` },
  { id: 'satNoon', label: 'Saturday number', hint: 'Sat', time: '12:00', days: [6],
    body: (p, date, ctx) => `${committed(ctx, date)} No clock on it - just the number. Water first.` },
  { id: 'sunArvo', label: "Lord's Day afternoon", hint: 'Sun', time: '12:30', days: [0],
    body: (p, date, ctx) => `Sunday arvo is where Monday gets lost. ${committed(ctx, date, 'today')} Family walk?` },
  { id: 'sunCheck', label: "Lord's Day count", hint: 'Sun', time: '16:30', days: [0],
    body: (p, date, ctx) => `${committed(ctx, date, 'today')} Where are you at? It's all control.` },
  { id: 'home', label: 'Heading home', hint: 'Mon – Fri', time: '17:40', days: WEEKDAYS,
    body: (p, date, ctx) => {
      const day = ((ctx && ctx.days) || {})[date] || {};
      const danger = typeof day.number === 'number' && day.danger && day.danger !== 'None' ? ` Watch out: ${day.danger.toLowerCase()}.` : '';
      return `Heading home. Kids first. No drinks till after tea. ${committed(ctx, date)}${danger}`;
    } },
  { id: 'brooke', label: 'Time with Brooke', hint: 'Mon – Fri', time: '20:10', days: WEEKDAYS,
    body: () => 'Time with Brooke. No PUBG or YouTube.' },
  { id: 'sunHold', label: "Lord's Day evening", hint: 'Sun', time: '20:30', days: [0],
    body: (p, date, ctx) => `${committed(ctx, date, 'today')} Hold the number. Monday is a must.` },
  { id: 'jogPrep', label: 'Jog prep', hint: 'Night before a jog', time: '21:00', days: [0, 1, 2, 3, 4, 5, 6],
    when: (p, date) => planFor(p, addDays(date, 1)).jog,
    body: () => 'Jog tomorrow at 5:50. Gear out, shoes by the door.' },
  { id: 'screens', label: 'Screens off + check-in', hint: 'Mon – Sat', time: '21:45', days: [1, 2, 3, 4, 5, 6],
    body: () => 'Screens off. Do the nightly check-in, then read and pray.' },
  { id: 'checkinSun', label: "Lord's Day check-in", hint: 'Sun', time: '21:45', days: [0],
    body: () => 'Do the nightly check-in. Log the real number.' },
];
export const NEVER_MISS = 'Never miss twice - today is a must.';

export function notifSetting(p, n) {
  const o = ((p && p.notifs) || {})[n.id] || {};
  return { on: o.on != null ? !!o.on : n.defaultOn !== false, time: o.time || n.time };
}

// Today's programme reminders in time order: [{ id, time, body }]. The first
// one of the day carries "Never miss twice" when yesterday was missed.
export function remindersFor(p, date, ctx) {
  if (!p || p.status !== 'active' || !inProgramme(p, date)) return [];
  const d = dowOf(date);
  const list = RESET_NOTIFS
    .filter((n) => n.days.includes(d))
    .map((n) => ({ n, s: notifSetting(p, n) }))
    .filter(({ n, s }) => s.on && s.time && (!n.when || n.when(p, date, ctx)))
    .map(({ n, s }) => ({ id: n.id, time: s.time, body: n.body(p, date, ctx) }))
    .sort((a, b) => (a.time < b.time ? -1 : 1));
  if (list.length && ctx && missedYesterday(p, ctx, date)) list[0] = { ...list[0], body: `${list[0].body} ${NEVER_MISS}` };
  return list;
}

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
export const STEP_TARGET = 7000;
export const BIG_STEP_MIN = 10000; // a "big step day" - covers a jog for the week
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

// Lifts are flexible: aim for 3 a week on ANY days (back-to-back is fine, more
// than 3 is fine). The next one is always the next in the A → B → C rotation.
// Weeks run Mon–Sun; week 1 is the start day through the first Sunday.
export const LIFTS_PER_WEEK = 3;
export function weekBounds(p, date) {
  let start = addDays(date, -((dowOf(date) + 6) % 7)); // Monday
  let end = addDays(start, 6);
  if (start < p.startDate) start = p.startDate;
  const pe = endDateOf(p);
  if (pe && end > pe) end = pe;
  return { start, end };
}
export function liftWeek(p, date, liftDates) {
  const { end } = weekBounds(p, date);
  const floor = p.liftsFrom || p.startDate; // lifts can count from before the start date
  let start = addDays(date, -((dowOf(date) + 6) % 7));
  if (start < floor) start = floor;
  const days = daysBetween(start, end) + 1;
  const target = days >= 7 ? LIFTS_PER_WEEK : Math.max(0, Math.min(LIFTS_PER_WEEK, days - 1));
  let done = 0;
  if (liftDates) for (let x = start; x <= end; x = addDays(x, 1)) if (liftDates.has(x)) done += 1;
  return { start, end, target, done };
}
export function nextLiftKey(p, date, liftDates) {
  let n = 0;
  if (liftDates) liftDates.forEach((x) => { if (x >= (p.liftsFrom || p.startDate) && x < date) n += 1; });
  return ['A', 'B', 'C'][n % 3];
}
// What's on for `date`? → { lift, liftDue, jog, week }
//   lift    — the next lift in the rotation (today's, if already done today)
//   liftDue — true only on the week's LAST day while the week is still short of
//             its target; that is the only way a lift can count as a miss
//   jog     — Wed + Fri from the first Monday (no jogs in week 1)
export function planFor(p, date, liftDates) {
  const out = { lift: null, liftDue: false, jog: false, week: null };
  if (!inProgramme(p, date)) return out;
  const week = liftWeek(p, date, liftDates);
  const d = dowOf(date);
  return {
    lift: nextLiftKey(p, date, liftDates),
    liftDue: date === week.end && week.done < week.target,
    jog: isJogDay(p, date), // scheduled today (jogs still count on any day)
    week,
  };
}

// ── Day status ────────────────────────────────────────────────────────────
// ctx: { days: {[date]: dayData}, liftDates: Set, runDates: Set,
//        stepsOn(date) → n, checkinDates: Set, nipsOn(date) → n }
// Afternoon start: a programme begun after midday doesn't expect that
// morning's SAVERS - day 1 can't be a SAVERS miss. Everything else counts.
export const saversExempt = (p, date) => !!(p && p.afternoonStart && date === p.startDate);
export const saversCount = (day) => ((day && day.savers) || []).filter(Boolean).length;
export function drinksActual(day, ctx, date) {
  const n = day && day.night && day.night.drinks;
  if (typeof n === 'number') return n;
  return ctx && ctx.nipsOn ? ctx.nipsOn(date) : null;
}
// Jogs are scheduled Wed + Fri (from the first Monday) but count on ANY day:
// a missed morning can be made up that afternoon or on another day. A jog
// counts when a run is logged or when it's ticked on the Home card or in the
// check-in. Any distance counts - 7 km is the aim, not the bar.
export const isJogDay = (p, date) => inProgramme(p, date) && date >= firstMonday(p) && [3, 5].includes(dowOf(date));
export function jogDone(p, ctx, date) {
  const day = ((ctx && ctx.days) || {})[date] || {};
  if (ctx.runDates && ctx.runDates.has(date)) return true;
  if (day.jog === true || (day.night && day.night.jog === true)) return true;
  return false; // no step threshold: getting out the door is what counts, even 500 m
}
// A big step day: 10,000+ steps (typed on the Home card, entered at the
// check-in, or already in the step ledger). It works towards the week's jogs
// but is recorded separately - it is not a jog.
export function bigStepDay(ctx, date) {
  const day = ((ctx && ctx.days) || {})[date] || {};
  const n = Math.max(Number(day.bigSteps) || 0, Number(day.night && day.night.steps) || 0, ctx && ctx.stepsOn ? ctx.stepsOn(date) : 0);
  return n >= BIG_STEP_MIN;
}
// The week's jog tally. target = scheduled jog days in the week; due = the
// week's last day with the target unmet (the only way a jog counts as a miss).
export function jogWeek(p, date, ctx) {
  const { start, end } = weekBounds(p, date);
  let target = 0, jogs = 0, walks = 0;
  for (let x = start; x <= end; x = addDays(x, 1)) {
    if (isJogDay(p, x)) target += 1;
    if (jogDone(p, ctx, x)) jogs += 1; else if (bigStepDay(ctx, x)) walks += 1;
  }
  const done = jogs + walks;
  return { start, end, target, done, jogs, walks, due: date === end && done < target };
}
// Why a day counts as missed ("any slip"): returns a list of reasons, empty = fine.
export function missReasons(p, ctx, date) {
  if (!inProgramme(p, date)) return [];
  const day = (ctx.days || {})[date] || {};
  const r = [];
  if (!saversExempt(p, date) && saversCount(day) < 6) r.push('savers');
  const plan = planFor(p, date, ctx.liftDates);
  if (plan.liftDue) r.push('lift'); // week ended short of 3
  if (jogWeek(p, date, ctx).due) r.push('jog'); // week ended short on jogs
  const num = day.number;
  const act = drinksActual(day, ctx, date);
  if (typeof num === 'number' && typeof act === 'number' && act > num) r.push('drinks');
  if (!(ctx.checkinDates && ctx.checkinDates.has(date))) r.push('checkin');
  return r;
}
// How many days in a row (ending yesterday) were missed.
export function missStreak(p, ctx, today) {
  let n = 0;
  for (let d = addDays(today, -1); inProgramme(p, d) && missReasons(p, ctx, d).length > 0; d = addDays(d, -1)) n += 1;
  return n;
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
      return (d === today || saversExempt(p, d)) && !ok ? null : ok;
    }),
    drinks: streak(p, ctx, today, (d) => {
      const day = (ctx.days || {})[d] || {};
      if (typeof day.number !== 'number') return d === today ? null : false;
      const done = ctx.checkinDates && ctx.checkinDates.has(d);
      if (d === today && !done) return null;
      const act = drinksActual(day, ctx, d);
      return typeof act === 'number' ? act <= day.number : null;
    }),
    // Every lift extends it (any day); a missed jog day or a week that ends
    // short of 3 lifts breaks it.
    sessions: streak(p, ctx, today, (d) => {
      if (ctx.liftDates.has(d) || jogDone(p, ctx, d) || bigStepDay(ctx, d)) return true;
      const plan = planFor(p, d, ctx.liftDates);
      if (plan.liftDue || jogWeek(p, d, ctx).due) return d === today ? null : false;
      return null;
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
  let liftsDone = 0, liftsSched = 0, jogsDone = 0, jogsSched = 0, jogKm = 0, stepDays = 0, mm = 0, nightsLogged = 0, nightsUnder = 0, nightsNumbered = 0;
  const weeks = {};
  const overReasons = {};
  const feel = { afterUnder: [], afterOver: [], mondays: [], all: [] };
  const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  for (let d = p.liftsFrom || p.startDate; d < p.startDate; d = addDays(d, 1)) if (ctx.liftDates.has(d)) liftsDone += 1;
  for (let d = p.startDate; d <= end; d = addDays(d, 1)) {
    const plan = planFor(p, d, ctx.liftDates);
    if (ctx.liftDates.has(d)) liftsDone += 1;
    if (plan.week && d === (plan.week.start < p.startDate ? p.startDate : plan.week.start)) liftsSched += plan.week.target;
    if (jogDone(p, ctx, d)) { jogsDone += 1; jogKm += Number(((ctx.days || {})[d] || {}).jogKm) || 0; } else if (bigStepDay(ctx, d)) stepDays += 1;
    if (plan.week && d === plan.week.start) jogsSched += jogWeek(p, d, ctx).target;
    const day = (ctx.days || {})[d] || {};
    if (saversCount(day) >= 6) mm += 1;
    if (ctx.checkinDates && ctx.checkinDates.has(d)) nightsLogged += 1;
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
    jogs: { done: jogsDone, stepDays, scheduled: jogsSched, km: Math.round(jogKm * 10) / 10 },
    miracleMorning: mm,
    nightsLogged,
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
  { id: 'saversSun', label: "Miracle Morning (Lord's Day)", hint: 'Sun', time: '05:15', days: [0],
    body: () => "Ten minutes to yourself. SAVERS, then set today's number - one you'll be glad of at 6am tomorrow." },
  { id: 'aim', label: 'Workout nudge', hint: "Only on days you said you'd train", time: '16:30', days: [0, 1, 2, 3, 4, 5, 6],
    when: (p, date, ctx) => { const day = ((ctx && ctx.days) || {})[date] || {}; return day.aim === true && !(ctx && ctx.liftDates && ctx.liftDates.has(date)); },
    body: (p, date, ctx) => `You said you'd train today - Day ${planFor(p, date, ctx && ctx.liftDates).lift}. Still on? Two lifts still counts.` },
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
      const rule = dowOf(date) === 5 ? "It's Friday - enjoy it." : 'No drinks till after tea.';
      return `Heading home. Kids first. ${rule} ${committed(ctx, date)}${danger}`;
    } },
  { id: 'brooke', label: 'Time with Brooke', hint: 'Mon – Fri', time: '20:10', days: WEEKDAYS,
    body: () => 'Time with Brooke. No PUBG or YouTube.' },
  { id: 'jogPrep', label: 'Jog prep', hint: 'Night before a jog', time: '21:00', days: [0, 1, 2, 3, 4, 5, 6],
    when: (p, date) => planFor(p, addDays(date, 1)).jog,
    body: () => 'Jog tomorrow at 5:50. Gear out, shoes by the door.' },
  { id: 'screens', label: 'Screens off + check-in', hint: 'Mon – Sat', time: '21:45', days: [1, 2, 3, 4, 5, 6],
    body: () => 'Screens off. Do the nightly check-in, then read and pray.' },
  { id: 'checkinSun', label: "Lord's Day check-in", hint: 'Sun', time: '21:45', days: [0],
    body: () => 'Do the nightly check-in. Log the real number.' },
];
export const FRESH_START = "Couple of rough days. Nothing's lost - today only needs SAVERS and a number.";
export const NEVER_MISS = "Yesterday's behind you. Never miss twice - today is a must.";

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
  const missN = list.length && ctx ? missStreak(p, ctx, date) : 0;
  if (missN > 0) list[0] = { ...list[0], body: `${list[0].body} ${missN >= 2 ? FRESH_START : NEVER_MISS}` };
  return list;
}

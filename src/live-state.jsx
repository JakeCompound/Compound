// live-state.jsx — Real, computed app state derived from actual check-in history.
// No fabricated numbers: an untouched account scores 0 and fills in only as
// the user completes nightly check-ins.

const CHECKINS_KEY = 'compound:checkins';

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadCheckins() {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveCheckins(list) {
  try { localStorage.setItem(CHECKINS_KEY, JSON.stringify(list)); } catch (e) {}
}

// Turn a single night's 9-question answers into normalised 0–1 pillar metrics.
function deriveMetricsFromCheckin(a, user) {
  const sleepGoal = user.sleepGoal || 8;
  const stepGoal = user.stepGoal || 10000;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  return {
    workouts: a.workoutToday ? clamp(0.55 + 0.45 * ((a.workoutIntensity || 3) / 5)) : 0,
    sleep: clamp((a.sleep || 0) / sleepGoal),
    calm: clamp((a.calmRating || 0) / 5),
    diet: clamp((a.dietRating || 0) / 5),
    afd: a.afd ? 1 : clamp(1 - (a.nips || 0) / 10),
    spirit: a.spirit ? 1 : 0,
    steps: clamp((a.steps || 0) / stepGoal),
    partner: a.partnerTime ? 1 : 0,
  };
}

// Append today's check-in (replacing an existing entry for today).
function recordCheckin(answers, user) {
  const list = loadCheckins();
  const today = isoDate(new Date());
  const metrics = deriveMetricsFromCheckin(answers, user);
  const entry = { date: today, answers, metrics };
  const without = list.filter((h) => h.date !== today);
  const next = [...without, entry].sort((x, y) => (x.date < y.date ? -1 : 1));
  saveCheckins(next);
  return next;
}

function nextMilestone(cur) {
  const ladder = [3, 7, 14, 21, 30, 60, 90, 180, 365];
  return ladder.find((m) => m > cur) || cur + 30;
}

// Streaks computed from real, dated history.
function computeStreaks(history) {
  const byDate = {};
  history.forEach((h) => { byDate[h.date] = h; });
  const dayMs = 86400000;

  const streakFor = (pred) => {
    // current streak ending today (or yesterday if today not logged yet)
    let cur = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!byDate[isoDate(cursor)]) cursor.setTime(cursor.getTime() - dayMs);
    while (byDate[isoDate(cursor)] && pred(byDate[isoDate(cursor)])) {
      cur++;
      cursor.setTime(cursor.getTime() - dayMs);
    }
    // best run across all logged history
    const dates = Object.keys(byDate).sort();
    let best = 0, run = 0, prev = null;
    for (const ds of dates) {
      const ok = pred(byDate[ds]);
      const consecutive = prev && (new Date(ds) - new Date(prev)) <= dayMs * 1.5;
      run = ok ? (consecutive ? run + 1 : 1) : 0;
      if (run > best) best = run;
      prev = ds;
    }
    best = Math.max(best, cur);
    return { current: cur, best, next: nextMilestone(cur) };
  };

  return {
    checkin: streakFor(() => true),
    workout: streakFor((h) => !!h.answers.workoutToday),
    spirit: streakFor((h) => !!h.answers.spirit),
    afd: streakFor((h) => !!h.answers.afd),
  };
}

// Build the Sun→Sat strip for the current week from real entries.
function buildWeek(history) {
  const byDate = {};
  history.forEach((h) => { byDate[h.date] = h; });
  // Actually-logged workout sessions count as a workout for that day — not just
  // the check-in "did you work out?" answer. This makes the week strip and the
  // workouts ring read ONE source (a day is a workout day from either signal).
  const workoutDates = new Set();
  try { (window.loadWorkouts ? window.loadWorkouts() : []).forEach((w) => { if (w && w.date) workoutDates.add(w.date); }); } catch (e) {}
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = isoDate(today);
  // Sunday of this week (week runs Sun → Sat)
  const dow = today.getDay(); // 0 = Sunday … 6 = Saturday
  const sunday = new Date(today.getTime() - dow * 86400000);
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return labels.map((lab, i) => {
    const d = new Date(sunday.getTime() + i * 86400000);
    const key = isoDate(d);
    const e = byDate[key];
    const isToday = key === todayKey;
    const isFuture = d > today && !isToday;
    if (isFuture) return { day: lab, future: true };
    const loggedWorkout = workoutDates.has(key);
    if (!e) return { day: lab, checkin: false, workout: loggedWorkout, spirit: false, afd: false, today: isToday };
    return {
      day: lab,
      checkin: true,
      workout: !!e.answers.workoutToday || loggedWorkout,
      spirit: !!e.answers.spirit,
      afd: !!e.answers.afd,
      today: isToday,
    };
  });
}

const ZERO_METRICS = { workouts: 0, sleep: 0, calm: 0, diet: 0, afd: 0, spirit: 0, steps: 0, partner: 0 };

// The real, derived Home state.
function deriveLiveState(user, history) {
  const today = new Date();
  const dow = today.getDay();
  const todayKey = isoDate(today);
  const todayEntry = history.find((h) => h.date === todayKey);
  const latest = todayEntry || history[history.length - 1] || null;
  const metrics = latest ? latest.metrics : ZERO_METRICS;

  const weekDays = buildWeek(history);
  const streaks = computeStreaks(history);
  const avg = (...xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const radar = {
    Health: avg(metrics.workouts, metrics.sleep, metrics.steps, metrics.diet),
    Mental: metrics.calm,
    Relationships: metrics.partner,
    Spiritual: metrics.spirit,
    Consistency: Math.min(1, streaks.checkin.current / 7),
  };

  const workoutsTarget = user.trainingDays || 3;
  const workoutsDone = weekDays.filter((d) => d.workout).length;
  const daysLeftInWeek = weekDays.filter((d) => d.future || d.today).length;

  // North-star inputs
  let weeklyNips = computeWeeklyNips(history);
  // Add today's live tally if today's check-in isn't logged yet (avoids double count).
  if (!todayEntry) { try { weeklyNips += (window.loadNipsToday ? window.loadNipsToday() : 0); } catch (e) {} }
  // Single source: workoutsDone already counts days with a logged session OR a
  // check-in "worked out" (see buildWeek), so it needs no separate reconciliation.
  const weeklyWorkouts = workoutsDone;

  // Steps — ledger-first (compound:stepLog); a day with no logs falls back to
  // its check-in answer. Daily + weekly power the Steps ring's two faces.
  const stepGoal = user.stepGoal || 10000;
  let dailySteps = 0;
  let weeklySteps = 0;
  try {
    const sunday = new Date(today); sunday.setHours(12, 0, 0, 0); sunday.setDate(sunday.getDate() - dow);
    for (let i = 0; i <= dow; i++) {
      const d = new Date(sunday.getTime() + i * 86400000);
      const key = isoDate(d);
      let s = window.dayStepTotal ? window.dayStepTotal(key) : 0;
      if (!s) { const e = history.find((h) => h.date === key); if (e && e.answers && typeof e.answers.steps === 'number') s = e.answers.steps; }
      if (key === todayKey) dailySteps = s;
      weeklySteps += s;
    }
  } catch (e) {}

  // Life Score — daily (today's metrics) is computed by the ring; weekly = the
  // average score across this week's logged check-ins.
  let weeklyLifeScore = 0;
  try {
    const scores = weekDays
      .map((d, i) => {
        if (d.future || !d.checkin) return null;
        const sunday = new Date(today); sunday.setHours(12, 0, 0, 0); sunday.setDate(sunday.getDate() - dow);
        const key = isoDate(new Date(sunday.getTime() + i * 86400000));
        const e = history.find((h) => h.date === key);
        return e && window.computeLifeScore ? window.computeLifeScore(e.metrics) : null;
      })
      .filter((s) => typeof s === 'number');
    if (scores.length) weeklyLifeScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  } catch (e) {}

  // Today's earned exercise kcal (v2 targets only)
  let earnedKcalToday = 0;
  try { earnedKcalToday = window.dayEarnedKcal ? window.dayEarnedKcal() : 0; } catch (e) {}
  // Today's live nips (for the nips ring's daily face)
  let nipsToday = 0;
  try { nipsToday = todayEntry ? (todayEntry.answers.nips || 0) : (window.loadNipsToday ? window.loadNipsToday() : 0); } catch (e) {}
  let nipLimit = 55;
  try {
    const stored = parseInt(localStorage.getItem('compound:nipLimit'), 10);
    if (!Number.isNaN(stored)) nipLimit = stored;
    else if (user.nipLimit != null) nipLimit = user.nipLimit;
  } catch (e) {}

  const empty = history.length === 0;
  let insight;
  if (empty) {
    insight = {
      tag: 'WELCOME',
      title: 'Your score starts tonight.',
      body: 'Nothing is calculated yet — your Life Score is built entirely from your own check-ins. Log tonight and it comes alive.',
    };
  } else {
    insight = buildLiveInsight(history, metrics, streaks);
  }

  const greeting = empty ? 'Welcome in.' : (todayEntry ? 'Logged for today.' : 'Ready when you are.');

  return {
    label: empty ? 'DAY 00' : `DAY ${String(history.length).padStart(2, '0')}`,
    greeting,
    dayOfWeek: dow,
    weekDays,
    streaks,
    todayCheckinDone: !!todayEntry,
    loggedSteps: todayEntry ? todayEntry.answers.steps : null,
    loggedSleep: todayEntry ? todayEntry.answers.sleep : null,
    workoutsTarget,
    workoutsDone,
    daysLeftInWeek,
    weeklyNips,
    weeklyWorkouts,
    nipLimit,
    dailySteps, weeklySteps, stepGoal,
    weeklyLifeScore, earnedKcalToday, nipsToday,
    radar,
    metrics,
    insight,
    empty,
  };
}

// A genuine, data-driven insight (no fabricated correlations).
function buildLiveInsight(history, metrics, streaks) {
  // Look for a real signal in the last 14 days.
  const recent = history.slice(-14);
  const withSleep = recent.filter((h) => typeof h.answers.sleep === 'number');
  if (streaks.checkin.current >= 3) {
    return {
      tag: 'CONSISTENCY',
      title: `${streaks.checkin.current}-day check-in streak.`,
      body: `${streaks.checkin.next - streaks.checkin.current} more days to your next milestone. The score compounds the longer you hold it.`,
    };
  }
  if (metrics.sleep < 0.7) {
    return {
      tag: 'SLEEP',
      title: 'Sleep is dragging the score.',
      body: 'Your logged sleep is under target. It feeds Health and tomorrow\u2019s training — bank an earlier night.',
    };
  }
  if (metrics.workouts === 0) {
    return {
      tag: 'MOVEMENT',
      title: 'No workout logged today.',
      body: 'Even 20 minutes moves the Health pillar. The week still has room.',
    };
  }
  return {
    tag: 'STEADY',
    title: 'Pillars are holding.',
    body: 'Keep logging honestly — the insights sharpen as the history grows.',
  };
}

// Sum nips logged across the current (Mon-based) week.
function computeWeeklyNips(history) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today.getTime() - dow * 86400000);
  return history
    .filter((h) => new Date(h.date + 'T12:00:00') >= monday)
    .reduce((sum, h) => sum + (h.answers.nips || 0), 0);
}

// Plateau detector — multi-signal. A flat scale alone isn't enough: it can mean
// a true stall OR body recomposition (losing fat while gaining muscle at once).
// We only ever suggest cutting when strength AND waist agree it's a real stall.
function detectPlateau() {
  try {
    const weighins = JSON.parse(localStorage.getItem('compound:weighins') || '[]')
      .slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    if (weighins.length < 4) return null;
    const last = weighins[weighins.length - 1];
    const lastDate = new Date(last.date + 'T12:00:00');
    // window of entries within the last ~5 weeks
    const cutoff = new Date(lastDate.getTime() - 35 * 86400000);
    const recent = weighins.filter((w) => new Date(w.date + 'T12:00:00') >= cutoff);
    if (recent.length < 4) return null;
    const span = (lastDate - new Date(recent[0].date + 'T12:00:00')) / 86400000;
    if (span < 28) return null; // need at least 4 weeks of data
    const vals = recent.map((w) => w.value);
    const change = Math.abs(vals[vals.length - 1] - vals[0]);
    const startW = vals[0] || 1;
    // "flat" = <0.7% bodyweight drift across the window
    if (change / startW > 0.007) return null;
    // training consistent: at least ~3 sessions in the last 2 weeks
    const workouts = (window.loadWorkouts ? window.loadWorkouts() : []);
    const twoWk = new Date(lastDate.getTime() - 14 * 86400000);
    const recentW = workouts.filter((w) => new Date(w.date + 'T12:00:00') >= twoWk);
    if (recentW.length < 3) return null;
    // Don't re-nudge within 21 days of last dismissal/adjustment (paced)
    const dismissed = Number(localStorage.getItem('compound:plateauDismissed') || 0);
    if (Date.now() - dismissed < 21 * 86400000) return null;

    // Cross-check the flat scale against strength + waist before deciding.
    const winStart = cutoff.getTime();
    const lastMs = lastDate.getTime();
    const liftsUp = strengthTrendUp(workouts, winStart, lastMs);
    const measurements = (window.loadMeasurements ? window.loadMeasurements() : []);
    const waist = waistTrend(measurements, winStart, lastMs);
    const recomp = liftsUp || waist.down;

    return {
      change: +change.toFixed(1), weeks: Math.round(span / 7), current: last.value,
      kind: recomp ? 'recomp' : 'stall',
      liftsUp, waistDown: waist.down, waistKnown: waist.known, waistDelta: waist.delta,
    };
  } catch (e) { return null; }
}

// Strength trending up = muscle being gained. Signal: a PR in the last 21 days,
// or best e1RM on common lifts rising from the window's first half to its second.
function strengthTrendUp(workouts, sinceMs, lastMs) {
  try {
    const w = workouts
      .filter((x) => { const t = new Date(x.date + 'T12:00:00').getTime(); return t >= sinceMs && t <= lastMs; })
      .slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    if (w.length < 2) return false;
    const prCut = lastMs - 21 * 86400000;
    if (w.some((x) => (x.prs || []).length > 0 && new Date(x.date + 'T12:00:00').getTime() >= prCut)) return true;
    const half = Math.floor(w.length / 2);
    const agg = (arr) => {
      const b = {};
      arr.forEach((e) => { const s = window.sessionBest1RM ? window.sessionBest1RM(e) : {}; Object.keys(s).forEach((k) => { b[k] = Math.max(b[k] || 0, s[k]); }); });
      return b;
    };
    const be = agg(w.slice(0, half)), bl = agg(w.slice(half));
    const keys = Object.keys(bl).filter((k) => be[k]);
    if (keys.length) {
      const se = keys.reduce((s, k) => s + be[k], 0), sl = keys.reduce((s, k) => s + bl[k], 0);
      if (sl > se * 1.01) return true; // >1% rise on lifts trained in both halves
    }
    return false;
  } catch (e) { return false; }
}

// Waist trend over the plateau window. down = a meaningful drop (≥0.3cm) = fat loss.
function waistTrend(measurements, sinceMs, lastMs) {
  const pick = (list) => list.filter((m) => m && m.values && typeof m.values.waist === 'number').slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const inWin = pick(measurements).filter((m) => { const t = new Date((m.date || '') + 'T12:00:00').getTime(); return t >= sinceMs && t <= lastMs; });
  const series = inWin.length >= 2 ? inWin : pick(measurements);
  if (series.length < 2) return { known: false, down: false, delta: 0 };
  const delta = +(series[series.length - 1].values.waist - series[0].values.waist).toFixed(1);
  return { known: true, down: delta <= -0.3, delta };
}

function dismissPlateau() { try { localStorage.setItem('compound:plateauDismissed', String(Date.now())); } catch (e) {} }

// True-stall adjustment: a gentle −120 kcal/day trim with a hard floor (never
// below ~BMR×1.1), carbs refilled, and the 21-day pacing guard set. User-confirmed
// from the Home nudge. Returns the new targets (or null if none set yet).
function applyPlateauTrim() {
  try {
    const t = window.loadTargets ? window.loadTargets() : null;
    if (!t) { dismissPlateau(); return null; }
    const floor = Math.max(1600, Math.round((t.bmr || 1500) * 1.1));
    const calories = Math.max(floor, (t.calories || 0) - 120);
    let carbs = Math.round((calories - (t.protein || 0) * 4 - (t.fat || 0) * 9) / 4);
    if (carbs < 0) carbs = 0;
    const next = { ...t, calories, carbs, setAt: Date.now() };
    if (window.saveTargets) window.saveTargets(next);
    dismissPlateau();
    return next;
  } catch (e) { return null; }
}

Object.assign(window, {
  loadCheckins, saveCheckins, recordCheckin, deriveMetricsFromCheckin,
  deriveLiveState, computeStreaks, buildWeek, isoDate, computeWeeklyNips,
  detectPlateau, dismissPlateau, applyPlateauTrim,
});

export { CHECKINS_KEY, ZERO_METRICS, applyPlateauTrim, buildLiveInsight, buildWeek, computeStreaks, computeWeeklyNips, deriveLiveState, deriveMetricsFromCheckin, detectPlateau, dismissPlateau, isoDate, loadCheckins, nextMilestone, recordCheckin, saveCheckins, strengthTrendUp, waistTrend };

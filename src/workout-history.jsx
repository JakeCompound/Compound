// workout-history.jsx — Real workout history store + derivations.
// Completed sessions persist here; the dashboard, past-workouts log, PB wall,
// 1RM trends, "last time" lookups and body heatmap all derive from it.

const WORKOUTS_KEY = 'compound:workouts';

function loadWorkouts() {
  try { return JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]'); } catch (e) { return []; }
}
function saveWorkouts(list) {
  try { localStorage.setItem(WORKOUTS_KEY, JSON.stringify(list)); } catch (e) {}
}

// Best estimated 1RM achieved within a single session, per tracked lift.
function sessionBest1RM(entry) {
  const out = {};
  entry.exercises.forEach((ex) => {
    if (!ex.tracked1RM) return;
    let best = 0;
    ex.sets.forEach((s) => {
      if (s.complete && !s.isWarmup && s.weight && s.reps) {
        const e1 = window.calc1RM(s.weight, s.reps, s.rir || 0);
        if (e1 > best) best = e1;
      }
    });
    if (best > 0) out[ex.tracked1RM] = Math.max(out[ex.tracked1RM] || 0, best);
  });
  return out;
}

// Persist a finished session. Computes volume, muscles worked, and PRs
// (vs all prior history). Returns { list, prs:[{lift,value}] }.
function recordWorkout(exercises, config) {
  const prior = loadWorkouts();
  const priorBest = {};
  prior.forEach((e) => {
    const b = sessionBest1RM(e);
    Object.keys(b).forEach((k) => { priorBest[k] = Math.max(priorBest[k] || 0, b[k]); });
  });

  const volume = exercises.reduce((sum, ex) =>
    sum + ex.sets.filter((s) => s.complete && !s.isWarmup && s.weight && s.reps)
      .reduce((s2, s) => s2 + s.weight * s.reps, 0), 0);

  // Muscles worked — union of exercise groups (via library lookup)
  const muscles = new Set();
  exercises.forEach((ex) => {
    const lib = (window.EXERCISES || []).find((e) => e.id === ex.exId);
    (lib ? lib.groups : ex.groups || []).forEach((g) => muscles.add(g));
  });

  const completedSets = exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.complete).length, 0);

  const entry = {
    id: 'w-' + Date.now(),
    date: window.isoDate(new Date()),
    ts: Date.now(),
    durationMin: config.duration,
    location: config.location,
    feeling: config.preFeel || 0,
    muscles: [...muscles],
    volume: Math.round(volume),
    completedSets,
    exercises: exercises.map((ex) => ({
      exId: ex.exId,
      name: ex.name,
      tracked1RM: ex.tracked1RM,
      groups: ex.groups,
      sets: ex.sets.map((s) => ({
        weight: s.weight, reps: s.reps, rir: s.rir,
        isWarmup: !!s.isWarmup, complete: !!s.complete,
        targetHold: s.targetHold,
      })),
    })),
    prs: [],
  };

  // PR detection
  const thisBest = sessionBest1RM(entry);
  const prs = [];
  Object.keys(thisBest).forEach((k) => {
    if (thisBest[k] > (priorBest[k] || 0) + 0.01) {
      prs.push({ lift: k, value: thisBest[k] });
    }
  });
  entry.prs = prs.map((p) => p.lift);

  const list = [...prior, entry];
  saveWorkouts(list);
  return { list, prs };
}

// All-time best e1RM per tracked lift.
function allTimeBest1RM(history) {
  const best = {};
  history.forEach((e) => {
    const b = sessionBest1RM(e);
    Object.keys(b).forEach((k) => { best[k] = Math.max(best[k] || 0, b[k]); });
  });
  return best;
}

// Series of best e1RM per session date for a given lift.
function lift1RMSeries(history, liftKey) {
  const pts = [];
  history.forEach((e) => {
    const b = sessionBest1RM(e);
    if (b[liftKey]) pts.push(+b[liftKey].toFixed(1));
  });
  return pts;
}

// PB wall — best per tracked lift with when.
function pbWall(history) {
  const TRACKED = window.TRACKED_LIFTS || [];
  const rows = [];
  TRACKED.forEach((l) => {
    let best = 0, when = null;
    history.forEach((e) => {
      const b = sessionBest1RM(e);
      if (b[l.key] && b[l.key] > best) { best = b[l.key]; when = e.date; }
    });
    if (best > 0) rows.push({ lift: l.label, weight: +best.toFixed(1), when, estimated: true });
  });
  return rows.sort((a, b) => b.weight - a.weight);
}

// Most recent prior session's working sets for an exercise.
function lastSetsFor(history, exId) {
  for (let i = history.length - 1; i >= 0; i--) {
    const ex = history[i].exercises.find((e) => e.exId === exId);
    if (ex) {
      const working = ex.sets.filter((s) => s.complete && !s.isWarmup && s.weight && s.reps);
      if (working.length) return working.map((s) => ({ w: s.weight, r: s.reps }));
    }
  }
  return null;
}

// Body heatmap — recency-based recovery status per muscle group.
function recoveryHeatmap(history) {
  const groups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const out = {};
  groups.forEach((g) => {
    let lastDays = Infinity;
    history.forEach((e) => {
      if ((e.muscles || []).includes(g)) {
        const d = new Date(e.date + 'T12:00:00');
        const days = Math.floor((today - d) / 86400000);
        if (days < lastDays) lastDays = days;
      }
    });
    out[g] = lastDays <= 1 ? 'red' : lastDays <= 3 ? 'amber' : 'green';
  });
  return out;
}

function volumeSeries(history, n) {
  return history.slice(-n).map((e) => ({
    id: e.id, day: dayAbbrev(e.date), volume: e.volume, prs: e.prs || [],
  }));
}

function dayAbbrev(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

function relativeDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const days = Math.round((today - d) / 86400000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days} DAYS AGO`;
  if (days < 14) return 'LAST WEEK';
  return `${Math.floor(days / 7)} WKS AGO`;
}

function sessionsThisWeek(history) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = today.getDay(); // 0 = Sunday — week runs Sun → Sat
  const weekStart = new Date(today.getTime() - dow * 86400000);
  return history.filter((e) => new Date(e.date + 'T12:00:00') >= weekStart).length;
}

Object.assign(window, {
  loadWorkouts, saveWorkouts, recordWorkout, allTimeBest1RM, lift1RMSeries,
  pbWall, lastSetsFor, recoveryHeatmap, volumeSeries, relativeDay, dayAbbrev,
  sessionsThisWeek, sessionBest1RM,
});

export { WORKOUTS_KEY, allTimeBest1RM, dayAbbrev, lastSetsFor, lift1RMSeries, loadWorkouts, pbWall, recordWorkout, recoveryHeatmap, relativeDay, saveWorkouts, sessionBest1RM, sessionsThisWeek, volumeSeries };

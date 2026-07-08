// nutrition-data.jsx — Targets calculator (rippedbody replica), stores, day totals.

// ── Calorie + macro calculator ─────────────────────────────────────────────
// BMR: Mifflin-St Jeor (no BF) or Katch-McArdle (BF known).
// TDEE is built additively from real inputs — a moderate maintenance base + step
// NEAT + training burn — replacing the old ×activity-multiplier model, which
// over-estimated. Cut = deficit from weekly %; Gain = monthly % surplus +50%.
// Protein: USER OVERRIDE — 0.6 g/lb bodyweight (editable). Fat from preference; carbs fill.
//
// MODERATE dials — deliberately mid-range (between a lean estimate and the old
// generous ×1.65). The plateau loop does the real calibrating, so the start just
// needs to be sane and sustainable. Kept as named constants to tune after real use.
const MAINTENANCE_MULT = 1.30;     // RMR + TEF + daily living, ×BMR
const STEPS_KCAL_FACTOR = 0.00045; // NEAT per step, bodyweight-scaled
const LIFTING_MET = 6;             // METs for resistance training

// Defaults for the activity inputs (a typical day, not a goal).
const DEFAULT_STEPS = 7000;
const DEFAULT_SESSIONS = 3;
const DEFAULT_MINUTES = 45;

// ── v2 "earned calories" model ────────────────────────────────────────────
// The daily base assumes only a LIFESTYLE floor (deliberately low — pick lower
// when unsure). Steps above the floor, walks/runs, and completed workouts are
// EARNED into that day's allowance at 100% — the conservatism lives in the low
// baseline, not in percentage haircuts. Targets carry `lifestyle` when made
// with this model; legacy targets (no lifestyle) keep the old additive math
// and simply don't earn.
const LIFESTYLES = [
  { key: 'sedentary', label: 'Sedentary',      sub: 'Desk-bound, driving, little walking',   mult: 1.20, baselineSteps: 2250 },
  { key: 'light',     label: 'Lightly active', sub: 'Some walking, errands, on feet a bit',  mult: 1.35, baselineSteps: 5000 },
  { key: 'active',    label: 'Active',         sub: 'On your feet for much of the day',      mult: 1.50, baselineSteps: 7500 },
  { key: 'very',      label: 'Very active',    sub: 'Physical job, rarely sitting',          mult: 1.65, baselineSteps: 10000 },
];

const GOALS = {
  cut:     { label: 'Cut', sub: 'Lose fat, slow & steady' },
  maintain:{ label: 'Maintain', sub: 'Recomposition' },
  gain:    { label: 'Gain', sub: 'Build muscle, lean' },
};

// Sensible slow-to-medium rates (no aggressive option).
// Cut: % bodyweight per WEEK. Gain: % bodyweight per MONTH.
const CUT_RATES = [
  { v: 0.5,  label: '0.5%/wk · gentle' },
  { v: 0.75, label: '0.75%/wk · steady' },
];
const GAIN_RATES = [
  { v: 0.5, label: '0.5%/mo · lean' },
  { v: 1.0, label: '1%/mo · steady' },
];

const LB_PER_KG = 2.2046226;
const KCAL_PER_LB = 3500;

function calcTargets(input) {
  // input: { gender, age, weightKg, heightCm, bodyFat (0-100 or null), activity, goal, rate,
  //          inDeficit, weightReduced, fatPref ('low'|'std'|'high'), proteinPerLb (default 0.6) }
  const wKg = input.weightKg;
  const wLb = wKg * LB_PER_KG;
  const hCm = input.heightCm;
  const age = input.age;
  let bmr;
  if (input.bodyFat != null && input.bodyFat > 0) {
    const lbmKg = wKg * (1 - input.bodyFat / 100);
    bmr = 370 + 21.6 * lbmKg; // Katch-McArdle
  } else {
    // Mifflin-St Jeor
    bmr = 10 * wKg + 6.25 * hCm - 5 * age + (input.gender === 'female' ? -161 : 5);
  }
  if (input.inDeficit) bmr *= 0.95;
  if (input.weightReduced) bmr *= 0.97;

  // TDEE:
  //  • v2 (input.lifestyle set): bmr × lifestyle floor only — workouts and steps
  //    above the floor are EARNED per-day, not assumed here.
  //  • legacy: additive model (maintenance base + step NEAT + training ÷ 7).
  const steps = input.steps ?? DEFAULT_STEPS;
  const sessions = input.sessions ?? DEFAULT_SESSIONS;
  const minutes = input.minutes ?? DEFAULT_MINUTES;
  const life = input.lifestyle ? LIFESTYLES.find((l) => l.key === input.lifestyle) : null;
  let tdee;
  if (life) {
    tdee = bmr * life.mult;
  } else {
    const maintenanceBase = bmr * MAINTENANCE_MULT;
    const stepsKcal = steps * wKg * STEPS_KCAL_FACTOR;
    // 3.5 ml O₂/kg/min baseline; /200 → kcal/min; /7 spreads the week's training over the week.
    const trainingKcalPerDay = (sessions * minutes * (LIFTING_MET * 3.5 * wKg / 200)) / 7;
    tdee = maintenanceBase + stepsKcal + trainingKcalPerDay;
  }

  let calories = tdee;
  if (input.goal === 'cut') {
    const lbsPerWeek = (input.rate / 100) * wLb;
    calories = tdee - (lbsPerWeek * KCAL_PER_LB) / 7;
  } else if (input.goal === 'gain') {
    const lbsPerMonth = (input.rate / 100) * wLb;
    const dailySurplus = (lbsPerMonth * KCAL_PER_LB) / 30 * 1.5; // +50% per rippedbody
    calories = tdee + dailySurplus;
  }
  calories = Math.round(calories / 10) * 10;

  // Protein — user override 0.6 g/lb bodyweight (editable)
  const proteinPerLb = input.proteinPerLb || 0.6;
  const protein = Math.round(proteinPerLb * wLb);

  // Fat from preference (% of calories): low 20%, std 27%, high 35%
  const fatPct = input.fatPref === 'low' ? 0.20 : input.fatPref === 'high' ? 0.35 : 0.27;
  let fat = Math.round((calories * fatPct) / 9);

  // Carbs fill the remainder
  let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  if (carbs < 0) { carbs = 0; fat = Math.max(0, Math.round((calories - protein * 4) / 9)); }

  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), calories,
    protein, fat, carbs,
    proteinPerLb, steps, sessions, minutes, goal: input.goal, rate: input.rate,
    lifestyle: life ? life.key : undefined, // presence marks a v2 "earned calories" target
  };
}

// ── Stores ────────────────────────────────────────────────────────────────
const TARGETS_KEY = 'compound:targets';
function loadTargets() { try { return JSON.parse(localStorage.getItem(TARGETS_KEY) || 'null'); } catch (e) { return null; } }
function saveTargets(t) { try { localStorage.setItem(TARGETS_KEY, JSON.stringify(t)); } catch (e) {} }

const FOOD_KEY = 'compound:food'; // { [date]: [ {id, name, photo, kcal, p, c, f, confidence, health, info, questions:[{q,options,answer}], ts} ] }
function loadFood() { try { return JSON.parse(localStorage.getItem(FOOD_KEY) || '{}'); } catch (e) { return {}; } }
function saveFood(all) { try { localStorage.setItem(FOOD_KEY, JSON.stringify(all)); } catch (e) {} }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function foodForDay(date) { const all = loadFood(); return all[date || todayKey()] || []; }
function addFood(entry) {
  const all = loadFood();
  const k = todayKey();
  all[k] = [...(all[k] || []), entry];
  saveFood(all);
  return all[k];
}
function updateFood(id, patch) {
  const all = loadFood();
  const k = todayKey();
  all[k] = (all[k] || []).map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveFood(all);
  return all[k];
}
function removeFood(id) {
  const all = loadFood();
  const k = todayKey();
  all[k] = (all[k] || []).filter((e) => e.id !== id);
  saveFood(all);
  return all[k];
}

function dayTotals(date) {
  const items = foodForDay(date);
  const base = items.reduce((t, e) => ({
    kcal: t.kcal + (e.kcal || 0),
    p: t.p + (e.p || 0),
    c: t.c + (e.c || 0),
    f: t.f + (e.f || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 });
  base.kcal += loadAlcoholKcal(date); // drinks logged via the + Alcohol path count too
  return base;
}

// ── Alcohol calories (per day) — drinks count toward the calorie total ─────
const ALC_KCAL_KEY = 'compound:alcoholKcal'; // { [date]: kcal }
function loadAlcoholKcal(date) { try { const all = JSON.parse(localStorage.getItem(ALC_KCAL_KEY) || '{}'); return all[date || todayKey()] || 0; } catch (e) { return 0; } }
function setAlcoholKcal(kcal, date) {
  try { const all = JSON.parse(localStorage.getItem(ALC_KCAL_KEY) || '{}'); all[date || todayKey()] = Math.max(0, Math.round(kcal)); localStorage.setItem(ALC_KCAL_KEY, JSON.stringify(all)); } catch (e) {}
  return Math.max(0, Math.round(kcal));
}
function addAlcoholKcal(delta, date) { return setAlcoholKcal(loadAlcoholKcal(date) + delta, date); }

// ── Step ledger + earned exercise kcal (v2 model) ──────────────────────────
// Steps are logged in small increments through the day (ADHD-friendly small
// wins); walks/runs live in the SAME ledger as accent-coloured "certified
// effort" entries — one ledger means a walk's steps are never double-counted.
const STEPLOG_KEY = 'compound:stepLog'; // { [date]: [{id, ts, kind:'update'|'walk'|'run', steps, kcal, distanceKm, durationMin, source}] }
function loadStepLog() { try { return JSON.parse(localStorage.getItem(STEPLOG_KEY) || '{}'); } catch (e) { return {}; } }
function saveStepLog(all) { try { localStorage.setItem(STEPLOG_KEY, JSON.stringify(all)); } catch (e) {} }
function stepEntriesForDay(date) { const all = loadStepLog(); return all[date || todayKey()] || []; }
function addStepEntry(entry, date) {
  const all = loadStepLog();
  const k = date || todayKey();
  all[k] = [...(all[k] || []), { id: 's-' + Date.now(), ts: Date.now(), ...entry }];
  saveStepLog(all);
  return all[k];
}
function removeStepEntry(id, date) {
  const all = loadStepLog();
  const k = date || todayKey();
  all[k] = (all[k] || []).filter((e) => e.id !== id);
  saveStepLog(all);
  return all[k];
}
function dayStepTotal(date) { return stepEntriesForDay(date).reduce((s, e) => s + (e.steps || 0), 0); }

// Estimate a walk/run from distance (+ condition chips). Walking ≈ 0.53
// kcal/kg/km, running ≈ 0.95 (pace folds into distance); chips nudge for
// terrain / temperature / carrying load. Returns { steps, kcal }.
function estimateCardioKcal({ kind, distanceKm, weightKg, chips = {} }) {
  const perKm = kind === 'run' ? 0.95 : 0.53;
  let kcal = (distanceKm || 0) * weightKg * perKm;
  if (chips.hilly) kcal *= 1.10;
  if (chips.hot) kcal *= 1.05;
  if (chips.cold) kcal *= 1.05;
  if (chips.load) kcal *= 1.10;
  const steps = Math.round((distanceKm || 0) * (kind === 'run' ? 1150 : 1300));
  return { steps, kcal: Math.round(kcal) };
}

// Earned kcal for a day: plain step-updates ABOVE the lifestyle baseline +
// walks/runs at their own kcal + strength workouts (duration × MET), all at
// 100% — the low lifestyle floor is the safety margin. Only v2 targets (with
// a lifestyle) earn; legacy targets already assume activity in the base, so
// earning would double-count.
function dayEarnedKcal(date) {
  const t = loadTargets();
  if (!t || !t.lifestyle) return 0;
  const life = LIFESTYLES.find((l) => l.key === t.lifestyle) || LIFESTYLES[0];
  let wKg = 80;
  try { const onb = JSON.parse(localStorage.getItem('compound:onboarding') || '{}'); if (onb.weight) wKg = onb.weight; } catch (e) {}
  const entries = stepEntriesForDay(date);
  const plainSteps = entries.filter((e) => e.kind === 'update').reduce((s, e) => s + (e.steps || 0), 0);
  const plainKcal = Math.max(0, plainSteps - life.baselineSteps) * wKg * STEPS_KCAL_FACTOR;
  const cardioKcal = entries.filter((e) => e.kind !== 'update').reduce((s, e) => s + (e.kcal != null ? e.kcal : Math.round((e.steps || 0) * wKg * STEPS_KCAL_FACTOR)), 0);
  let workoutKcal = 0;
  try {
    const k = date || todayKey();
    const ws = (window.loadWorkouts ? window.loadWorkouts() : []).filter((w) => w.date === k && w.kind !== 'cardio');
    workoutKcal = ws.reduce((s, w) => s + (w.durationMin || 0) * (LIFTING_MET * 3.5 * wKg / 200), 0);
  } catch (e) {}
  return Math.round(plainKcal + cardioKcal + workoutKcal);
}

// All open meal questions today (across meals)
function openMealQuestions(date) {
  const items = foodForDay(date);
  const out = [];
  items.forEach((e) => {
    (e.questions || []).forEach((q, i) => {
      if (q.answer == null) out.push({ foodId: e.id, foodName: e.name, photo: e.photo, qIndex: i, ...q });
    });
  });
  return out;
}

// ── Nip tally (real-time, per day) — separate from check-in until check-in writes ──
const NIPS_KEY = 'compound:nipsToday'; // { [date]: number }
function loadNipsToday(date) { try { const all = JSON.parse(localStorage.getItem(NIPS_KEY) || '{}'); return all[date || todayKey()] || 0; } catch (e) { return 0; } }
function setNipsToday(n, date) {
  try {
    const all = JSON.parse(localStorage.getItem(NIPS_KEY) || '{}');
    all[date || todayKey()] = Math.max(0, n);
    localStorage.setItem(NIPS_KEY, JSON.stringify(all));
  } catch (e) {}
  return Math.max(0, n);
}

Object.assign(window, {
  GOALS, CUT_RATES, GAIN_RATES, LIFESTYLES, calcTargets,
  loadTargets, saveTargets, loadFood, saveFood, foodForDay, addFood, updateFood, removeFood,
  dayTotals, openMealQuestions, todayKey: todayKey,
  loadNipsToday, setNipsToday,
  loadAlcoholKcal, setAlcoholKcal, addAlcoholKcal,
  loadStepLog, stepEntriesForDay, addStepEntry, removeStepEntry, dayStepTotal, dayEarnedKcal, estimateCardioKcal,
});

export { ALC_KCAL_KEY, CUT_RATES, DEFAULT_MINUTES, DEFAULT_SESSIONS, DEFAULT_STEPS, FOOD_KEY, GAIN_RATES, GOALS, KCAL_PER_LB, LB_PER_KG, LIFESTYLES, LIFTING_MET, MAINTENANCE_MULT, NIPS_KEY, STEPLOG_KEY, STEPS_KCAL_FACTOR, TARGETS_KEY, addAlcoholKcal, addFood, addStepEntry, calcTargets, dayEarnedKcal, dayStepTotal, dayTotals, estimateCardioKcal, foodForDay, loadAlcoholKcal, loadFood, loadNipsToday, loadStepLog, loadTargets, openMealQuestions, removeFood, removeStepEntry, saveFood, saveTargets, setAlcoholKcal, setNipsToday, stepEntriesForDay, todayKey, updateFood };

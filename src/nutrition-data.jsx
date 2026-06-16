// nutrition-data.jsx — Targets calculator (rippedbody replica), stores, day totals.

// ── rippedbody-style calorie + macro calculator ───────────────────────────
// BMR: Mifflin-St Jeor (no BF) or Katch-McArdle (BF known).
// Activity ×BMR → TDEE. Cut = deficit from weekly %; Bulk = monthly % surplus +50%.
// Protein: USER OVERRIDE — 0.6 g/lb bodyweight (editable). Fat from preference; carbs fill.
const ACTIVITY = {
  sedentary:   { mult: 1.25, label: 'Sedentary', sub: '<5k steps/day' },
  mostly:      { mult: 1.45, label: 'Mostly sedentary + lifting', sub: '<5k steps + strength' },
  light:       { mult: 1.65, label: 'Lightly active + lifting', sub: '5–10k steps + strength' },
  active:      { mult: 1.85, label: 'Active + lifting', sub: '10–15k steps + strength' },
  veryactive:  { mult: 2.05, label: 'Highly active + lifting', sub: '15k+ steps + strength' },
};

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

  const mult = (ACTIVITY[input.activity] || ACTIVITY.light).mult;
  const tdee = bmr * mult;

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
    proteinPerLb, activity: input.activity, goal: input.goal, rate: input.rate,
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
  ACTIVITY, GOALS, CUT_RATES, GAIN_RATES, calcTargets,
  loadTargets, saveTargets, loadFood, saveFood, foodForDay, addFood, updateFood, removeFood,
  dayTotals, openMealQuestions, todayKey: todayKey,
  loadNipsToday, setNipsToday,
  loadAlcoholKcal, setAlcoholKcal, addAlcoholKcal,
});

export { ACTIVITY, ALC_KCAL_KEY, CUT_RATES, FOOD_KEY, GAIN_RATES, GOALS, KCAL_PER_LB, LB_PER_KG, NIPS_KEY, TARGETS_KEY, addAlcoholKcal, addFood, calcTargets, dayTotals, foodForDay, loadAlcoholKcal, loadFood, loadNipsToday, loadTargets, openMealQuestions, removeFood, saveFood, saveTargets, setAlcoholKcal, setNipsToday, todayKey, updateFood };

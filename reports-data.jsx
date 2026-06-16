// reports-data.jsx — Derive every Reports section from real check-in history.
// Nothing fabricated: empty windows return empty states, charts build from
// the user's actual logged answers.

function _within(history, days) {
  const cutoff = Date.now() - days * 86400000;
  return history
    .filter((h) => new Date(h.date + 'T12:00:00').getTime() >= cutoff)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function _avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function _mondayKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  const mon = new Date(d.getTime() - dow * 86400000);
  return window.isoDate(mon);
}

// Build the full reports payload for a given timeframe (in days).
function computeReports(history, user, days) {
  const w = _within(history, days);
  const logged = w.length;

  // Pillar series — actual values per logged day
  const sleepVals = w.map((h) => h.answers.sleep).filter((v) => typeof v === 'number');
  const calmVals = w.map((h) => h.answers.calmRating).filter((v) => v > 0);
  const dietVals = w.map((h) => h.answers.dietRating).filter((v) => v > 0);
  const stepVals = w.map((h) => h.answers.steps).filter((v) => typeof v === 'number');

  const pillars = {
    sleep: { points: sleepVals.map((v) => ({ value: v })), mean: _avg(sleepVals), unit: 'h' },
    calm:  { points: calmVals.map((v) => ({ value: v })),  mean: _avg(calmVals) },
    diet:  { points: dietVals.map((v) => ({ value: v })),  mean: _avg(dietVals) },
    steps: { points: stepVals.map((v) => ({ value: v })),  mean: _avg(stepVals) },
  };

  // Radar — averaged normalised metrics across the window
  const m = (key) => _avg(w.map((h) => h.metrics[key] ?? 0));
  const checkinDays = logged;
  const radar = {
    Health: _avg([m('workouts'), m('sleep'), m('steps'), m('diet')]),
    Mental: m('calm'),
    Relationships: m('partner'),
    Spiritual: m('spirit'),
    Consistency: Math.min(1, checkinDays / days),
  };

  // Spirit habit — one cell per calendar day in window
  const spiritByDate = {};
  w.forEach((h) => { spiritByDate[h.date] = !!h.answers.spirit; });
  const spiritPoints = [];
  let spiritDays = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = window.isoDate(d);
    const has = spiritByDate[key];
    if (has) spiritDays++;
    spiritPoints.push({ value: has ? 1 : 0 });
  }

  // AFD — grouped by week (last up to 6 weeks with data)
  const weekMap = {};
  w.forEach((h) => {
    const k = _mondayKey(h.date);
    if (!weekMap[k]) weekMap[k] = { afdCount: 0, nips: 0, days: 0 };
    weekMap[k].days++;
    if (h.answers.afd) weekMap[k].afdCount++;
    else weekMap[k].nips += (h.answers.nips || 0);
  });
  const afdWeeks = Object.keys(weekMap).sort().slice(-6).map((k, i) => ({
    week: `W${i + 1}`,
    afdCount: weekMap[k].afdCount,
    nips: weekMap[k].nips,
  }));

  return {
    logged,
    empty: logged === 0,
    pillars,
    radar,
    spirit: { points: spiritPoints, days: spiritDays, total: logged },
    afdWeeks,
    counts: {
      checkins: logged,
      workouts: w.filter((h) => h.answers.workoutToday).length,
      afds: w.filter((h) => h.answers.afd).length,
      spiritDays,
      avgCalm: _avg(calmVals),
      avgDiet: _avg(dietVals),
    },
  };
}

// Current calendar-month report card from real history.
function computeMonthCard(history, user) {
  const now = new Date();
  const monthName = now.toLocaleString('en-AU', { month: 'long', year: 'numeric' }).toUpperCase();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const inMonth = history.filter((h) => h.date.startsWith(ym));
  const daysElapsed = now.getDate();
  const weeksElapsed = Math.max(1, daysElapsed / 7);
  const calm = inMonth.map((h) => h.answers.calmRating).filter((v) => v > 0);
  const diet = inMonth.map((h) => h.answers.dietRating).filter((v) => v > 0);
  return {
    month: monthName,
    empty: inMonth.length === 0,
    checkinsCompleted: inMonth.length,
    checkinsTarget: daysElapsed,
    workoutsCompleted: inMonth.filter((h) => h.answers.workoutToday).length,
    workoutsTarget: Math.round((user.trainingDays || 3) * weeksElapsed),
    afdsCompleted: inMonth.filter((h) => h.answers.afd).length,
    avgCalm: calm.length ? +(_avg(calm)).toFixed(1) : 0,
    avgDiet: diet.length ? +(_avg(diet)).toFixed(1) : 0,
    spiritDays: inMonth.filter((h) => h.answers.spirit).length,
    prsHit: 0,
  };
}

// Real correlations — only surfaced when there's enough paired data.
function computeCorrelations(history) {
  if (history.length < 8) {
    return {
      ready: false,
      need: Math.max(0, 8 - history.length),
    };
  }
  const sorted = [...history].sort((a, b) => (a.date < b.date ? -1 : 1));
  const insights = [];

  // AFD → next-day calm
  const afterAfd = [], afterDrink = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].answers;
    const calm = sorted[i].answers.calmRating;
    if (!(calm > 0)) continue;
    if (prev.afd) afterAfd.push(calm); else afterDrink.push(calm);
  }
  if (afterAfd.length >= 3 && afterDrink.length >= 3) {
    const a = _avg(afterAfd), b = _avg(afterDrink);
    if (Math.abs(a - b) >= 0.4) {
      insights.push({
        tag: 'AFD × CALM',
        headline: a > b ? 'AFDs lift the next morning.' : 'Drinking days, calmer mornings?',
        body: `Calm averaged ${a.toFixed(1)}/5 the day after an alcohol-free day vs ${b.toFixed(1)}/5 after a drinking day, across your log.`,
      });
    }
  }

  // Sleep → same-day workout intensity
  const goodSleep = [], poorSleep = [];
  sorted.forEach((h) => {
    if (!h.answers.workoutToday || !(h.answers.workoutIntensity > 0)) return;
    if ((h.answers.sleep || 0) >= 7.5) goodSleep.push(h.answers.workoutIntensity);
    else poorSleep.push(h.answers.workoutIntensity);
  });
  if (goodSleep.length >= 3 && poorSleep.length >= 3) {
    const a = _avg(goodSleep), b = _avg(poorSleep);
    if (Math.abs(a - b) >= 0.4) {
      insights.push({
        tag: 'SLEEP × WORKOUT',
        headline: 'Sleep shows up in the session.',
        body: `Workout intensity averaged ${a.toFixed(1)}/5 after 7.5h+ sleep vs ${b.toFixed(1)}/5 on less. Your own numbers.`,
      });
    }
  }

  // Diet → calm
  const cleanDiet = [], poorDiet = [];
  sorted.forEach((h) => {
    if (!(h.answers.calmRating > 0)) return;
    if ((h.answers.dietRating || 0) >= 4) cleanDiet.push(h.answers.calmRating);
    else if ((h.answers.dietRating || 0) > 0) poorDiet.push(h.answers.calmRating);
  });
  if (cleanDiet.length >= 3 && poorDiet.length >= 3) {
    const a = _avg(cleanDiet), b = _avg(poorDiet);
    if (Math.abs(a - b) >= 0.4) {
      insights.push({
        tag: 'DIET × CALM',
        headline: 'Clean days feel steadier.',
        body: `Calm averaged ${a.toFixed(1)}/5 on 4–5 star diet days vs ${b.toFixed(1)}/5 on lower. Worth noticing.`,
      });
    }
  }

  return { ready: true, insights };
}

// Weight trend from stored Friday weigh-ins (plus onboarding start point).
const WEIGHINS_KEY = 'compound:weighins';
function loadWeighins() {
  try { return JSON.parse(localStorage.getItem(WEIGHINS_KEY) || '[]'); } catch (e) { return []; }
}

Object.assign(window, { computeReports, computeMonthCard, computeCorrelations, loadWeighins });

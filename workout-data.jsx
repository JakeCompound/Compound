// workout-data.jsx — Exercise library, AI-style generator, 1RM helper, demo session history

// ── Exercise library ─────────────────────────────────────────────────────
// type: weighted | bodyweight | cardio
// primary: prime mover(s) | groups: primary + secondary | equip: 'home' (BW) | 'gym'
// gear: Reeplex CBT-PRO90 (cables 180kg combined, Smith, rack, pull-up bar, lat/row stations),
//       adjustable bench, 7ft barbell + 100kg plates, dumbbells 5–35kg.
const EXERCISES = [
  // ── CHEST ──
  { id: 'bench',       name: 'Bench Press',            type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Triceps'],     equip: 'gym',  tracked1RM: 'bench', compound: true },
  { id: 'smithbench',  name: 'Smith Bench Press',      type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Triceps'],     equip: 'gym',  compound: true },
  { id: 'inclbench',   name: 'Incline DB Press',       type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Shoulders'],   equip: 'gym',  compound: true },
  { id: 'dbbench',     name: 'DB Bench Press',         type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Triceps'],     equip: 'gym',  compound: true },
  { id: 'cablecross',  name: 'Cable Crossover',        type: 'weighted',   primary: ['Chest'],     groups: ['Chest'],               equip: 'gym' },
  { id: 'cablefly',    name: 'Cable Fly (mid)',        type: 'weighted',   primary: ['Chest'],     groups: ['Chest'],               equip: 'gym' },
  { id: 'lowhighfly',  name: 'Low-to-High Cable Fly',  type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Shoulders'],   equip: 'gym' },
  { id: 'dbfly',       name: 'Dumbbell Fly',           type: 'weighted',   primary: ['Chest'],     groups: ['Chest'],               equip: 'gym' },
  { id: 'dbpullover',  name: 'Dumbbell Pullover',      type: 'weighted',   primary: ['Chest'],     groups: ['Chest','Back'],        equip: 'gym' },
  { id: 'pushup',      name: 'Push-ups',               type: 'bodyweight', primary: ['Chest'],     groups: ['Chest','Triceps','Core'], equip: 'home', compound: true },

  // ── BACK ──
  { id: 'pulldown',    name: 'Lat Pulldown',           type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym',  tracked1RM: 'pulldown', compound: true },
  { id: 'row',         name: 'Seated Cable Row',       type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym',  tracked1RM: 'row', compound: true },
  { id: 'sarmrow',     name: 'Single-arm Cable Row',   type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym' },
  { id: 'deadlift',    name: 'Barbell Deadlift',       type: 'weighted',   primary: ['Back','Legs'], groups: ['Back','Legs'],       equip: 'gym',  compound: true },
  { id: 'barrow',      name: 'Bent-over Barbell Row',  type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym',  compound: true },
  { id: 'smithrow',    name: 'Smith Machine Row',      type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym',  compound: true },
  { id: 'dbrow',       name: 'Single-arm DB Row',      type: 'weighted',   primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'gym',  compound: true },
  { id: 'straightarm', name: 'Straight-arm Pulldown',  type: 'weighted',   primary: ['Back'],      groups: ['Back'],                equip: 'gym' },
  { id: 'facepull',    name: 'Face Pull',              type: 'weighted',   primary: ['Back'],      groups: ['Back','Shoulders'],    equip: 'gym' },
  { id: 'pullup',      name: 'Pull-ups',               type: 'bodyweight', primary: ['Back'],      groups: ['Back','Biceps'],       equip: 'home', compound: true },

  // ── SHOULDERS ──
  { id: 'ohp',         name: 'Barbell Overhead Press', type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders','Triceps'], equip: 'gym',  tracked1RM: 'shoulder', compound: true },
  { id: 'smithohp',    name: 'Smith Overhead Press',   type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders','Triceps'], equip: 'gym',  compound: true },
  { id: 'dbpress',     name: 'Seated DB Shoulder Press', type: 'weighted', primary: ['Shoulders'], groups: ['Shoulders','Triceps'], equip: 'gym',  compound: true },
  { id: 'arnold',      name: 'Arnold Press',           type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders','Triceps'], equip: 'gym' },
  { id: 'lateral',     name: 'DB Lateral Raise',       type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders'],           equip: 'gym' },
  { id: 'cablelat',    name: 'Cable Lateral Raise',    type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders'],           equip: 'gym' },
  { id: 'reardelt',    name: 'Rear-delt Fly',          type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders','Back'],    equip: 'gym' },
  { id: 'shrug',       name: 'Dumbbell Shrug',         type: 'weighted',   primary: ['Shoulders'], groups: ['Shoulders','Back'],    equip: 'gym' },
  { id: 'pikepu',      name: 'Pike Push-ups',          type: 'bodyweight', primary: ['Shoulders'], groups: ['Shoulders','Triceps'], equip: 'home' },

  // ── BICEPS ──
  { id: 'curl',        name: 'Barbell Curl',           type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym',  tracked1RM: 'curl' },
  { id: 'dbcurl',      name: 'Dumbbell Curl',          type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'cablecurl',   name: 'Cable Curl',             type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'hammer',      name: 'Hammer Curl',            type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'inclcurl',    name: 'Incline DB Curl',        type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'bayesian',    name: 'Bayesian Cable Curl',    type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'concentr',    name: 'Concentration Curl',     type: 'weighted',   primary: ['Biceps'],    groups: ['Biceps'],              equip: 'gym' },
  { id: 'chinup',      name: 'Chin-ups',               type: 'bodyweight', primary: ['Biceps','Back'], groups: ['Biceps','Back'],   equip: 'home', compound: true },

  // ── TRICEPS ──
  { id: 'tripress',    name: 'Tricep Pushdown',        type: 'weighted',   primary: ['Triceps'],   groups: ['Triceps'],             equip: 'gym' },
  { id: 'ohtri',       name: 'Overhead Cable Extension', type: 'weighted', primary: ['Triceps'],   groups: ['Triceps'],             equip: 'gym' },
  { id: 'ohdbtri',     name: 'Overhead DB Extension',  type: 'weighted',   primary: ['Triceps'],   groups: ['Triceps'],             equip: 'gym' },
  { id: 'skull',       name: 'Skull Crushers',         type: 'weighted',   primary: ['Triceps'],   groups: ['Triceps'],             equip: 'gym' },
  { id: 'cgbench',     name: 'Close-grip Smith Press', type: 'weighted',   primary: ['Triceps'],   groups: ['Triceps','Chest'],     equip: 'gym',  compound: true },
  { id: 'kickback',    name: 'Cable Kickback',         type: 'weighted',   primary: ['Triceps'],   groups: ['Triceps'],             equip: 'gym' },
  { id: 'dip',         name: 'Dips',                   type: 'bodyweight', primary: ['Triceps'],   groups: ['Triceps','Chest'],     equip: 'home' },
  { id: 'diamondpu',   name: 'Diamond Push-ups',       type: 'bodyweight', primary: ['Triceps'],   groups: ['Triceps','Chest'],     equip: 'home' },

  // ── LEGS ──
  { id: 'squat',       name: 'Back Squat',             type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym',  tracked1RM: 'squat', compound: true },
  { id: 'smithsquat',  name: 'Smith Squat',            type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym',  compound: true },
  { id: 'rdl',         name: 'Romanian Deadlift',      type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Back'],         equip: 'gym',  compound: true },
  { id: 'goblet',      name: 'Goblet Squat',           type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym',  compound: true },
  { id: 'dblunge',     name: 'DB Walking Lunge',       type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym',  compound: true },
  { id: 'bgs',         name: 'Bulgarian Split Squat',  type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym',  compound: true },
  { id: 'stepup',      name: 'DB Step-up',             type: 'weighted',   primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'gym' },
  { id: 'pullthrough', name: 'Cable Pull-through',     type: 'weighted',   primary: ['Legs'],      groups: ['Legs'],                equip: 'gym' },
  { id: 'calf',        name: 'Smith Calf Raise',       type: 'weighted',   primary: ['Legs'],      groups: ['Legs'],                equip: 'gym' },
  { id: 'bwsquat',     name: 'Bodyweight Squat',       type: 'bodyweight', primary: ['Legs'],      groups: ['Legs'],                equip: 'home' },
  { id: 'lunge',       name: 'Walking Lunges',         type: 'bodyweight', primary: ['Legs'],      groups: ['Legs','Core'],         equip: 'home' },

  // ── CORE ──
  { id: 'cablecrunch', name: 'Cable Crunch',           type: 'weighted',   primary: ['Core'],      groups: ['Core'],                equip: 'gym' },
  { id: 'pallof',      name: 'Pallof Press',           type: 'weighted',   primary: ['Core'],      groups: ['Core'],                equip: 'gym' },
  { id: 'woodchop',    name: 'Cable Woodchop',         type: 'weighted',   primary: ['Core'],      groups: ['Core'],                equip: 'gym' },
  { id: 'hangraise',   name: 'Hanging Knee Raise',     type: 'bodyweight', primary: ['Core'],      groups: ['Core'],                equip: 'home' },
  { id: 'declinesit',  name: 'Decline Sit-up',         type: 'bodyweight', primary: ['Core'],      groups: ['Core'],                equip: 'gym' },
  { id: 'plank',       name: 'Plank',                  type: 'bodyweight', primary: ['Core'],      groups: ['Core'],                equip: 'home', isHold: true },
  { id: 'hollow',      name: 'Hollow Hold',            type: 'bodyweight', primary: ['Core'],      groups: ['Core'],                equip: 'home', isHold: true },

  // ── CARDIO / FULL BODY ──
  { id: 'burpee',      name: 'Burpees',                type: 'bodyweight', primary: ['Full Body','Cardio'], groups: ['Full Body','Cardio'], equip: 'home' },
  { id: 'mtnclimb',    name: 'Mountain Climbers',      type: 'bodyweight', primary: ['Core'],      groups: ['Core','Cardio'],       equip: 'home' },
];

const MUSCLE_GROUP_OPTIONS = ['Chest', 'Triceps', 'Biceps', 'Back', 'Legs', 'Core', 'Shoulders', 'Cardio', 'Full Body'];

// Mapping the 6 tracked lifts ↔ display
const TRACKED_LIFTS = [
  { key: 'bench',    label: 'Bench Press' },
  { key: 'shoulder', label: 'Overhead Press' },
  { key: 'squat',    label: 'Back Squat' },
  { key: 'curl',     label: 'Barbell Curl' },
  { key: 'pulldown', label: 'Lat Pulldown' },
  { key: 'row',      label: 'Seated Cable Row' },
];

// ── 1RM helpers (Epley w/ RIR adjustment) ───────────────────────────────
function calc1RM(weight, reps, rir = 0) {
  // Effective reps = reps + RIR (assume could've done that many more)
  const eff = reps + rir;
  return Math.round(weight * (1 + eff / 30) * 10) / 10;
}

// Pick exercises for a session based on inputs.
// Prioritises PRIMARY-mover matches so an "arms" day gets curls & pushdowns,
// not bench (chest) or rows (back) where arms are only secondary movers.
function generateSession({ location, durationMin, groups, preFeel }) {
  const equipOk = (e) => location === 'gym' ? true : (e.equip === 'home' || e.equip === 'both');
  const wantedGroups = groups.length ? groups : ['Full Body'];

  const primaryCount = (e) => e.primary.filter((g) => wantedGroups.includes(g)).length;
  const secondaryCount = (e) => e.groups.filter((g) => wantedGroups.includes(g) && !e.primary.includes(g)).length;
  // Prefer equipment-appropriate movements: gym → weighted, home → bodyweight.
  const equipPref = (e) => location === 'gym' ? (e.type === 'weighted' ? 1 : 0) : (e.type !== 'weighted' ? 1 : 0);
  const rank = (a, b) =>
    (primaryCount(b) - primaryCount(a)) ||
    (equipPref(b) - equipPref(a)) ||
    ((b.compound ? 1 : 0) - (a.compound ? 1 : 0));

  const pool = EXERCISES.filter(equipOk);
  const primaryCands = pool.filter((e) => primaryCount(e) > 0).sort(rank);
  const secondaryCands = pool
    .filter((e) => primaryCount(e) === 0 && secondaryCount(e) > 0)
    .sort((a, b) => secondaryCount(b) - secondaryCount(a));

  // Volume scales realistically with the time available.
  const plan = ({
    10: { exercises: 2, sets: 2 },
    20: { exercises: 3, sets: 3 },
    30: { exercises: 4, sets: 3 },
    60: { exercises: 6, sets: 4 },
  })[durationMin] || { exercises: 4, sets: 3 };

  let setsPerExercise = plan.sets;
  if (preFeel && preFeel <= 2) setsPerExercise = Math.max(2, setsPerExercise - 1);
  if (preFeel === 5 && durationMin >= 30) setsPerExercise += 1;
  const exerciseCount = plan.exercises;

  // Selection — guarantee each wanted group gets at least one PRIMARY exercise,
  // then fill remaining slots with the best-scoring primary movers.
  const picked = [];
  const covered = new Set();
  const pushEx = (e) => {
    if (picked.includes(e) || picked.length >= exerciseCount) return;
    picked.push(e);
    e.primary.forEach((g) => { if (wantedGroups.includes(g)) covered.add(g); });
  };

  // Pass 1: cover each wanted group with a dedicated primary movement
  for (const group of wantedGroups) {
    if (picked.length >= exerciseCount) break;
    if (covered.has(group)) continue;
    const best = primaryCands.find((e) => e.primary.includes(group) && !picked.includes(e));
    if (best) pushEx(best);
  }
  // Pass 2: fill remaining slots with more primary work (variety by id)
  for (const e of primaryCands) {
    if (picked.length >= exerciseCount) break;
    pushEx(e);
  }
  // Pass 3: only if we still couldn't fill, allow secondary-mover exercises
  for (const e of secondaryCands) {
    if (picked.length >= exerciseCount) break;
    pushEx(e);
  }

  // Order: compounds first, isolation after — better session structure.
  picked.sort((a, b) => ((b.compound ? 1 : 0) - (a.compound ? 1 : 0)));

  // Real last-session lookup for AI weight suggestion (falls back to null).
  const history = (window.loadWorkouts ? window.loadWorkouts() : []);
  const lastTop = (id) => {
    const sets = (window.lastSetsFor ? window.lastSetsFor(history, id) : null);
    if (sets && sets.length) {
      const top = sets.reduce((m, s) => (s.w > m.w ? s : m), sets[0]);
      return { weight: top.w, reps: top.r };
    }
    return null;
  };

  return picked.map((e, idx) => {
    const isIsolation = !e.compound;
    const reps = e.isHold ? null : (e.primary.includes('Legs') ? 8 : isIsolation ? 12 : 10);
    const holdSeconds = e.isHold ? 30 : null;
    const last = lastTop(e.id);
    const suggestedWeight =
      e.type === 'weighted' && last ? roundTo(last.weight + (preFeel >= 4 ? 2.5 : 0), 2.5) :
      e.type === 'weighted' ? null : null;

    const sets = Array.from({ length: setsPerExercise }).map(() => ({
      target: reps,
      targetHold: holdSeconds,
      suggested: suggestedWeight,
      weight: suggestedWeight,
      reps: null,
      rir: null,
      complete: false,
      isWarmup: false,
    }));

    // Prepend ONE warmup set — only for heavy compound lifts and only when
    // there's actually time to warm up (20 min+ sessions).
    if (durationMin >= 20 && e.type === 'weighted' && e.compound && e.tracked1RM) {
      sets.unshift({
        target: 8,
        targetHold: null,
        suggested: suggestedWeight ? roundTo(suggestedWeight * 0.6, 2.5) : null,
        weight: suggestedWeight ? roundTo(suggestedWeight * 0.6, 2.5) : null,
        reps: null, rir: null, complete: false, isWarmup: true,
      });
    }

    return {
      id: `${e.id}-${idx}`,
      exId: e.id,
      name: e.name,
      groups: e.groups,
      type: e.type,
      isHold: !!e.isHold,
      tracked1RM: e.tracked1RM,
      sets,
    };
  });
}

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

// Build a single session item for one exercise (used by swap-in-preview).
function buildSessionItem(e, { durationMin = 30, preFeel = 0, idx = 0, setsPerExercise = 3 } = {}) {
  const isIsolation = !e.compound;
  const reps = e.isHold ? null : (e.primary.includes('Legs') ? 8 : isIsolation ? 12 : 10);
  const holdSeconds = e.isHold ? 30 : null;
  const history = (window.loadWorkouts ? window.loadWorkouts() : []);
  let last = null;
  const sets0 = (window.lastSetsFor ? window.lastSetsFor(history, e.id) : null);
  if (sets0 && sets0.length) { const top = sets0.reduce((m, s) => (s.w > m.w ? s : m), sets0[0]); last = { weight: top.w, reps: top.r }; }
  const suggestedWeight = e.type === 'weighted' && last ? roundTo(last.weight + (preFeel >= 4 ? 2.5 : 0), 2.5) : null;
  const sets = Array.from({ length: setsPerExercise }).map(() => ({
    target: reps, targetHold: holdSeconds, suggested: suggestedWeight, weight: suggestedWeight,
    reps: null, rir: null, complete: false, isWarmup: false,
  }));
  if (durationMin >= 20 && e.type === 'weighted' && e.compound && e.tracked1RM) {
    sets.unshift({ target: 8, targetHold: null, suggested: suggestedWeight ? roundTo(suggestedWeight * 0.6, 2.5) : null, weight: suggestedWeight ? roundTo(suggestedWeight * 0.6, 2.5) : null, reps: null, rir: null, complete: false, isWarmup: true });
  }
  return { id: `${e.id}-${idx}-${Date.now() % 100000}`, exId: e.id, name: e.name, groups: e.groups, type: e.type, isHold: !!e.isHold, tracked1RM: e.tracked1RM, sets };
}

// Exercises that train the same primary mover & fit the location — for swapping.
function similarExercises(exId, location) {
  const cur = EXERCISES.find((e) => e.id === exId);
  if (!cur) return [];
  const equipOk = (e) => location === 'gym' ? true : (e.equip === 'home' || e.equip === 'both');
  return EXERCISES.filter((e) =>
    e.id !== exId && equipOk(e) &&
    e.primary.some((p) => cur.primary.includes(p))
  ).sort((a, b) => ((b.compound ? 1 : 0) - (a.compound ? 1 : 0)));
}

// ── Demo workout history (for dashboard charts and Past Workouts) ────────
const DEMO_HISTORY = [
  { id: 'h1', date: 'YESTERDAY', day: 'TUE',  duration: 42, groups: ['Chest','Triceps'],   volume: 4280, feeling: 4, prs: [], exercises: 5 },
  { id: 'h2', date: '3 DAYS AGO', day: 'SUN', duration: 36, groups: ['Legs','Core'],       volume: 5610, feeling: 5, prs: ['squat'], exercises: 5 },
  { id: 'h3', date: '4 DAYS AGO', day: 'SAT', duration: 28, groups: ['Back','Biceps'],     volume: 3920, feeling: 3, prs: [], exercises: 4 },
  { id: 'h4', date: '6 DAYS AGO', day: 'THU', duration: 45, groups: ['Chest','Shoulders'], volume: 4520, feeling: 4, prs: [], exercises: 5 },
  { id: 'h5', date: 'LAST WEEK',  day: 'MON', duration: 32, groups: ['Full Body'],          volume: 3100, feeling: 3, prs: [], exercises: 4 },
  { id: 'h6', date: '9 DAYS AGO', day: 'SAT', duration: 50, groups: ['Legs'],               volume: 5200, feeling: 5, prs: ['squat'], exercises: 5 },
  { id: 'h7', date: '11 DAYS AGO',day: 'THU', duration: 38, groups: ['Chest'],              volume: 4100, feeling: 4, prs: [], exercises: 5 },
];

// 1RM trend per lift — last 12 weeks, in kg
const DEMO_1RM_HISTORY = {
  bench:    [78, 78, 80, 80, 80, 82.5, 82.5, 82.5, 85, 85, 85, 87.5],
  shoulder: [42.5, 45, 45, 45, 47.5, 47.5, 47.5, 50, 50, 50, 50, 52.5],
  squat:    [90, 90, 92.5, 95, 95, 97.5, 100, 100, 102.5, 102.5, 105, 107.5],
  curl:     [14, 14, 16, 16, 16, 18, 18, 18, 18, 20, 20, 20],
  pulldown: [60, 62.5, 62.5, 65, 65, 65, 67.5, 67.5, 70, 70, 70, 72.5],
  row:      [62.5, 65, 65, 67.5, 67.5, 70, 70, 72.5, 72.5, 72.5, 75, 75],
};

// Personal records table
const DEMO_PBS = [
  { lift: 'Squat',           weight: 107.5, when: '3 days ago', estimated: true },
  { lift: 'Flat Bench',      weight: 87.5,  when: '2 weeks ago', estimated: true },
  { lift: 'Shoulder Press',  weight: 52.5,  when: '1 week ago', estimated: true },
  { lift: 'Lat Pulldown',    weight: 72.5,  when: '4 days ago', estimated: true },
  { lift: 'Seated Row',      weight: 75,    when: '1 week ago', estimated: true },
  { lift: 'Bicep Curl',      weight: 20,    when: '5 days ago', estimated: true },
];

// Body heatmap recovery — green / amber / red per group
const DEMO_HEATMAP = {
  Chest: 'red',      // worked hard recently
  Triceps: 'amber',
  Back: 'amber',
  Biceps: 'amber',
  Legs: 'green',
  Shoulders: 'green',
  Core: 'amber',
};

// Weekly plan suggestion (matches user's training days)
function makeWeeklyPlan(trainingDays) {
  const splits = {
    3: [
      { day: 'MON', label: 'Push', focus: 'Chest · Shoulders · Triceps', est: 45 },
      { day: 'WED', label: 'Pull', focus: 'Back · Biceps', est: 45 },
      { day: 'FRI', label: 'Legs', focus: 'Quads · Hams · Glutes · Core', est: 50 },
    ],
    4: [
      { day: 'MON', label: 'Upper A', focus: 'Chest · Back · Arms', est: 45 },
      { day: 'TUE', label: 'Lower A', focus: 'Squat focus · Core', est: 50 },
      { day: 'THU', label: 'Upper B', focus: 'Shoulders · Back · Arms', est: 45 },
      { day: 'SAT', label: 'Lower B', focus: 'Hinge focus · Core', est: 50 },
    ],
    5: [
      { day: 'MON', label: 'Chest', focus: 'Chest · Tris', est: 45 },
      { day: 'TUE', label: 'Back',  focus: 'Back · Bis', est: 45 },
      { day: 'WED', label: 'Legs',  focus: 'Quad focus', est: 50 },
      { day: 'FRI', label: 'Shldr', focus: 'Shoulders · Arms', est: 40 },
      { day: 'SAT', label: 'Legs',  focus: 'Hinge · Core', est: 50 },
    ],
  };
  const days = splits[trainingDays] || splits[3];
  return days;
}

Object.assign(window, {
  EXERCISES, MUSCLE_GROUP_OPTIONS, TRACKED_LIFTS,
  calc1RM, generateSession, roundTo, buildSessionItem, similarExercises,
  DEMO_HISTORY, DEMO_1RM_HISTORY, DEMO_PBS, DEMO_HEATMAP, makeWeeklyPlan,
});

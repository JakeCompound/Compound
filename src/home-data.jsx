// home-data.jsx — Demo state, life score logic, derived metrics

// Three preset day-states the user can toggle in Tweaks
const DEMO_STATES = {
  fresh: {
    label: 'DAY 01',
    greeting: 'First day in.',
    dayOfWeek: 1, // Tuesday
    weekStartedAt: 'Mon',
    // weekDays: Mon-Sun, each: { checkin, workout, spirit, afd } (null if future)
    weekDays: [
      { day: 'M', checkin: true, workout: true, spirit: true, afd: true, today: false },
      { day: 'T', checkin: false, workout: false, spirit: false, afd: false, today: true },
      { day: 'W', future: true, day_label: 'W' },
      { day: 'T', future: true },
      { day: 'F', future: true },
      { day: 'S', future: true },
      { day: 'S', future: true },
    ],
    streaks: {
      checkin: { current: 1, best: 1, next: 3 },
      workout: { current: 1, best: 1, next: 3 },
      spirit: { current: 1, best: 1, next: 3 },
      afd: { current: 1, best: 1, next: 3 },
    },
    todayCheckinDone: false,
    workoutsTarget: 3,
    workoutsDone: 1,
    daysLeftInWeek: 5,
    // radar 0-1 per axis
    radar: { Health: 0.32, Mental: 0.40, Relationships: 0.45, Spiritual: 0.30, Consistency: 0.15 },
    // metrics used for score
    metrics: { workouts: 0.33, sleep: 0.4, calm: 0.6, diet: 0.6, afd: 1.0, spirit: 1.0 },
    insight: {
      tag: 'WELCOME',
      title: 'First check-in tonight.',
      body: 'Show up. That alone takes you from 0 → 1. Everything else stacks from there.',
    },
  },
  midweek: {
    label: 'THU',
    greeting: 'Halfway through.',
    dayOfWeek: 4,
    weekDays: [
      { day: 'M', checkin: true, workout: true, spirit: true, afd: true },
      { day: 'T', checkin: true, workout: false, spirit: true, afd: true },
      { day: 'W', checkin: true, workout: true, spirit: false, afd: false },
      { day: 'T', checkin: false, workout: false, spirit: false, afd: false, today: true },
      { day: 'F', future: true },
      { day: 'S', future: true },
      { day: 'S', future: true },
    ],
    streaks: {
      checkin: { current: 11, best: 18, next: 14 },
      workout: { current: 6, best: 22, next: 7 },
      spirit: { current: 2, best: 14, next: 7 },
      afd: { current: 0, best: 5, next: 1 },
    },
    todayCheckinDone: false,
    workoutsTarget: 3,
    workoutsDone: 2,
    daysLeftInWeek: 4,
    radar: { Health: 0.68, Mental: 0.62, Relationships: 0.55, Spiritual: 0.50, Consistency: 0.72 },
    metrics: { workouts: 0.66, sleep: 0.78, calm: 0.65, diet: 0.7, afd: 0.66, spirit: 0.66 },
    insight: {
      tag: 'CORRELATION',
      title: 'Sleep + workout = a pattern.',
      body: 'On nights after a workout you slept 0.6h more on average. Worth banking tonight.',
    },
  },
  strong: {
    label: 'FRI',
    greeting: 'Locked in.',
    dayOfWeek: 5,
    weekDays: [
      { day: 'M', checkin: true, workout: true, spirit: true, afd: true },
      { day: 'T', checkin: true, workout: false, spirit: true, afd: true },
      { day: 'W', checkin: true, workout: true, spirit: true, afd: true },
      { day: 'T', checkin: true, workout: false, spirit: true, afd: true },
      { day: 'F', checkin: false, workout: false, spirit: false, afd: false, today: true },
      { day: 'S', future: true },
      { day: 'S', future: true },
    ],
    streaks: {
      checkin: { current: 27, best: 27, next: 30 },
      workout: { current: 14, best: 22, next: 21 },
      spirit: { current: 9, best: 14, next: 14 },
      afd: { current: 12, best: 12, next: 14 },
    },
    todayCheckinDone: false,
    workoutsTarget: 3,
    workoutsDone: 2,
    daysLeftInWeek: 3,
    radar: { Health: 0.86, Mental: 0.82, Relationships: 0.78, Spiritual: 0.92, Consistency: 0.95 },
    metrics: { workouts: 0.85, sleep: 0.9, calm: 0.85, diet: 0.85, afd: 1.0, spirit: 0.92 },
    insight: {
      tag: 'PB ALERT',
      title: 'Bench 87.5kg estimate. Up 2.5kg this month.',
      body: 'Three sessions in a row at 8 reps. The math says today is a good day to test.',
    },
  },
};

// Life Score: 25% workouts, 20% sleep, 20% calm, 20% diet, 15% AFD/spirit blend
function computeLifeScore(metrics) {
  const w = 0.25 * metrics.workouts
    + 0.20 * metrics.sleep
    + 0.20 * metrics.calm
    + 0.20 * metrics.diet
    + 0.075 * metrics.afd
    + 0.075 * metrics.spirit;
  return Math.round(w * 100);
}

function getTodayCopy(dayOfWeek) {
  const longDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek];
  const date = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return {
    day: longDay,
    dateLabel: `${date.getDate()} ${months[date.getMonth()].toUpperCase()}`,
  };
}

Object.assign(window, { DEMO_STATES, computeLifeScore, getTodayCopy });

export { DEMO_STATES, computeLifeScore, getTodayCopy };

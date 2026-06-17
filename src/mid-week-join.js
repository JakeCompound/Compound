// mid-week-join.js — gentle onboarding for people who join partway through a week.
//
// The week runs Sunday→Saturday. Someone who joins on, say, Wednesday shouldn't
// be told they're "behind" on workouts for a week they only caught the tail of.
// So we record their join date and treat everything up to the FIRST Sunday after
// joining as a grace period: urgency/pressure UI is held back, a welcome banner
// explains that "full tracking kicks in Sunday", and the normal habit-building
// reminders (check-in, weigh-in, workout) keep firing as usual.

const JOIN_KEY = 'compound:joinedAt';

// Record the join date once, at first onboarding completion. Returning users who
// predate this feature simply never get a joinedAt → treated as a full member.
export function markJoined() {
  try { if (!localStorage.getItem(JOIN_KEY)) localStorage.setItem(JOIN_KEY, new Date().toISOString()); } catch (e) {}
}

export function getJoinedAt() {
  try { const v = localStorage.getItem(JOIN_KEY); return v ? new Date(v) : null; } catch (e) { return null; }
}

const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// The first Sunday on or after a date. If the date IS a Sunday, that's it
// (joining on Sunday means a full week from the start — no grace period).
function firstSundayOnAfter(d) {
  const x = atMidnight(d);
  const dow = x.getDay(); // 0 = Sun
  if (dow !== 0) x.setDate(x.getDate() + (7 - dow));
  return x;
}

// Start of the user's first FULL week. null if we have no join date.
export function firstFullWeekStart() {
  const j = getJoinedAt();
  return j ? firstSundayOnAfter(j) : null;
}

// True while the user is still in the partial week they joined in (before their
// first Sunday). False for full members and for anyone with no recorded join.
export function isFirstWeekPostJoin(now = new Date()) {
  const start = firstFullWeekStart();
  if (!start) return false;
  return atMidnight(now) < start;
}

// alcohol.js — single source of truth for "is alcohol tracking on?".
//
// Every alcohol surface (nips counter, alcohol AddRow, nutrition Alcohol line,
// reports nips ring, check-in AFD/nips step, alcohol-gated badges) guards on
// this one predicate instead of scattering checks. Item 1 (onboarding opt-in +
// Settings toggle) writes `user.trackAlcohol`; until a user explicitly turns it
// OFF we treat it as ON, which preserves the app's existing behaviour.
export function alcoholOn(user) {
  return !user || user.trackAlcohol !== false;
}

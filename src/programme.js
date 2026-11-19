// programme.js — client-side storage + helpers for preset programmes.
//
//   compound:programmes    [programme]           → programmes table (own rows only)
//   compound:programmeDays { [date]: dayData }   → programme_days table (own rows only)
//
// Both are private to the signed-in account: no coach access, never on the
// ladder. The nightly Reset answers live here too, NOT in compound:checkins
// (which coaches can read). Pure schedule / streak logic is in programme-core.js.
import React from 'react';
import {
  RESET_DAYS, inProgramme, makeResetProgramme, planFor, suggestFor,
} from './programme-core.js';

export const PROGRAMMES_KEY = 'compound:programmes';
export const PROGRAMME_DAYS_KEY = 'compound:programmeDays';
export const PROGRAMME_EVENT = 'compound:programme';

const J = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } };
const ping = () => { try { window.dispatchEvent(new CustomEvent(PROGRAMME_EVENT)); } catch (e) {} };

export const todayKey = () => (window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0, 10));

export function loadProgrammes() { return J(PROGRAMMES_KEY, []); }
export function saveProgrammes(list) { localStorage.setItem(PROGRAMMES_KEY, JSON.stringify(list)); ping(); }
export function activeProgramme() { return loadProgrammes().find((p) => p.status === 'active') || null; }
export function updateProgramme(id, patch) {
  const list = loadProgrammes().map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveProgrammes(list);
  return list.find((p) => p.id === id);
}
export function startReset(startDate, lengthDays = 21) {
  const list = loadProgrammes().filter((p) => p.status !== 'active' || p.id === 'reset-' + startDate);
  if (list.find((p) => p.id === 'reset-' + startDate)) return list.find((p) => p.id === 'reset-' + startDate);
  const p = makeResetProgramme(startDate, lengthDays);
  if (startDate === todayKey() && new Date().getHours() >= 12) p.afternoonStart = true;
  saveProgrammes([...list, p]);
  return p;
}

export function loadProgrammeDays() { return J(PROGRAMME_DAYS_KEY, {}); }
export function getProgrammeDay(date) { return loadProgrammeDays()[date] || {}; }
export function patchProgrammeDay(date, patch) {
  const all = loadProgrammeDays();
  const cur = all[date] || {};
  all[date] = { ...cur, ...patch, night: patch.night ? { ...(cur.night || {}), ...patch.night } : cur.night };
  if (all[date].night === undefined) delete all[date].night;
  localStorage.setItem(PROGRAMME_DAYS_KEY, JSON.stringify(all));
  ping();
  return all[date];
}

// Everything the core logic needs, read fresh from local storage.
export function programmeCtx() {
  const workouts = window.loadWorkouts ? window.loadWorkouts() : [];
  const liftDates = new Set(workouts.filter((w) => w && w.date && !w.cardio).map((w) => w.date));
  const runDates = new Set(workouts.filter((w) => w && w.cardio && /run|jog/i.test(w.name || '')).map((w) => w.date));
  let checkins = [];
  try { checkins = JSON.parse(localStorage.getItem('compound:checkins') || '[]'); } catch (e) {}
  return {
    days: loadProgrammeDays(),
    now: (() => { const n = new Date(); return { date: todayKey(), hhmm: `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}` }; })(),
    liftDates,
    runDates,
    checkinDates: new Set(checkins.map((c) => c.date)),
    stepsOn: (d) => { try { return window.dayStepTotal ? window.dayStepTotal(d) : 0; } catch (e) { return 0; } },
    nipsOn: (d) => { try { return window.loadNipsToday ? window.loadNipsToday(d) : null; } catch (e) { return null; } },
  };
}

// React hook: re-render on any programme write (this tab) or storage change.
export function useProgramme() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(PROGRAMME_EVENT, bump);
    window.addEventListener('storage', bump);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener(PROGRAMME_EVENT, bump);
      window.removeEventListener('storage', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);
  return activeProgramme();
}

// The Miracle Morning screen shows on open until today's is done.
export function morningPending(p, date = todayKey()) {
  if (!p || p.status !== 'active' || !inProgramme(p, date)) return false;
  const d = getProgrammeDay(date);
  return !d.morningDoneAt;
}

// Build a live-session exercise list for Day A/B/C with progression baked in.
export function buildProgrammeSession(dayKey) {
  const def = RESET_DAYS[dayKey];
  if (!def) return [];
  const lib = window.allExercises ? window.allExercises() : [];
  const history = window.loadWorkouts ? window.loadWorkouts() : [];
  return def.lifts.map((lift, idx) => {
    const ex = lib.find((e) => e.id === lift.exId);
    if (!ex) return null;
    const last = window.lastSetsFor ? window.lastSetsFor(history, ex.id) : null;
    const sug = suggestFor(lift, last);
    const weighted = ex.type === 'weighted';
    const sets = Array.from({ length: lift.sets }).map(() => ({
      target: sug.reps, targetHold: null,
      suggested: weighted ? sug.weight : null, weight: weighted ? sug.weight : null,
      reps: null, rir: null, complete: false, isWarmup: false,
    }));
    const range = lift.lo === lift.hi ? `${lift.lo}` : `${lift.lo}-${lift.hi}`;
    return {
      id: `${ex.id}-${idx}-${Date.now() % 100000}`,
      exId: ex.id, name: ex.name, groups: ex.groups, type: ex.type, isHold: false, tracked1RM: ex.tracked1RM,
      repRange: range + (lift.note ? ` · ${lift.note}` : ''),
      note: last ? '' : 'Week 1: leave 2 reps in the tank.',
      sets,
    };
  }).filter(Boolean);
}

export function programmeSessionConfig(p, dayKey) {
  return { location: 'gym', duration: 60, groups: [], preFeel: 0, restSec: 75, programme: { id: p.id, day: dayKey, name: RESET_DAYS[dayKey].name } };
}

// Today's plan, plus whether it's done.
export function todayPlan(p, date = todayKey()) {
  const ctx = programmeCtx();
  return { ...planFor(p, date, ctx.liftDates), ctx };
}

// Exposed so other modules (to-do list, check-in) can ask without imports.
Object.assign(window, { activeProgramme, programmeCtx, getProgrammeDay, patchProgrammeDay });

export { startReset as startResetProgramme };

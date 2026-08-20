import React from 'react';
import { C } from './compound-ui.jsx';
import { isJoinDay, getJoinedAt } from './mid-week-join.js';

// todo-list.jsx — "Today's To-Do List" for Home.
// Tasks with live countdowns; turn red on expiry, count into the negatives,
// and after 3h missed they ask the user for a reason. Refreshes daily.

const TODO_STATE_KEY = 'compound:todostate'; // per-day: { [date]: { [todoId]: { reason } } }
const MISS_GRACE_MS = 3 * 60 * 60 * 1000; // 3 hours past due before "missed + ask why"

const MISS_REASONS = ['Bored', 'Tired', 'Stressed', 'Hungry', 'Automatic', 'Forgot'];

const dayStepBtn = { width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.line}`, background: C.surf1, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, lineHeight: 1, cursor: 'pointer', flexShrink: 0 };

function loadTodoState() {
  try { return JSON.parse(localStorage.getItem(TODO_STATE_KEY) || '{}'); } catch (e) { return {}; }
}
function saveTodoReason(dateKey, todoId, reason) {
  const all = loadTodoState();
  if (!all[dateKey]) all[dateKey] = {};
  all[dateKey][todoId] = { reason };
  try { localStorage.setItem(TODO_STATE_KEY, JSON.stringify(all)); } catch (e) {}
}
function getTodoReason(dateKey, todoId) {
  const all = loadTodoState();
  return all[dateKey] && all[dateKey][todoId] ? all[dateKey][todoId].reason : null;
}

// Parse "HH:MM" into a Date for today.
function dueToday(hhmm) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function scheduledWorkoutDays(user) {
  if (Array.isArray(user.workoutDays) && user.workoutDays.length) return user.workoutDays;
  const n = user.trainingDays || 3;
  const map = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 6], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
  return map[n] || [1, 3, 5];
}

const WORKOUT_WEEK_KEY = 'compound:workoutWeek';
// Start (Sunday) of the current week — the week runs Sun → Sat.
function weekStartKey() {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = today.getDay(); // 0 = Sunday
  const sun = new Date(today.getTime() - dow * 86400000);
  return window.isoDate ? window.isoDate(sun) : sun.toISOString().slice(0, 10);
}
function loadWeekOverride() {
  try {
    const all = JSON.parse(localStorage.getItem(WORKOUT_WEEK_KEY) || '{}');
    return all[weekStartKey()] || null;
  } catch (e) { return null; }
}
function saveWeekOverride(days) {
  try {
    const all = JSON.parse(localStorage.getItem(WORKOUT_WEEK_KEY) || '{}');
    all[weekStartKey()] = days;
    localStorage.setItem(WORKOUT_WEEK_KEY, JSON.stringify(all));
  } catch (e) {}
}
// position within the Sun→Sat week (0=Sun … 6=Sat)
const weekPos = (dow) => dow;
const DAY_LABELS = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' };

// Postpone log — per week: how many times a workout has been pushed, with reasons.
// After >4 in a week we offer to swap the troublesome day permanently.
const POSTPONE_KEY = 'compound:workoutPostpones'; // { [weekStart]: [{ from, to, reason, ts }] }
const POSTPONE_SWAP_THRESHOLD = 4;
function loadPostpones() { try { return JSON.parse(localStorage.getItem(POSTPONE_KEY) || '{}'); } catch (e) { return {}; } }
function weekPostpones() { return loadPostpones()[weekStartKey()] || []; }
function addPostpone(entry) {
  const all = loadPostpones();
  const k = weekStartKey();
  all[k] = [...(all[k] || []), entry];
  try { localStorage.setItem(POSTPONE_KEY, JSON.stringify(all)); } catch (e) {}
  return all[k];
}

// The earliest date the day-stepper (and any catch-up) will go back to —
// nothing meaningful exists before the user joined.
function earliestBrowsableDate() {
  const joined = getJoinedAt();
  return joined ? (window.isoDate ? window.isoDate(joined) : joined.toISOString().slice(0, 10)) : null;
}

function TodayTodos({ user, set, state, history, weighins, onOpenCheckin, onCatchUpCheckin, onWeighIn, onLogWeighFor, onGoWorkout, onGoNutrition, onChanged, weighDoneToday }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => setInterval && id && clearInterval(id);
  }, []);

  const todayKey = window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0, 10);
  const dateKey = todayKey;

  // Bumped when a missed-reason is saved so the acknowledged row drops out
  // immediately (the filter below re-reads localStorage on every render).
  const [, setReasonTick] = React.useState(0);

  // Day-stepper — browse back to see (and catch up on) any earlier day's
  // to-dos, not just today's. Local to this card, so it always resets to
  // today when Home is left and come back to (the component remounts).
  const [viewDate, setViewDate] = React.useState(null); // null = today
  const day = viewDate || todayKey;
  const onToday = day === todayKey;
  const floor = earliestBrowsableDate();
  const stepDay = (n) => {
    const next = window.shiftDay(day, n);
    if (next > todayKey) return; // no future days
    if (n < 0 && floor && next < floor) return; // nothing before joining
    setViewDate(next === todayKey ? null : next);
  };
  const canGoBack = !floor || window.shiftDay(day, -1) >= floor;

  // Effective schedule for THIS week (base schedule + any in-week override)
  const baseDays = scheduledWorkoutDays(user);
  const [override, setOverride] = React.useState(() => loadWeekOverride());
  const effectiveDays = override || baseDays;

  // Workout — scheduled days only
  const todayDow = new Date().getDay();
  const isWorkoutDay = effectiveDays.includes(todayDow);
  let workoutDoneToday = false;
  try {
    const ws = window.loadWorkouts ? window.loadWorkouts() : [];
    workoutDoneToday = ws.some((w) => w.date === dateKey);
  } catch (e) {}

  // Future scheduled days left this week (for the "take from" swap)
  const futureDays = effectiveDays
    .filter((d) => weekPos(d) > weekPos(todayDow))
    .sort((a, b) => weekPos(a) - weekPos(b));

  const [addSheet, setAddSheet] = React.useState(false);
  const applyOverride = (days) => { setOverride(days); saveWeekOverride(days); };
  const addExtra = () => { applyOverride([...effectiveDays, todayDow]); setAddSheet(false); onGoWorkout && onGoWorkout(); };
  const swapFrom = (fromDow) => { applyOverride([...effectiveDays.filter((d) => d !== fromDow), todayDow]); setAddSheet(false); onGoWorkout && onGoWorkout(); };

  // Postpone today's workout → a free future day this week (not already a workout day).
  const [postponeOpen, setPostponeOpen] = React.useState(false);
  const [swapOffer, setSwapOffer] = React.useState(null); // { to } once postponed >4× this week
  const postponeTargets = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => weekPos(d) > weekPos(todayDow) && !effectiveDays.includes(d));
  const doPostpone = (toDay, reason) => {
    applyOverride([...effectiveDays.filter((d) => d !== todayDow), toDay].sort((a, b) => weekPos(a) - weekPos(b)));
    addPostpone({ from: todayDow, to: toDay, reason, ts: Date.now() });
    setPostponeOpen(false);
    if (weekPostpones().length > POSTPONE_SWAP_THRESHOLD) setSwapOffer({ to: toDay });
    onChanged && onChanged();
  };
  const acceptSwapDefault = () => {
    if (set && swapOffer) {
      const base = (Array.isArray(user.workoutDays) ? user.workoutDays : baseDays).filter((d) => d !== todayDow);
      const next = [...base, swapOffer.to].sort((a, b) => weekPos(a) - weekPos(b));
      set({ workoutDays: next, trainingDays: next.length });
    }
    setSwapOffer(null);
    onChanged && onChanged();
  };

  // On the join day, defer only the daily weigh-in to tomorrow — its morning
  // slot has usually already passed, so it would show as "missed" straight away.
  // The nightly check-in starts the day the user joins.
  const joinDay = isJoinDay();

  // Weigh-in frequency (Settings → Reminders): 1 = daily … 7 = weekly. A
  // weekly cadence can either float (due N days after the last log) or anchor
  // to a chosen weekday (e.g. "Friday, whenever suits") — the anchored mode
  // is deliberately loose: no clock deadline, and it stays quietly due (never
  // red, never asked "why") until logged, no matter how many Fridays pass.
  const weighEvery = Math.min(7, Math.max(1, user.weighInEveryDays || 1));
  const weighWeekday = weighEvery === 7 && Number.isInteger(user.weighInWeekday) ? user.weighInWeekday : null;
  const weighDue = weighDoneToday || weighEvery === 1 || (() => {
    try {
      const ws = window.loadWeighins ? window.loadWeighins() : JSON.parse(localStorage.getItem('compound:weighins') || '[]');
      if (!ws.length) return true; // never weighed in → due
      const lastDate = ws.reduce((m, w) => (w.date > m ? w.date : m), '');
      if (weighWeekday != null) {
        // Most recent occurrence of the chosen weekday on/before today —
        // due once the last log predates it, however many weeks that spans.
        const today = new Date(dateKey + 'T12:00:00');
        const back = (today.getDay() - weighWeekday + 7) % 7;
        const anchor = new Date(today.getTime() - back * 86400000);
        const anchorKey = window.isoDate ? window.isoDate(anchor) : anchor.toISOString().slice(0, 10);
        return lastDate < anchorKey;
      }
      const days = Math.round((new Date(dateKey + 'T12:00:00') - new Date(lastDate + 'T12:00:00')) / 86400000);
      return days >= weighEvery;
    } catch (e) { return true; }
  })();

  const todos = [
    ...(joinDay || !weighDue ? [] : [{
      id: 'weighin',
      label: 'Weigh-in',
      sub: weighWeekday != null ? `${DAY_LABELS[weighWeekday]} · whenever suits, pre-water` : weighEvery === 1 ? 'Pre-water · one number' : `Every ${weighEvery} days · pre-water`,
      time: user.weighInTime || '06:30',
      done: !!weighDoneToday,
      editable: true,
      // No countdown, no red "missed" state, no "why did you miss it" nag —
      // a long-term habit like this shouldn't feel like a deadline.
      timerless: true,
      dueLabel: weighWeekday != null ? `DUE ${DAY_LABELS[weighWeekday]}` : 'DUE',
      onDo: onWeighIn,
      glyph: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 6 V5 A3 3 0 0 1 13 5 V6" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="12" r="1.2" fill="currentColor" />
        </svg>
      ),
    }]),
    ...(isWorkoutDay ? [{
      id: 'workout',
      label: 'Workout',
      sub: 'Scheduled day · 25 min counts',
      time: (user.workoutTimes || {})[todayDow] || user.workoutTime || '17:00', // per-day override wins
      done: !!workoutDoneToday,
      onDo: onGoWorkout,
      canPostpone: true,
      onPostpone: () => setPostponeOpen(true),
      glyph: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="8" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="19" y="8" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="3.5" y="6" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="15.5" y="6" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="6.5" y="10" width="9" height="2" fill="currentColor" />
        </svg>
      ),
    }] : []),
    {
      id: 'checkin',
      label: 'Daily Check-in',
      sub: '9 quick questions',
      time: user.checkInTime || '21:00',
      done: !!state.todayCheckinDone,
      editable: true,
      // Day one: whatever time the user joined, tonight's check-in stays open
      // instead of flipping to red once their usual slot has passed.
      softDeadline: joinDay,
      onDo: onOpenCheckin,
      glyph: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.6" />
          <line x1="7" y1="3" x2="7" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="15" y1="3" x2="15" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ].sort((a, b) => (a.time < b.time ? -1 : 1))
    // A missed to-do the user has already explained drops off the list — naming
    // the reason is the acknowledgment; no point leaving a red row up all day.
    // (Workouts keep their own Postpone flow.)
    .filter((t) => {
      if (t.done || t.canPostpone || t.softDeadline || t.timerless) return true;
      const missed = now - dueToday(t.time).getTime() > MISS_GRACE_MS;
      return !(missed && getTodoReason(dateKey, t.id));
    });

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div>
      {/* Day-stepper — browse back to see (and catch up on) any earlier day.
          Same idiom as Nutrition's ‹ TODAY › stepper, for a habit Jake already knows. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={() => stepDay(-1)} disabled={!canGoBack} title="Previous day" style={{ ...dayStepBtn, color: canGoBack ? C.text : C.textLow, cursor: canGoBack ? 'pointer' : 'default' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1.2, color: onToday ? C.textLow : C.accent, textTransform: 'uppercase', lineHeight: 1 }}>
            {onToday ? "TODAY'S TO-DO LIST" : (window.prettyDay ? window.prettyDay(day) : day)}
          </div>
          {!onToday && <button onClick={() => setViewDate(null)} style={{ background: 'transparent', border: 0, padding: '3px 0 0', color: C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, cursor: 'pointer' }}>BACK TO TODAY</button>}
        </div>
        <button onClick={() => stepDay(1)} disabled={onToday} title="Next day" style={{ ...dayStepBtn, color: onToday ? C.textLow : C.text, cursor: onToday ? 'default' : 'pointer' }}>›</button>
      </div>

      {!onToday && (
        <HistoricDayCard
          day={day}
          history={history}
          weighins={weighins}
          user={user}
          onLogCheckin={() => onCatchUpCheckin && onCatchUpCheckin(day)}
          onLogWeigh={() => onLogWeighFor && onLogWeighFor(day)}
        />
      )}

      {onToday && (
      <>
      {todos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -2 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1, color: doneCount === todos.length ? C.success : C.accent }}>
            {doneCount}/{todos.length} DONE
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {todos.map((t) => (
          <TodoRow key={t.id} todo={t} now={now} dateKey={dateKey} onReasonSaved={() => setReasonTick((x) => x + 1)} />
        ))}
      </div>

      {/* Join day: the morning weigh-in starts tomorrow — set the tone. */}
      {joinDay && (
        <div style={{ marginTop: todos.length ? 10 : 2, padding: '12px 14px', background: C.surf1, border: `1px dashed ${C.accentDim}`, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>🌱</span>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45 }}>
            Day one — nothing to catch up on. Tonight's <strong style={{ color: C.text }}>check-in</strong> is ready above; your daily <strong style={{ color: C.text }}>weigh-in</strong> starts <strong style={{ color: C.accent }}>tomorrow morning</strong>.
          </div>
        </div>
      )}

      {/* Nutrition Question to-do — appears when the AI has open meal questions */}
      {(() => {
        let n = 0;
        try { n = window.openMealQuestions ? window.openMealQuestions().length : 0; } catch (e) {}
        if (n === 0) return null;
        return (
          <button
            onClick={onGoNutrition}
            style={{
              width: '100%', marginTop: 8, padding: '13px 14px',
              background: C.surf2, border: `1px solid ${C.accentDim}`, borderRadius: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.accent, marginBottom: 2 }}>NO RUSH</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase' }}>Nutrition Question{n > 1 ? 's' : ''}</div>
            </div>
            <span style={{ minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: C.danger, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
          </button>
        );
      })()}

      {/* Add an unscheduled workout to today */}
      {!isWorkoutDay && (
        <button
          onClick={() => setAddSheet(true)}
          style={{
            width: '100%', marginTop: 8, padding: '11px 14px',
            background: 'transparent', border: `1px dashed ${C.lineStrong}`, borderRadius: 12,
            color: C.textMid, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 14,
            letterSpacing: 1.2, textTransform: 'uppercase',
          }}
        >
          <span style={{ color: C.accent, fontSize: 18, lineHeight: 1 }}>+</span>
          Add a workout to today
        </button>
      )}
      </>
      )}

      {addSheet && (
        <AddWorkoutSheet
          futureDays={futureDays}
          onSwap={swapFrom}
          onExtra={addExtra}
          onClose={() => setAddSheet(false)}
        />
      )}

      {postponeOpen && (
        <PostponeSheet
          targets={postponeTargets}
          fromDow={todayDow}
          onConfirm={doPostpone}
          onClose={() => setPostponeOpen(false)}
        />
      )}

      {swapOffer && (
        <SwapDefaultSheet
          toDow={swapOffer.to}
          fromDow={todayDow}
          onAccept={acceptSwapDefault}
          onDecline={() => setSwapOffer(null)}
        />
      )}
    </div>
  );
}

function TodoRow({ todo, now, dateKey, onReasonSaved }) {
  const due = dueToday(todo.time);
  const diff = due.getTime() - now; // >0 = upcoming, <0 = past due time
  const late = diff < 0;
  const overdue = late && !todo.softDeadline && !todo.timerless; // soft deadline / timerless never turn red
  const missedMs = -diff;
  const missed = overdue && missedMs > MISS_GRACE_MS;

  const [reason, setReason] = React.useState(() => getTodoReason(dateKey, todo.id));
  const [askReason, setAskReason] = React.useState(false);

  const fmt = (ms) => {
    const total = Math.floor(Math.abs(ms) / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // State colours
  let accent, statusText, timerText, timerColor;
  if (todo.done) {
    accent = C.success;
    statusText = 'DONE';
    timerText = '✓';
    timerColor = C.success;
  } else if (todo.timerless) {
    // Calm, non-urgent presence — no ticking clock, never turns red.
    accent = C.accent;
    statusText = todo.dueLabel || 'DUE';
    timerText = '·';
    timerColor = C.textMid;
  } else if (!late) {
    accent = C.accent;
    statusText = `DUE ${todo.time}`;
    timerText = fmt(diff);
    timerColor = diff < 30 * 60 * 1000 ? C.accent : C.textMid; // <30m → accent
  } else if (!overdue) {
    // Past the usual slot but on a soft deadline (join day) — still open tonight.
    accent = C.accent;
    statusText = 'OPEN TONIGHT';
    timerText = '·';
    timerColor = C.textMid;
  } else {
    accent = C.danger;
    statusText = missed ? 'MISSED' : 'OVERDUE';
    timerText = `-${fmt(diff)}`;
    timerColor = C.danger;
  }

  const borderCol = todo.done ? C.accentDim : overdue ? 'rgba(229,86,75,.4)' : C.line;
  const bg = todo.done ? C.surf1 : overdue ? 'rgba(229,86,75,.06)' : C.surf2;

  return (
    <div
      style={{
        background: bg, border: `1px solid ${borderCol}`, borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={(!todo.done || todo.editable) ? todo.onDo : undefined}
        style={{
          width: '100%', textAlign: 'left', background: 'transparent', border: 0,
          padding: '14px 14px', cursor: (!todo.done || todo.editable) ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* check / icon */}
        <div
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: todo.done ? C.success : (overdue ? 'rgba(229,86,75,.14)' : C.surf3),
            color: todo.done ? C.onAccent : (overdue ? C.danger : C.accent),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {todo.done
            ? <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 10 L9 14 L15 6" stroke="#0A0A0C" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : todo.glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: accent, marginBottom: 3 }}>
            {statusText}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', lineHeight: 1 }}>
            {todo.label}
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 2 }}>
            {todo.sub}
          </div>
        </div>
        {/* countdown */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
              fontSize: todo.done ? 22 : 18, color: timerColor,
              fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5,
            }}
          >
            {timerText}
          </div>
          {todo.done && todo.editable && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginTop: 2 }}>
              EDIT
            </div>
          )}
        </div>
      </button>

      {/* Workout: explicit Complete + Postpone (Postpone also handles a missed session) */}
      {todo.canPostpone && !todo.done && (
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
          <button
            onClick={todo.onDo}
            style={{ flex: 1, padding: '10px 0', background: C.accent, border: 0, borderRadius: 10, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Complete
          </button>
          <button
            onClick={todo.onPostpone}
            style={{ flex: 1, padding: '10px 0', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10, color: C.textMid, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {missed ? 'Move it' : 'Postpone'}
          </button>
        </div>
      )}

      {/* Missed → ask for a reason (non-workout; the workout captures its reason on Postpone).
          Timerless to-dos (weigh-in) never nag — a long-term habit shouldn't feel like a deadline. */}
      {missed && !todo.done && !todo.canPostpone && !todo.timerless && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid rgba(229,86,75,.18)` }}>
          {reason ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: C.textLow }}>WHY MISSED</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text }}>{reason}</span>
              <button
                onClick={() => { setReason(null); setAskReason(true); }}
                style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, cursor: 'pointer' }}
              >
                EDIT
              </button>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginBottom: 8, lineHeight: 1.4 }}>
                Missed it — no drama. What was underneath? (Naming it is the win.)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MISS_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { saveTodoReason(dateKey, todo.id, r); setReason(r); setAskReason(false); onReasonSaved && onReasonSaved(); }}
                    style={{
                      padding: '7px 12px', borderRadius: 999,
                      background: C.surf1, border: `1px solid ${C.line}`,
                      color: C.text, fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 600, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddWorkoutSheet({ futureDays, onSwap, onExtra, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 220,
        background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>
          UNSCHEDULED WORKOUT
        </div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase' }}>
          TRAINING TODAY?<br /><span style={{ color: C.accent }}>NICE.</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '10px 0 16px' }}>
          Take it from a scheduled day later this week, or just add it on top — extra sessions never count against you.
        </p>

        {futureDays.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 8 }}>
              MOVE A SESSION FROM
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {futureDays.map((d) => (
                <button
                  key={d}
                  onClick={() => onSwap(d)}
                  style={{
                    padding: '10px 16px', borderRadius: 10,
                    background: C.surf1, border: `1px solid ${C.line}`, color: C.text,
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15,
                    letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onExtra}
          style={{
            width: '100%', height: 50, marginTop: 4,
            background: C.accent, border: 0, borderRadius: 12, color: C.onAccent,
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Just add it — keep all my sessions
        </button>
      </div>
    </div>
  );
}

// A past day's to-do state, browsed via the stepper: what got done, what
// didn't (marked MISSED — a bygone day, so there's no live countdown, just a
// plain outcome), and a one-tap way to catch up on check-in/weigh-in. A
// workout can't be done after the fact, so its row is read-only.
function HistoricDayCard({ day, history, weighins, user, onLogCheckin, onLogWeigh }) {
  const checkinEntry = (history || []).find((h) => h.date === day);
  const weighEntry = (weighins || []).find((w) => w.date === day);
  let workoutLogged = false;
  try { workoutLogged = (window.loadWorkouts ? window.loadWorkouts() : []).some((w) => w.date === day); } catch (e) {}
  const workoutReported = !!(checkinEntry && checkinEntry.answers && checkinEntry.answers.workoutToday);
  const workoutDone = workoutLogged || workoutReported;
  const wasScheduledDay = scheduledWorkoutDays(user).includes(new Date(day + 'T12:00:00').getDay());
  const showWorkoutRow = wasScheduledDay || workoutDone;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <HistoricRow
        label="Check-in"
        done={!!checkinEntry}
        detail={checkinEntry ? '9 questions logged' : null}
        onAction={onLogCheckin}
        actionLabel={checkinEntry ? 'View / edit' : 'Log it now'}
      />
      <HistoricRow
        label="Weigh-in"
        done={!!weighEntry}
        detail={weighEntry ? `${weighEntry.value} kg` : null}
        onAction={onLogWeigh}
        actionLabel={weighEntry ? 'Update' : 'Log it now'}
      />
      {showWorkoutRow && (
        <HistoricRow label="Workout" done={workoutDone} detail={workoutDone ? null : "Can't backdate a session — the check-in's Yes/No is the record"} />
      )}
    </div>
  );
}

function HistoricRow({ label, done, detail, onAction, actionLabel }) {
  return (
    <div style={{ background: done ? C.surf1 : 'transparent', border: `1px solid ${done ? C.line : C.lineStrong}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: done ? C.success : C.surf3, color: done ? C.onAccent : C.textLow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done
          ? <svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10 L9 14 L15 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 1 }}>{detail || (done ? 'Done' : 'Missed')}</div>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            flexShrink: 0, padding: '8px 12px', borderRadius: 9,
            background: done ? C.surf2 : C.accent, border: done ? `1px solid ${C.line}` : 0,
            color: done ? C.textMid : C.onAccent,
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12,
            letterSpacing: 0.8, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Postpone the day's workout to a free future day this week — reason required.
function PostponeSheet({ targets, fromDow, onConfirm, onClose }) {
  const [day, setDay] = React.useState(null);
  const [reason, setReason] = React.useState(null);
  const canConfirm = day != null && !!reason;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>POSTPONE {DAY_LABELS[fromDow]}'S WORKOUT</div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '0 0 10px', textTransform: 'uppercase' }}>
          MOVE IT TO<br /><span style={{ color: C.accent }}>ANOTHER DAY</span>
        </h3>
        {targets.length === 0 ? (
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '4px 0 4px' }}>
            No free days left this week. Complete it late, or add an extra day from the Workout tab.
          </p>
        ) : (
          <>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '0 0 14px' }}>
              Pick a day later this week, and tell us what got in the way — naming it is the win.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 8 }}>MOVE TO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {targets.map((d) => (
                <button key={d} onClick={() => setDay(d)} style={{ padding: '10px 16px', borderRadius: 10, background: day === d ? C.accentDim : C.surf1, border: day === d ? `1px solid ${C.accent}` : `1px solid ${C.line}`, color: day === d ? C.accent : C.text, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>{DAY_LABELS[d]}</button>
              ))}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 8 }}>WHY TODAY DIDN'T WORK</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {MISS_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)} style={{ padding: '7px 12px', borderRadius: 999, background: reason === r ? C.accentDim : C.surf1, border: reason === r ? `1px solid ${C.accent}` : `1px solid ${C.line}`, color: reason === r ? C.accent : C.text, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>{r}</button>
              ))}
            </div>
            <button onClick={() => canConfirm && onConfirm(day, reason)} disabled={!canConfirm} style={{ width: '100%', height: 50, background: canConfirm ? C.accent : C.surf2, border: 0, borderRadius: 12, color: canConfirm ? C.onAccent : C.textLow, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: canConfirm ? 'pointer' : 'default' }}>
              {day != null ? `Move to ${DAY_LABELS[day]}` : 'Pick a day'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// After >4 postpones in a week, offer to make the new day the default.
function SwapDefaultSheet({ toDow, fromDow, onAccept, onDecline }) {
  return (
    <div onClick={onDecline} style={{ position: 'absolute', inset: 0, zIndex: 221, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>THIS KEEPS MOVING</div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '0 0 10px', textTransform: 'uppercase' }}>
          MAKE {DAY_LABELS[toDow]} YOUR<br /><span style={{ color: C.accent }}>REGULAR DAY?</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '0 0 16px' }}>
          You've moved {DAY_LABELS[fromDow]}'s session a few times. Want to make {DAY_LABELS[toDow]} your usual workout day instead — so it sticks?
        </p>
        <button onClick={onAccept} style={{ width: '100%', height: 50, background: C.accent, border: 0, borderRadius: 12, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer' }}>
          Yes — make {DAY_LABELS[toDow]} my day
        </button>
        <button onClick={onDecline} style={{ width: '100%', height: 46, marginTop: 8, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 12, color: C.textMid, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer' }}>
          No, just this week
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { TodayTodos });

export { AddWorkoutSheet, DAY_LABELS, MISS_GRACE_MS, MISS_REASONS, TODO_STATE_KEY, TodayTodos, TodoRow, WORKOUT_WEEK_KEY, dueToday, getTodoReason, loadTodoState, loadWeekOverride, saveTodoReason, saveWeekOverride, scheduledWorkoutDays, weekPos, weekStartKey };

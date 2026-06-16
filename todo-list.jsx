// todo-list.jsx — "Today's To-Do List" for Home.
// Tasks with live countdowns; turn red on expiry, count into the negatives,
// and after 3h missed they ask the user for a reason. Refreshes daily.

const TODO_STATE_KEY = 'compound:todostate'; // per-day: { [date]: { [todoId]: { reason } } }
const MISS_GRACE_MS = 3 * 60 * 60 * 1000; // 3 hours past due before "missed + ask why"

const MISS_REASONS = ['Bored', 'Tired', 'Stressed', 'Hungry', 'Automatic', 'Forgot'];

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
function mondayKey() {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const mon = new Date(today.getTime() - dow * 86400000);
  return window.isoDate ? window.isoDate(mon) : mon.toISOString().slice(0, 10);
}
function loadWeekOverride() {
  try {
    const all = JSON.parse(localStorage.getItem(WORKOUT_WEEK_KEY) || '{}');
    return all[mondayKey()] || null;
  } catch (e) { return null; }
}
function saveWeekOverride(days) {
  try {
    const all = JSON.parse(localStorage.getItem(WORKOUT_WEEK_KEY) || '{}');
    all[mondayKey()] = days;
    localStorage.setItem(WORKOUT_WEEK_KEY, JSON.stringify(all));
  } catch (e) {}
}
// position within Mon→Sun week (0=Mon … 6=Sun)
const weekPos = (dow) => (dow + 6) % 7;
const DAY_LABELS = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' };

function TodayTodos({ user, state, onOpenCheckin, onWeighIn, onGoWorkout, onGoNutrition, weighDoneToday }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => setInterval && id && clearInterval(id);
  }, []);

  const dateKey = window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0, 10);

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

  const todos = [
    {
      id: 'weighin',
      label: 'Daily Weigh-in',
      sub: 'Pre-water · one number',
      time: user.weighInTime || '06:30',
      done: !!weighDoneToday,
      editable: true,
      onDo: onWeighIn,
      glyph: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 6 V5 A3 3 0 0 1 13 5 V6" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="12" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
    ...(isWorkoutDay ? [{
      id: 'workout',
      label: 'Workout',
      sub: 'Scheduled day · 25 min counts',
      time: user.workoutTime || '17:00',
      done: !!workoutDoneToday,
      onDo: onGoWorkout,
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
  ].sort((a, b) => (a.time < b.time ? -1 : 1));

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow }}>
          TODAY'S TO-DO LIST
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1, color: doneCount === todos.length ? C.success : C.accent }}>
          {doneCount}/{todos.length} DONE
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todos.map((t) => (
          <TodoRow key={t.id} todo={t} now={now} dateKey={dateKey} />
        ))}
      </div>

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

      {addSheet && (
        <AddWorkoutSheet
          futureDays={futureDays}
          onSwap={swapFrom}
          onExtra={addExtra}
          onClose={() => setAddSheet(false)}
        />
      )}
    </div>
  );
}

function TodoRow({ todo, now, dateKey }) {
  const due = dueToday(todo.time);
  const diff = due.getTime() - now; // >0 = upcoming, <0 = overdue
  const overdue = diff < 0;
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
  } else if (!overdue) {
    accent = C.accent;
    statusText = `DUE ${todo.time}`;
    timerText = fmt(diff);
    timerColor = diff < 30 * 60 * 1000 ? C.accent : C.textMid; // <30m → accent
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
            color: todo.done ? '#0A0A0C' : (overdue ? C.danger : C.accent),
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

      {/* Missed → ask for a reason */}
      {missed && !todo.done && (
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
                    onClick={() => { saveTodoReason(dateKey, todo.id, r); setReason(r); setAskReason(false); }}
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
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
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
            background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C',
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

Object.assign(window, { TodayTodos });
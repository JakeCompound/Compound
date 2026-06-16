// workout-enhancements.jsx — Pass 1 upgrades to live workout session
// PlateCalc, PreviousPerformance line, ExerciseNotes, SessionNotes
// Plus Routines (save / repeat) storage helpers

// Real previous-performance lookup from saved workout history.
function getPrevSets(exId) {
  try { return window.lastSetsFor(window.loadWorkouts(), exId); } catch (e) { return null; }
}

// ── Plate calculator ────────────────────────────────────────────────────
// Reeplex PRO90 spec: standard 20kg bar + plates: 25, 20, 15, 10, 5, 2.5, 1.25
// For dumbbells (≤35kg), we just show the DB weight.
const BAR_WEIGHT = 20;
const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

function calcPlatesPerSide(target) {
  let remaining = (target - BAR_WEIGHT) / 2;
  if (remaining <= 0) return { plates: [], bar: BAR_WEIGHT, valid: target >= BAR_WEIGHT };
  const plates = [];
  for (const p of PLATE_SIZES) {
    while (remaining >= p - 0.001) {
      plates.push(p);
      remaining -= p;
    }
  }
  return { plates, bar: BAR_WEIGHT, valid: Math.abs(remaining) < 0.01 };
}

function PlateCalc({ weight, isWarmup }) {
  if (!weight || weight < BAR_WEIGHT) return null;
  const { plates, valid } = calcPlatesPerSide(weight);
  if (plates.length === 0) {
    return (
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, color: C.textLow, padding: '0 4px' }}>
        BAR ONLY · {BAR_WEIGHT}KG
      </div>
    );
  }
  const colorFor = (p) => ({
    25:   '#E5564B',
    20:   '#7CA8E0',
    15:   '#F2A30F',
    10:   '#5AC57E',
    5:    '#E8E6E1',
    2.5:  '#6E6A60',
    1.25: '#3E3B33',
  })[p] || '#888';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', marginTop: 6,
        background: 'rgba(0,0,0,.22)', borderRadius: 8,
        border: `1px dashed ${C.line}`,
      }}
    >
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 1.4, color: C.textLow }}>
        /SIDE
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        {plates.map((p, i) => {
          const height = 10 + p * 0.8; // visual proportion
          return (
            <div
              key={i}
              title={`${p}kg`}
              style={{
                width: p >= 10 ? 6 : 4,
                height,
                background: colorFor(p),
                borderRadius: 1,
                boxShadow: '0 0 0 0.5px rgba(0,0,0,.4)',
              }}
            />
          );
        })}
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.text, letterSpacing: 0.8 }}>
        {plates.map((p) => p).join('·')}
      </span>
      {!valid && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.danger, letterSpacing: 1 }}>
          ROUND
        </span>
      )}
    </div>
  );
}

// ── Previous performance inline strip ───────────────────────────────────
function PrevPerfStrip({ exId, sets, isHold }) {
  if (isHold) return null;
  const prev = getPrevSets(exId);
  if (!prev) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: '8px 12px',
          background: C.surf1,
          border: `1px dashed ${C.line}`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.5 }}>
          NO HISTORY
        </span>
        <span style={{ flex: 1, fontFamily: 'Outfit, sans-serif', fontSize: 11.5, color: C.textMid }}>
          First time on this lift. We'll bank it from today.
        </span>
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 12px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.5 }}>
        LAST TIME
      </span>
      <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {prev.map((s, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: C.text, letterSpacing: 0.5, whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: C.textLow }}>S{i + 1}</span> {s.w}×{s.r}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Exercise note (collapsible) ─────────────────────────────────────────
function ExerciseNote({ value, onChange }) {
  const [open, setOpen] = React.useState(!!value);
  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'transparent', border: `1px dashed ${C.line}`,
            borderRadius: 8, padding: '8px 12px',
            color: C.textMid, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" style={{ flexShrink: 0 }}>
            <path d="M2 8.5 L2 6 L7 1 L10 4 L5 9 L2 9 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          ADD NOTE
        </button>
      ) : (
        <div
          style={{
            background: C.surf1,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.6 }}>
              NOTE
            </span>
            <button
              onClick={() => { if (!value) setOpen(false); }}
              style={{
                background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 0,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4,
              }}
            >
              {value ? 'SAVED' : 'CLOSE'}
            </button>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Form cues, niggles, anything to remember next time…"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 0, outline: 0, resize: 'vertical',
              color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 13, lineHeight: 1.4,
              padding: 0, boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Session notes (shown at completion) ─────────────────────────────────
function SessionNotesField({ value, onChange }) {
  return (
    <div style={{ marginTop: 18, marginBottom: 8 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginBottom: 8 }}>
        SESSION NOTE · OPTIONAL
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How did it feel? Anything to remember?"
        rows={2}
        style={{
          width: '100%', background: C.surf1, border: `1px solid ${C.line}`,
          borderRadius: 10, padding: '10px 12px', outline: 0, resize: 'vertical',
          color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 13.5, lineHeight: 1.4,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ── Saved Workouts (save & repeat) ──────────────────────────────────────
const ROUTINES_KEY = 'compound:savedWorkouts';

function loadRoutines() {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveRoutines(list) {
  try { localStorage.setItem(ROUTINES_KEY, JSON.stringify(list)); } catch (e) {}
}

function deleteRoutine(id) {
  const next = loadRoutines().filter((r) => r.id !== id);
  saveRoutines(next);
  return next;
}

// Compact button for the Workout home — opens the Saved Workouts list.
function SavedWorkoutsButton({ onOpen }) {
  const count = loadRoutines().length;
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 14px',
        background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surf2, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3 H14 A1 1 0 0 1 15 4 V17 L10 14 L5 17 V4 A1 1 0 0 1 6 3 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1.2, color: C.text, textTransform: 'uppercase' }}>SAVED WORKOUTS</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginTop: 2 }}>
          {count === 0 ? 'Save a session to reuse it any time' : `${count} saved · tap to start one`}
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: C.textLow, flexShrink: 0 }}><path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

// Full-screen list of saved workouts.
function SavedWorkoutsScreen({ onBack, onStart }) {
  const [list, setList] = React.useState(loadRoutines());
  const remove = (id) => setList(deleteRoutine(id));
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="SAVED WORKOUTS" sub={`${list.length} saved`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        {list.length === 0 ? (
          <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📓</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', marginBottom: 6 }}>No saved workouts yet</div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: 0 }}>
              Finish a session and tap “Save this workout” to name it and keep it here for one-tap repeats.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((r) => <SavedWorkoutRow key={r.id} routine={r} onStart={() => onStart(r)} onDelete={() => remove(r.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SavedWorkoutRow({ routine, onStart, onDelete }) {
  return (
    <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase', lineHeight: 1 }}>{routine.name}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 0.8, marginTop: 4 }}>
          {routine.duration}M · {routine.exerciseCount} EX · {(routine.groups || []).join(' · ')}
        </div>
      </div>
      <button onClick={onDelete} style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 6, flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 15 15"><path d="M3 4 H12 M6 4 V2.5 H9 V4 M4.5 4 L5 12.5 H10 L10.5 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button onClick={onStart} style={{ background: C.accent, border: 0, color: '#0A0A0C', padding: '9px 14px', borderRadius: 9, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.2, cursor: 'pointer', flexShrink: 0 }}>START</button>
    </div>
  );
}

// ── Save-as-workout card (shown on session complete) ────────────────────
function SaveAsRoutineCard({ session, config, onSaved }) {
  const [saved, setSaved] = React.useState(false);
  const [routineName, setRoutineName] = React.useState(
    config.groups.length === 1 ? `${config.groups[0].toUpperCase()} DAY` :
    config.groups.slice(0, 2).join(' / ').toUpperCase()
  );

  const handleSave = () => {
    const routines = loadRoutines();
    const newRoutine = {
      id: 'r-' + Date.now(),
      name: routineName.trim() || 'My Workout',
      groups: config.groups,
      duration: config.duration,
      exerciseCount: session.length,
      savedAt: Date.now(),
      config,
    };
    saveRoutines([newRoutine, ...routines]);
    setSaved(true);
    onSaved && onSaved();
  };

  if (saved) {
    return (
      <div
        style={{
          padding: '14px 16px',
          background: C.surf1,
          border: `1px solid ${C.accentDim}`,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill={C.accentSoft} stroke={C.accent} strokeWidth="1.4" />
          <path d="M6 11 L9.5 14.5 L16 7.5" stroke={C.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.5 }}>
            SAVED AS ROUTINE
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginTop: 2, letterSpacing: 0.8 }}>
            {routineName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        background: C.surf1,
        border: `1px dashed ${C.line}`,
        borderRadius: 12,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.8, marginBottom: 8 }}>
        SAVE THIS WORKOUT?
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          maxLength={32}
          style={{
            flex: 1,
            background: C.surf2, border: `1px solid ${C.line}`,
            borderRadius: 8, padding: '10px 12px',
            color: C.text, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 600,
            letterSpacing: 0.8, textTransform: 'uppercase', outline: 0,
          }}
        />
        <button
          onClick={handleSave}
          style={{
            background: C.accent, border: 0, color: '#0A0A0C',
            padding: '10px 14px', borderRadius: 8,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
            letterSpacing: 1.5, cursor: 'pointer',
          }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  PrevPerfStrip, PlateCalc, ExerciseNote, SessionNotesField,
  SavedWorkoutsButton, SavedWorkoutsScreen, SaveAsRoutineCard, loadRoutines, saveRoutines, deleteRoutine,
  getPrevSets, calcPlatesPerSide,
});

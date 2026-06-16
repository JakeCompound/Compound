// workout-session.jsx — Live workout session, set logging, rest timer, completion

function WorkoutSession({ session, config, onExit, onComplete }) {
  // Local mutable state for the session
  const [exercises, setExercises] = React.useState(session);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [restEndAt, setRestEndAt] = React.useState(null); // timestamp ms or null
  const [askRIR, setAskRIR] = React.useState(null); // { exIdx, setIdx } or null
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  const exercise = exercises[currentIdx];
  const totalExercises = exercises.length;

  // ── Helpers ─────────────────────────────────────────────────────────────
  const updateSet = (exIdx, setIdx, patch) => {
    setExercises((all) => {
      const next = [...all];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], ...patch };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  };

  const updateNote = (exIdx, note) => {
    setExercises((all) => {
      const next = [...all];
      next[exIdx] = { ...next[exIdx], note };
      return next;
    });
  };

  // Total progress: completed sets / all sets
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.complete).length, 0);
  const overallPct = totalSets ? doneSets / totalSets : 0;

  const isExerciseComplete = (ex) => ex.sets.every((s) => s.complete);

  const goToNextExercise = () => {
    // Find next incomplete
    for (let i = 0; i < exercises.length; i++) {
      const idx = (currentIdx + 1 + i) % exercises.length;
      if (!isExerciseComplete(exercises[idx])) {
        setCurrentIdx(idx);
        return;
      }
    }
    // All complete
    setCompleted(true);
  };

  // ── Set completion flow ─────────────────────────────────────────────────
  const completeSet = (setIdx) => {
    const s = exercise.sets[setIdx];
    // For weighted, ask RIR if reps were logged
    if (exercise.type === 'weighted' && !s.isWarmup) {
      setAskRIR({ exIdx: currentIdx, setIdx });
      return;
    }
    // Bodyweight or warmup — just complete
    updateSet(currentIdx, setIdx, { complete: true });
    startRest();
  };

  const submitRIR = (rir) => {
    if (!askRIR) return;
    updateSet(askRIR.exIdx, askRIR.setIdx, { rir, complete: true });
    setAskRIR(null);
    startRest();
  };

  const startRest = (sec = 120) => {
    setRestEndAt(Date.now() + sec * 1000);
  };
  const skipRest = () => setRestEndAt(null);

  // After all sets of current exercise are done → auto-advance
  React.useEffect(() => {
    if (exercise && isExerciseComplete(exercise)) {
      const allDone = exercises.every(isExerciseComplete);
      if (allDone) {
        setCompleted(true);
      } else {
        const t = setTimeout(goToNextExercise, 700);
        return () => clearTimeout(t);
      }
    }
  }, [exercises]);

  if (completed) {
    return <SessionComplete exercises={exercises} config={config} onDone={() => {
      if (window.recordWorkout) { try { window.recordWorkout(exercises, config); } catch (e) {} }
      onComplete();
    }} />;
  }

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button
          onClick={() => setConfirmExit(true)}
          style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>EXIT</span>
        </button>
        <SessionTimer />
        <div style={{ width: 60, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5, color: C.textLow }}>
          {currentIdx + 1}/{totalExercises}
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ height: 3, background: C.surf2, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${overallPct * 100}%`, background: C.accent, transition: 'width .3s' }} />
      </div>

      {/* Exercise content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <CurrentExercise
          exercise={exercise}
          onUpdateSet={(setIdx, patch) => updateSet(currentIdx, setIdx, patch)}
          onCompleteSet={completeSet}
          onUpdateNote={(note) => updateNote(currentIdx, note)}
        />

        {/* Next-up preview */}
        {currentIdx < exercises.length - 1 && (
          <div style={{ padding: '6px 22px 22px' }}>
            <SectionLabel>NEXT UP</SectionLabel>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginLeft: -22, marginRight: -22, paddingLeft: 22, paddingRight: 22 }}>
              {exercises.slice(currentIdx + 1).map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    minWidth: 160, flexShrink: 0,
                    background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.5 }}>
                    {String(currentIdx + 2 + i).padStart(2, '0')} · {e.sets.length} SETS
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: C.text, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {e.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rest timer */}
      {restEndAt && (
        <RestTimer endsAt={restEndAt} onSkip={skipRest} onAdd={() => setRestEndAt(restEndAt + 15000)} />
      )}

      {/* RIR modal */}
      {askRIR && (
        <RIRModal
          exercise={exercises[askRIR.exIdx]}
          set={exercises[askRIR.exIdx].sets[askRIR.setIdx]}
          onSubmit={submitRIR}
          onCancel={() => setAskRIR(null)}
        />
      )}

      {/* Exit confirm */}
      {confirmExit && (
        <ExitConfirmModal
          onResume={() => setConfirmExit(false)}
          onSave={() => { setConfirmExit(false); onExit({ resume: true, exercises, currentIdx }); }}
          onDiscard={() => { setConfirmExit(false); onExit({ resume: false }); }}
        />
      )}
    </div>
  );
}

// ── Current exercise ────────────────────────────────────────────────────
function CurrentExercise({ exercise, onUpdateSet, onCompleteSet, onUpdateNote }) {
  return (
    <div style={{ padding: '20px 22px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.accent }}>
            {exercise.groups.join(' · ').toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 32,
              lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '6px 0 4px', textTransform: 'uppercase',
            }}
          >
            {exercise.name}
          </h1>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid }}>
            {exercise.sets.length} sets · {exercise.isHold ? 'timed hold' : 'reps to target'}
          </div>
        </div>
        {exercise.tracked1RM && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, background: C.accentSoft, padding: '4px 8px', borderRadius: 4, letterSpacing: 1.4 }}>
            TRACKED 1RM
          </span>
        )}
      </div>

      {/* Quick-log shortcut (text/voice-style logger powered by Claude) */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <QuickLogButton
          exercise={exercise}
          onLog={(parsed) => {
            // Find first incomplete set and fill it
            const idx = exercise.sets.findIndex((s) => !s.complete);
            if (idx === -1) return;
            const patch = {};
            if (parsed.weight != null) patch.weight = parsed.weight;
            if (parsed.reps != null) patch.reps = parsed.reps;
            if (parsed.rir != null) patch.rir = parsed.rir;
            patch.complete = true;
            onUpdateSet(idx, patch);
          }}
        />
      </div>

      {/* Previous performance — Hevy-style inline */}
      <PrevPerfStrip exId={exercise.exId} sets={exercise.sets} isHold={exercise.isHold} />

      {/* Sets list */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exercise.sets.map((s, i) => (
          <SetRow
            key={i}
            n={i + 1}
            exId={exercise.exId}
            setIdx={i}
            set={s}
            isHold={exercise.isHold}
            isWeighted={exercise.type === 'weighted'}
            onChange={(patch) => onUpdateSet(i, patch)}
            onComplete={() => onCompleteSet(i)}
          />
        ))}
      </div>

      {/* Per-exercise note */}
      <ExerciseNote value={exercise.note || ''} onChange={(v) => onUpdateNote(v)} />
    </div>
  );
}

function SetRow({ n, exId, setIdx, set, isHold, isWeighted, onChange, onComplete }) {
  const isWarmup = set.isWarmup;
  return (
    <div
      style={{
        padding: '12px 14px',
        background: set.complete ? C.surf2 : C.surf1,
        border: `1px solid ${set.complete ? C.accentDim : C.line}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: set.complete ? 0.65 : 1,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: set.complete ? C.accent : 'transparent',
          border: set.complete ? `1px solid ${C.accent}` : `1.5px solid ${C.lineStrong}`,
          color: set.complete ? '#0A0A0C' : C.textMid,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
        }}
      >
        {set.complete ? (
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7 L6 10 L11 4" stroke="#0A0A0C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          isWarmup ? 'W' : n
        )}
      </div>

      {isWarmup && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.4 }}>
          WARM
        </span>
      )}

      {/* Weight input */}
      {isWeighted && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <input
            type="number"
            value={set.weight ?? ''}
            onChange={(e) => onChange({ weight: Number(e.target.value) || 0 })}
            disabled={set.complete}
            style={{
              width: 52,
              background: 'transparent', border: 0,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600,
              color: set.complete ? C.textMid : C.text,
              outline: 0, padding: 0, textAlign: 'left',
            }}
          />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.4 }}>
            KG
          </span>
        </div>
      )}

      <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textLow, letterSpacing: 1.4 }}>
        × {isHold ? `${set.targetHold}s` : `${set.target} reps`}
      </span>

      {/* Reps input */}
      {!isHold && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <input
            type="number"
            value={set.reps ?? ''}
            onChange={(e) => onChange({ reps: e.target.value ? Number(e.target.value) : null })}
            disabled={set.complete}
            placeholder={String(set.target)}
            style={{
              width: 40,
              background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 6,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600,
              color: set.complete ? C.textMid : (set.reps ? C.accent : C.text),
              outline: 0, padding: '6px 8px', textAlign: 'center',
            }}
          />
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={set.complete || (!isHold && set.reps === null)}
        style={{
          minWidth: 38, height: 36,
          background: set.complete ? 'transparent' : (((!isHold && set.reps !== null) || isHold) ? C.accent : C.surf3),
          border: 0, borderRadius: 8,
          color: set.complete ? C.textLow : '#0A0A0C',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.4, fontWeight: 600,
          cursor: set.complete ? 'default' : 'pointer',
          opacity: (!set.complete && !isHold && set.reps === null) ? 0.4 : 1,
        }}
      >
        {set.complete ? '—' : '✓'}
      </button>

      {/* Plate calculator strip — full width below */}
      {isWeighted && !set.complete && set.weight >= 20 && (
        <div style={{ width: '100%', marginTop: 2 }}>
          <PlateCalc weight={set.weight} isWarmup={isWarmup} />
        </div>
      )}
    </div>
  );
}

// ── Session timer (counts up since start) ────────────────────────────────
function SessionTimer() {
  const [start] = React.useState(Date.now());
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = Math.floor((now - start) / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600,
        color: C.accent, letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
      }}
    >
      {mm}:{ss}
    </div>
  );
}

// ── Rest timer (fixed bottom card) ───────────────────────────────────────
function RestTimer({ endsAt, onSkip, onAdd }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, endsAt - now);
  const sec = Math.ceil(remaining / 1000);
  const totalSec = 120;
  const pct = remaining > 0 ? remaining / 1000 / totalSec : 0;

  React.useEffect(() => {
    if (remaining <= 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <div
      style={{
        flexShrink: 0,
        background: C.surf2,
        borderTop: `1px solid ${C.accentDim}`,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${(1 - pct) * 100}%`,
          background: 'linear-gradient(90deg, rgba(242,163,15,.18), transparent)',
          transition: 'width .25s linear',
        }}
      />
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 600,
          color: C.accent, fontVariantNumeric: 'tabular-nums', minWidth: 70,
          zIndex: 1,
        }}
      >
        {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
      </div>
      <div style={{ flex: 1, zIndex: 1 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.accent }}>
          REST
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 2 }}>
          Breathe. Long exhales.
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 8,
          color: C.text, padding: '8px 10px', cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.2, zIndex: 1,
        }}
      >
        +15
      </button>
      <button
        onClick={onSkip}
        style={{
          background: C.surf3, border: 0, borderRadius: 8,
          color: C.text, padding: '8px 12px', cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.2, zIndex: 1,
        }}
      >
        SKIP
      </button>
    </div>
  );
}

// ── RIR modal ────────────────────────────────────────────────────────────
function RIRModal({ exercise, set, onSubmit, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: C.bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 22px 28px',
          boxShadow: '0 -20px 60px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 10 }}>
          {set.isWarmup ? 'WARMUP' : `SET COMPLETE · ${set.weight}KG × ${set.reps}`}
        </div>
        <h3
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28,
            lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase',
          }}
        >
          REPS LEFT<br /><span style={{ color: C.accent }}>IN THE TANK?</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '10px 0 18px', maxWidth: 320 }}>
          Honest estimate. We feed this into your 1RM and next session's load.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onSubmit(n)}
              style={{
                aspectRatio: '1',
                background: C.surf1,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                color: C.text,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.4 }}>
          <span>NONE · MAX EFFORT</span>
          <span>EASY</span>
        </div>
      </div>
    </div>
  );
}

// ── Exit confirm ─────────────────────────────────────────────────────────
function ExitConfirmModal({ onResume, onSave, onDiscard }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 28,
      }}
    >
      <div
        style={{
          width: '100%',
          background: C.surf1, border: `1px solid ${C.line}`,
          borderRadius: 16, padding: '22px 22px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26,
            color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5,
          }}
        >
          PAUSE THIS<br /><span style={{ color: C.accent }}>SESSION?</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, margin: '10px 0 18px', lineHeight: 1.5 }}>
          Save progress and resume later, or discard and walk away.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryButton onClick={onResume} icon={false}>Keep going</PrimaryButton>
          <button
            onClick={onSave}
            style={{
              height: 48, background: C.surf2, border: `1px solid ${C.line}`,
              borderRadius: 12, color: C.text,
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 600,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Save & exit
          </button>
          <button
            onClick={onDiscard}
            style={{
              height: 40, background: 'transparent', border: 0,
              color: C.danger,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.8,
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Discard session
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session complete ─────────────────────────────────────────────────────
function SessionComplete({ exercises, config, onDone }) {
  const [sessionNote, setSessionNote] = React.useState('');
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const completedSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.complete).length, 0);
  const totalVolume = exercises.reduce((sum, e) => {
    return sum + e.sets.filter((s) => s.complete && !s.isWarmup && s.weight && s.reps).reduce((s2, s) => s2 + s.weight * s.reps, 0);
  }, 0);

  // Compute 1RM PBs for tracked lifts
  const pbs = [];
  for (const e of exercises) {
    if (!e.tracked1RM) continue;
    const best = e.sets
      .filter((s) => s.complete && !s.isWarmup && s.weight && s.reps)
      .map((s) => calc1RM(s.weight, s.reps, s.rir || 0))
      .reduce((m, v) => Math.max(m, v), 0);
    if (best > 0) pbs.push({ lift: e.name, value: best });
  }

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column', padding: '32px 24px 28px', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 96, height: 96, borderRadius: '50%',
            border: `2px solid ${C.accent}`, background: C.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(242,163,15,.3)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48">
            <path d="M12 24 L20 32 L36 16" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 3, marginTop: 18 }}>
          SESSION LOGGED
        </div>
      </div>

      <h1
        style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 38,
          letterSpacing: 0.5, color: C.text, margin: '18px 0 18px', textTransform: 'uppercase',
          textAlign: 'center', lineHeight: 0.98,
        }}
      >
        REPS<br /><span style={{ color: C.accent }}>BANKED.</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <CompleteStat label="DURATION" value={`${config.duration}m`} />
        <CompleteStat label="EXERCISES" value={exercises.length} />
        <CompleteStat label="SETS" value={`${completedSets}/${totalSets}`} />
        <CompleteStat label="VOLUME" value={`${Math.round(totalVolume).toLocaleString()}kg`} />
      </div>

      {pbs.length > 0 && (
        <div
          style={{
            marginTop: 18, padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(242,163,15,.16), rgba(242,163,15,.04))',
            border: `1px solid ${C.accent}`, borderRadius: 14,
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏆</span> PERSONAL RECORDS
          </div>
          {pbs.map((pb) => (
            <div key={pb.lift} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 16, color: C.text, letterSpacing: 1, textTransform: 'uppercase' }}>
                {pb.lift}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
                {pb.value}kg
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Session notes */}
      <SessionNotesField value={sessionNote} onChange={setSessionNote} />

      {/* Save as routine */}
      <div style={{ marginTop: 8 }}>
        <SaveAsRoutineCard session={exercises} config={config} />
      </div>

      <div style={{ marginTop: 24, paddingTop: 8 }}>
        <PrimaryButton onClick={onDone}>Back to Workout</PrimaryButton>
      </div>
    </div>
  );
}

function CompleteStat({ label, value }) {
  return (
    <div style={{ padding: '14px 14px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, color: C.text, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(window, {
  WorkoutSession, SessionComplete,
});

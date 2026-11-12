import React from 'react';
import { C, PrimaryButton } from './compound-ui.jsx';
import { QuickLogButton } from './quick-log.jsx';
import { buildSessionItem, calc1RM } from './workout-data.jsx';
import { ExercisePickerSheet } from './custom-workout.jsx';
import { ExerciseNote, PlateCalc, PrevPerfStrip, SaveAsRoutineCard, SessionNotesField } from './workout-enhancements.jsx';

// workout-session.jsx — Live workout session, "focus mode": one exercise and
// one set front and centre, big steppers, one-tap confirm, auto rest timer.
//
// The in-progress session persists to compound:activeWorkout on EVERY change
// (and again on visibilitychange/pagehide), and cloud-sync mirrors that key to
// the workout_drafts table — so backing out, switching tabs, or Android
// reclaiming the PWA never loses a logged set. The draft clears only when the
// workout is finished or explicitly discarded.

const DRAFT_KEY = 'compound:activeWorkout';
function loadActiveDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return d && Array.isArray(d.exercises) && d.exercises.length ? d : null;
  } catch (e) { return null; }
}
function saveActiveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) {} }
// Write 'null' instead of removing the key: the cloud mirror only hooks
// setItem, so this is what deletes the draft row server-side too.
function clearActiveDraft() { try { localStorage.setItem(DRAFT_KEY, 'null'); } catch (e) {} }

function WorkoutSession({ session, config, startedAt: startedAtProp, initialIdx = 0, onExit, onComplete }) {
  const [exercises, setExercises] = React.useState(session);
  const [currentIdx, setCurrentIdx] = React.useState(Math.min(initialIdx, session.length - 1));
  const [restEndAt, setRestEndAt] = React.useState(null);
  const [askRIR, setAskRIR] = React.useState(null); // { exIdx, setIdx } or null
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [swapIdx, setSwapIdx] = React.useState(null); // which exercise the picker replaces
  const startedAt = React.useRef(startedAtProp || Date.now()).current;

  const exercise = exercises[currentIdx];
  const totalExercises = exercises.length;
  const doneCount = (ex) => ex.sets.filter((s) => s.complete).length;
  const isExerciseComplete = (ex) => ex.sets.every((s) => s.complete);

  // ── Persistence — every change lands in localStorage (cloud-sync mirrors it)
  const draftRef = React.useRef(null);
  React.useEffect(() => {
    if (completed) return;
    const d = { config, exercises, currentIdx, startedAt, updatedAt: Date.now() };
    draftRef.current = d;
    saveActiveDraft(d);
  }, [exercises, currentIdx, completed]);
  React.useEffect(() => {
    const flush = () => { if (draftRef.current && !completed) saveActiveDraft(draftRef.current); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush); };
  }, [completed]);

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

  const addExercise = (libEx) => {
    if (swapIdx != null) {
      // Swapping: replace in place, keep position. Logged sets on the old
      // exercise are let go — it's a mid-session change of mind.
      const item = buildSessionItem(libEx, { durationMin: config.duration || 30, preFeel: 0, idx: swapIdx, setsPerExercise: 3 });
      setExercises((all) => all.map((e, i) => (i === swapIdx ? item : e)));
      setSwapIdx(null);
      setPickerOpen(false);
      return;
    }
    const item = buildSessionItem(libEx, { durationMin: config.duration || 30, preFeel: 0, idx: exercises.length, setsPerExercise: 3 });
    const newIdx = exercises.length;
    setExercises((all) => [...all, item]);
    if (exercise && isExerciseComplete(exercise)) setCurrentIdx(newIdx);
    setPickerOpen(false);
  };

  const addSet = () => {
    setExercises((all) => {
      const next = [...all];
      const ex = { ...next[currentIdx] };
      const last = ex.sets[ex.sets.length - 1] || {};
      ex.sets = [...ex.sets, {
        target: last.target ?? 10, targetHold: last.targetHold ?? null,
        suggested: last.weight ?? last.suggested ?? null, weight: last.weight ?? last.suggested ?? null,
        reps: null, rir: null, complete: false, isWarmup: false,
      }];
      next[currentIdx] = ex;
      return next;
    });
  };

  // ── Off-plan: remove / reorder / superset (edit sheet) ──────────────────
  const removeExercise = (idx) => {
    setExercises((all) => {
      const gone = all[idx];
      const next = all.filter((_, i) => i !== idx)
        .map((e) => (e.superset === gone.id ? { ...e, superset: null } : e));
      return next;
    });
    setCurrentIdx((i) => Math.max(0, Math.min(i >= idx && i > 0 ? i - 1 : i, exercises.length - 2)));
  };
  const moveExercise = (idx, dir) => {
    setExercises((all) => {
      const j = idx + dir;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setCurrentIdx((i) => (i === idx ? idx + dir : i === idx + dir ? idx : i));
  };
  // Link exercise idx with the one after it (A1/A2): sets alternate, no rest
  // inside the pair, rest after each full round.
  const toggleSuperset = (idx) => {
    setExercises((all) => {
      const a = all[idx], b = all[idx + 1];
      if (!b) return all;
      const linked = a.superset === b.id;
      return all.map((e, i) => {
        if (i === idx) return { ...e, superset: linked ? null : b.id };
        if (i === idx + 1) return { ...e, superset: linked ? null : a.id };
        return e;
      });
    });
  };

  const closePicker = () => {
    setPickerOpen(false);
    setSwapIdx(null);
    if (exercises.every(isExerciseComplete)) setCompleted(true);
  };

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.complete).length, 0);
  const overallPct = totalSets ? doneSets / totalSets : 0;

  const goToNextExercise = () => {
    for (let i = 0; i < exercises.length; i++) {
      const idx = (currentIdx + 1 + i) % exercises.length;
      if (!isExerciseComplete(exercises[idx])) { setCurrentIdx(idx); return; }
    }
    setCompleted(true);
  };

  // ── Set completion flow ─────────────────────────────────────────────────
  const startRest = (sec = 120) => setRestEndAt(Date.now() + sec * 1000);
  const skipRest = () => setRestEndAt(null);

  // Superset-aware advance after a set lands: chain to the partner with no
  // rest while it is behind; once the round evens out, rest and swing back.
  const afterSet = (updatedAll, exIdx) => {
    const ex = updatedAll[exIdx];
    const pIdx = ex.superset ? updatedAll.findIndex((e) => e.id === ex.superset) : -1;
    const p = pIdx >= 0 ? updatedAll[pIdx] : null;
    const dc = (e) => e.sets.filter((s) => s.complete).length;
    if (p && p.sets.some((s) => !s.complete)) {
      if (dc(p) < dc(ex)) { setCurrentIdx(pIdx); return; } // no rest inside the pair
      startRest();
      setCurrentIdx(pIdx);
      return;
    }
    startRest();
  };

  const applyComplete = (setIdx, extra = {}) => {
    const next = exercises.map((e, i) => {
      if (i !== currentIdx) return e;
      const done = { ...e.sets[setIdx], ...extra, complete: true };
      return {
        ...e,
        sets: e.sets.map((s, j) => (j === setIdx ? done
          : j > setIdx && !s.complete && s.weight == null && done.weight != null
            ? { ...s, weight: done.weight, suggested: done.weight } : s)),
      };
    });
    setExercises(next);
    afterSet(next, currentIdx);
  };

  const completeSet = (setIdx) => {
    const s = exercise.sets[setIdx];
    if (exercise.type === 'weighted' && !s.isWarmup) {
      setAskRIR({ exIdx: currentIdx, setIdx });
      return;
    }
    applyComplete(setIdx);
  };

  const submitRIR = (rir) => {
    if (!askRIR) return;
    applyComplete(askRIR.setIdx, { rir });
    setAskRIR(null);
  };

  // All sets of the current exercise done (and no superset partner pulled us
  // away) → move on after a beat.
  React.useEffect(() => {
    if (exercise && isExerciseComplete(exercise)) {
      if (exercises.every(isExerciseComplete)) {
        setCompleted(true);
      } else {
        const t = setTimeout(goToNextExercise, 700);
        return () => clearTimeout(t);
      }
    }
  }, [exercises, currentIdx]);

  if (completed) {
    // Actual time under the bar, not the planned block.
    const actualMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const doneConfig = { ...config, duration: actualMin };
    return <SessionComplete exercises={exercises} config={doneConfig} onKeepGoing={() => { setCompleted(false); setPickerOpen(true); }} onDone={(analysis) => {
      const cfg = analysis && analysis.kcal != null
        ? { ...doneConfig, aiKcal: analysis.kcal, aiInsights: analysis.insights || [] }
        : doneConfig;
      if (window.recordWorkout) { try { window.recordWorkout(exercises, cfg); } catch (e) {} }
      clearActiveDraft();
      onComplete();
    }} />;
  }

  const nextUp = (() => {
    for (let i = 1; i < exercises.length; i++) {
      const idx = (currentIdx + i) % exercises.length;
      if (!isExerciseComplete(exercises[idx])) return exercises[idx];
    }
    return null;
  })();

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar: exit · elapsed · saved + position */}
      <div style={{ padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button
          onClick={() => setConfirmExit(true)}
          style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>EXIT</span>
        </button>
        <SessionTimer startedAt={startedAt} />
        <SavedBadge />
      </div>

      <div style={{ height: 3, background: C.surf2, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${overallPct * 100}%`, background: C.accent, transition: 'width .3s' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FocusExercise
          exercise={exercise}
          exNumber={currentIdx + 1}
          exTotal={totalExercises}
          partner={exercise.superset ? exercises.find((e) => e.id === exercise.superset) : null}
          onUpdateSet={(setIdx, patch) => updateSet(currentIdx, setIdx, patch)}
          onConfirmSet={completeSet}
          onUpdateNote={(note) => updateNote(currentIdx, note)}
          onAddSet={addSet}
        />
      </div>

      {/* Bottom dock: next up + session controls */}
      <div style={{ flexShrink: 0, padding: '10px 22px 14px', borderTop: `1px solid ${C.line}`, background: C.bg, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.8, color: C.textLow }}>
            EXERCISE {currentIdx + 1} OF {totalExercises} · NEXT UP
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nextUp ? `${nextUp.name} · ${nextUp.sets.length} sets` : 'Last one — bring it home'}
          </div>
        </div>
        <button onClick={() => setPickerOpen(true)} style={{ flexShrink: 0, padding: '11px 12px', borderRadius: 10, background: C.surf1, border: `1px solid ${C.line}`, color: C.textMid, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1 }}>＋ ADD</button>
        <button onClick={() => setEditOpen(true)} style={{ flexShrink: 0, padding: '11px 12px', borderRadius: 10, background: C.surf1, border: `1px solid ${C.line}`, color: C.textMid, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1 }}>⇅ EDIT</button>
      </div>

      {restEndAt && (
        <RestTimer endsAt={restEndAt} onSkip={skipRest} onAdd={() => setRestEndAt(restEndAt + 15000)} />
      )}

      {pickerOpen && (
        <ExercisePickerSheet onPick={addExercise} onClose={closePicker} />
      )}

      {editOpen && (
        <EditSessionSheet
          exercises={exercises}
          currentIdx={currentIdx}
          onClose={() => setEditOpen(false)}
          onJump={(i) => { setCurrentIdx(i); setEditOpen(false); }}
          onMove={moveExercise}
          onRemove={removeExercise}
          onSwap={(i) => { setSwapIdx(i); setPickerOpen(true); setEditOpen(false); }}
          onToggleSuperset={toggleSuperset}
          onAdd={() => { setPickerOpen(true); setEditOpen(false); }}
        />
      )}

      {askRIR && (
        <RIRModal
          exercise={exercises[askRIR.exIdx]}
          set={exercises[askRIR.exIdx].sets[askRIR.setIdx]}
          onSubmit={submitRIR}
          onCancel={() => setAskRIR(null)}
        />
      )}

      {confirmExit && (
        <ExitConfirmModal
          onResume={() => setConfirmExit(false)}
          onSave={() => { setConfirmExit(false); onExit({ resume: true, exercises, currentIdx }); }}
          onDiscard={() => { setConfirmExit(false); clearActiveDraft(); onExit({ resume: false }); }}
        />
      )}
    </div>
  );
}

// ── "Saved" indicator — the draft hits localStorage synchronously on every
// change; this reflects the cloud mirror's state on top (SAVING… while a push
// is in flight, SAVED otherwise).
function SavedBadge() {
  const [pending, setPending] = React.useState(() => (window.getSyncStatus ? window.getSyncStatus().pending : 0));
  React.useEffect(() => {
    const onStatus = (e) => setPending(e.detail ? e.detail.pending : 0);
    window.addEventListener('compound:syncstatus', onStatus);
    return () => window.removeEventListener('compound:syncstatus', onStatus);
  }, []);
  const saving = pending > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 72, justifyContent: 'flex-end' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: saving ? C.accent : C.success, flexShrink: 0 }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.2, color: saving ? C.accent : C.success }}>
        {saving ? 'SAVING' : 'SAVED'}
      </span>
    </div>
  );
}

// ── Big tap-target stepper ───────────────────────────────────────────────
function BigStepper({ value, display, sub, step, min = 0, onChange }) {
  // Hold-to-repeat: press and hold runs the step every 140ms.
  const timer = React.useRef(null);
  const start = (dir) => {
    onChange(dir * step);
    timer.current = setInterval(() => onChange(dir * step), 140);
  };
  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  React.useEffect(() => stop, []);
  const btn = {
    width: 68, height: 68, borderRadius: 16, border: 0, flexShrink: 0,
    background: C.surf2, color: C.text, cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 600,
    touchAction: 'manipulation',
  };
  return (
    <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <button style={btn} onPointerDown={() => start(-1)} onPointerUp={stop} onPointerLeave={stop} onContextMenu={(e) => e.preventDefault()}>−</button>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 40, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{display}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, color: C.textLow, marginTop: 4 }}>{sub}</div>
      </div>
      <button style={btn} onPointerDown={() => start(1)} onPointerUp={stop} onPointerLeave={stop} onContextMenu={(e) => e.preventDefault()}>＋</button>
    </div>
  );
}

// ── Focus mode: the current exercise, one set at a time ─────────────────
function FocusExercise({ exercise, exNumber, exTotal, partner, onUpdateSet, onConfirmSet, onUpdateNote, onAddSet }) {
  const curIdx = exercise.sets.findIndex((s) => !s.complete);
  const cur = curIdx >= 0 ? exercise.sets[curIdx] : null;
  const isWeighted = exercise.type === 'weighted';
  const isHold = exercise.isHold;

  // Prefill: logged value → AI suggestion (last session + bias) → sane floor.
  const weightShown = cur ? (cur.weight ?? cur.suggested ?? 0) : 0;
  const repsShown = cur ? (cur.reps ?? cur.target ?? 10) : 0;
  const holdShown = cur ? (cur.targetHold ?? 30) : 0;

  const bumpWeight = (d) => cur && onUpdateSet(curIdx, { weight: Math.max(0, Math.round(((cur.weight ?? cur.suggested ?? 0) + d) * 10) / 10) });
  const bumpReps = (d) => cur && onUpdateSet(curIdx, { reps: Math.max(1, (cur.reps ?? cur.target ?? 10) + d) });
  const bumpHold = (d) => cur && onUpdateSet(curIdx, { targetHold: Math.max(5, (cur.targetHold ?? 30) + d) });

  const confirm = () => {
    if (!cur) return;
    // Lock the shown values onto the set so one tap = logged exactly as seen.
    const patch = {};
    if (isWeighted) patch.weight = weightShown;
    if (!isHold) patch.reps = repsShown;
    onUpdateSet(curIdx, patch);
    // Defer a tick so the patch lands before the completion flow reads it.
    setTimeout(() => onConfirmSet(curIdx), 0);
  };

  const confirmLabel = !cur ? 'ALL SETS DONE'
    : isHold ? `✓  Done — ${holdShown}s hold`
    : isWeighted ? `✓  Log set — ${weightShown}kg × ${repsShown}`
    : `✓  Log set — ${repsShown} reps`;

  return (
    <div style={{ padding: '18px 22px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.accent }}>
          {partner ? `SUPERSET 🔗 ${partner.name.toUpperCase()}` : exercise.groups.join(' · ').toUpperCase()}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5, color: C.textLow }}>
          EXERCISE {exNumber} OF {exTotal}
        </span>
      </div>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 34, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '7px 0 0', textTransform: 'uppercase' }}>
        {exercise.name}
      </h1>

      {/* Last session, Hevy-style */}
      <PrevPerfStrip exId={exercise.exId} sets={exercise.sets} isHold={isHold} />

      {/* Set position + last completed set */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.8 }}>
        <span style={{ color: C.textLow }}>
          {cur ? <>SET <span style={{ color: C.accent, fontWeight: 600 }}>{curIdx + 1}</span> OF {exercise.sets.length}{cur.isWarmup ? ' · WARMUP' : ''}</> : 'COMPLETE'}
        </span>
        <DoneDots sets={exercise.sets} curIdx={curIdx} />
      </div>

      {cur && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isWeighted && !isHold && (
            <BigStepper display={<>{Math.floor(weightShown)}<span style={{ fontSize: 16, color: C.textLow }}>{(weightShown % 1 ? '.' + Math.round((weightShown % 1) * 10) : '')}</span></>} sub="KG · ±2.5" step={2.5} onChange={bumpWeight} />
          )}
          {!isHold && (
            <BigStepper display={repsShown} sub={`REPS · TARGET ${cur.target ?? '—'}`} step={1} onChange={bumpReps} />
          )}
          {isHold && (
            <BigStepper display={holdShown} sub="SECONDS · ±5" step={5} onChange={bumpHold} />
          )}

          <button
            onClick={confirm}
            style={{
              width: '100%', height: 64, border: 0, borderRadius: 18, cursor: 'pointer',
              background: C.accent, color: C.onAccent,
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, letterSpacing: 1.4, textTransform: 'uppercase',
              boxShadow: `0 10px 26px ${C.accentDim}`,
            }}
          >
            {confirmLabel}
          </button>
          <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1.6, color: C.textLow }}>
            REST TIMER STARTS AUTOMATICALLY{partner ? ' · NO REST INSIDE THE SUPERSET' : ''}
          </div>

          {isWeighted && weightShown >= 20 && (
            <PlateCalc weight={weightShown} isWarmup={!!cur.isWarmup} />
          )}
        </div>
      )}

      {/* Completed sets recap + add set */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {exercise.sets.map((s, i) => s.complete ? (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10, opacity: 0.72 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, color: C.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 14 14"><path d="M3 7 L6 10 L11 4" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: C.text }}>
              {isHold ? `${s.targetHold ?? '—'}s hold` : isWeighted ? `${s.weight ?? '—'}kg × ${s.reps ?? '—'}` : `${s.reps ?? '—'} reps`}
            </span>
            {s.isWarmup && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 1.2, color: C.textLow }}>WARMUP</span>}
            {s.rir != null && <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1, color: C.textLow }}>RIR {s.rir}</span>}
          </div>
        ) : null)}
        {onAddSet && (
          <button onClick={onAddSet} style={{ padding: '10px 12px', background: 'transparent', border: `1px dashed ${C.lineStrong}`, borderRadius: 12, color: C.textMid, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.6 }}>
            ＋ ADD SET
          </button>
        )}
      </div>

      {/* Quick log (text/voice) + note */}
      <div style={{ marginTop: 12 }}>
        <QuickLogButton
          exercise={exercise}
          onLog={(parsed) => {
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
      <ExerciseNote value={exercise.note || ''} onChange={(v) => onUpdateNote(v)} />
    </div>
  );
}

function DoneDots({ sets, curIdx }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      {sets.map((s, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: s.complete ? C.accent : i === curIdx ? C.accentDim : C.surf3,
          border: i === curIdx && !s.complete ? `1.5px solid ${C.accent}` : '1px solid transparent',
        }} />
      ))}
    </span>
  );
}

// ── Edit session sheet — reorder, remove, swap, superset, add ────────────
function EditSessionSheet({ exercises, currentIdx, onClose, onJump, onMove, onRemove, onSwap, onToggleSuperset, onAdd }) {
  const dc = (e) => e.sets.filter((s) => s.complete).length;
  const iconBtn = { width: 34, height: 34, borderRadius: 9, background: C.surf2, border: `1px solid ${C.line}`, color: C.textMid, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, flexShrink: 0, padding: 0 };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '85%', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 4 }}>EDIT SESSION</div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '0 0 14px' }}>
          Reorder, swap or drop exercises, or link two neighbours into a superset (sets alternate, no rest inside the pair).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {exercises.map((e, i) => {
            const linkedWithNext = exercises[i + 1] && e.superset === exercises[i + 1].id;
            const complete = e.sets.every((s) => s.complete);
            return (
              <React.Fragment key={e.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: i === currentIdx ? C.accentSoft : C.surf1, border: `1px solid ${i === currentIdx ? C.accentDim : C.line}`, borderRadius: 12 }}>
                  <button onClick={() => onJump(i)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.6, color: complete ? C.textLow : C.text, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {String(i + 1).padStart(2, '0')} · {e.name}{e.superset ? ' 🔗' : ''}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: complete ? C.success : C.textLow, letterSpacing: 1, marginTop: 2 }}>
                      {dc(e)}/{e.sets.length} SETS{complete ? ' · DONE' : ''}
                    </div>
                  </button>
                  <button onClick={() => onMove(i, -1)} disabled={i === 0} style={{ ...iconBtn, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => onMove(i, 1)} disabled={i === exercises.length - 1} style={{ ...iconBtn, opacity: i === exercises.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={() => onSwap(i)} style={iconBtn} title="Swap for another exercise">⇄</button>
                  <button onClick={() => onRemove(i)} style={{ ...iconBtn, color: C.danger }} title="Remove">✕</button>
                </div>
                {exercises[i + 1] && (
                  <button
                    onClick={() => onToggleSuperset(i)}
                    style={{ alignSelf: 'center', margin: '-2px 0', padding: '4px 12px', borderRadius: 999, background: linkedWithNext ? C.accentDim : 'transparent', border: `1px dashed ${linkedWithNext ? C.accent : C.line}`, color: linkedWithNext ? C.accent : C.textLow, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1.4, zIndex: 1 }}
                  >
                    {linkedWithNext ? '🔗 SUPERSET — TAP TO UNLINK' : '＋ LINK AS SUPERSET'}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <button onClick={onAdd} style={{ width: '100%', marginTop: 10, padding: '13px 14px', background: 'transparent', border: `1px dashed ${C.accentDim}`, borderRadius: 12, color: C.accent, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          ＋ Add exercise
        </button>
      </div>
    </div>
  );
}

// ── Session timer (counts up since start) ────────────────────────────────
function SessionTimer({ startedAt }) {
  const [start] = React.useState(startedAt || Date.now());
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
          <div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} />
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
function SessionComplete({ exercises, config, onDone, onKeepGoing }) {
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

  // Est. 1RM for EVERY weighted exercise (Epley + RIR, top completed working
  // set) — the deterministic math is the source of truth, not the AI.
  const e1rms = [];
  for (const e of exercises) {
    if (e.type !== 'weighted') continue;
    const best = e.sets
      .filter((s) => s.complete && !s.isWarmup && s.weight && s.reps)
      .map((s) => calc1RM(s.weight, s.reps, s.rir || 0))
      .reduce((m, v) => Math.max(m, v), 0);
    if (best > 0) e1rms.push({ name: e.name, value: best });
  }

  // Bodyweight for kcal math (falls back to 80kg if onboarding is empty)
  let wKg = 80;
  try { const onb = JSON.parse(localStorage.getItem('compound:onboarding') || '{}'); if (onb.weight) wKg = onb.weight; } catch (e) {}
  const metKcal = Math.round((config.duration || 30) * (6 * 3.5 * wKg / 200)); // MET-6 fallback

  // AI debrief — reads the whole session, returns kcal + short insights.
  const [analysis, setAnalysis] = React.useState(null);
  const [aiState, setAiState] = React.useState('loading'); // loading | done | failed
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lines = exercises.map((e) => {
          const done = e.sets.filter((s) => s.complete && !s.isWarmup);
          const setsTxt = done.map((s) =>
            e.type === 'weighted'
              ? `${s.weight || 0}kg×${s.reps || 0}${s.rir != null ? ` @RIR${s.rir}` : ''}`
              : (e.isHold ? `${s.targetHold || 30}s hold` : `${s.reps || s.target || 0} reps`)
          ).join(', ');
          return `${e.name}: ${setsTxt || 'no completed sets'}`;
        }).join('\n');
        const oneRms = e1rms.map((r) => `${r.name} ${r.value}kg`).join('; ');
        const raw = await window.claude.complete(`You are COMPOUND's strength coach. A ${wKg}kg person just finished a ~${config.duration} minute resistance session:
${lines}
${oneRms ? `Estimated 1RMs already computed (Epley + RIR): ${oneRms}.` : ''}
Respond ONLY JSON: {"kcal": <integer total calories burned for the whole session — realistic for resistance training at this bodyweight (roughly 5-10 kcal per minute; intense high-volume work trends higher, long rests lower)>, "insights": ["2-3 short, specific, encouraging observations about THIS session — progression cues for next time, load balance across muscle groups, notable efforts. Each under 120 characters, no fluff."]}`);
        const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
        if (!m) throw new Error('no json');
        const obj = JSON.parse(m[0]);
        // Sanity clamp: never stray past 0.5×–2× the MET-based figure.
        let kcal = Math.round(+obj.kcal || 0);
        kcal = kcal ? Math.max(Math.round(metKcal * 0.5), Math.min(Math.round(metKcal * 2), kcal)) : metKcal;
        if (!active) return;
        setAnalysis({ kcal, insights: Array.isArray(obj.insights) ? obj.insights.slice(0, 3).map(String) : [] });
        setAiState('done');
      } catch (e) { if (active) setAiState('failed'); }
    })();
    return () => { active = false; };
  }, []);

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

      {/* AI debrief — calories + coaching notes read from the actual sets */}
      <div style={{ marginTop: 18, padding: '14px 16px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡</span> AI DEBRIEF
        </div>
        {aiState === 'loading' ? (
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke={C.line} strokeWidth="2" fill="none" />
              <path d="M8 2 a6 6 0 0 1 6 6" stroke={C.accent} strokeWidth="2" fill="none" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" />
              </path>
            </svg>
            Reading your session…
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 600, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
                {analysis ? analysis.kcal : metKcal}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid, letterSpacing: 1 }}>
                KCAL BURNED{aiState === 'failed' ? ' · FORMULA EST.' : ''}
              </span>
            </div>
            {analysis && analysis.insights.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {analysis.insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.45, flexShrink: 0 }}>›</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text, lineHeight: 1.45 }}>{ins}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Est. 1RM per lift (Epley + RIR from the top completed working set) */}
      {e1rms.length > 0 && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 2.5, marginBottom: 6 }}>
            EST. 1RM · THIS SESSION
          </div>
          {e1rms.map((r) => (
            <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {r.name}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                {r.value}<span style={{ fontSize: 10, color: C.textLow, marginLeft: 2 }}>KG</span>
              </span>
            </div>
          ))}
        </div>
      )}

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

      {/* Save as a reusable routine — generated sessions only. The custom sheet
          is already saved as a completed workout the moment Finish is hit, and
          offering a second "save" there read as if the workout wasn't logged. */}
      {!config.custom && (
        <div style={{ marginTop: 8 }}>
          <SaveAsRoutineCard session={exercises} config={config} />
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onKeepGoing && (
          <button
            onClick={onKeepGoing}
            style={{ width: '100%', height: 48, background: 'transparent', border: `1px dashed ${C.accentDim}`, borderRadius: 12, color: C.accent, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            ＋ Not done — add another exercise
          </button>
        )}
        <PrimaryButton onClick={() => onDone(analysis)}>Back to Workout</PrimaryButton>
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
  WorkoutSession, SessionComplete, loadActiveDraft, clearActiveDraft,
});

export { BigStepper, CompleteStat, EditSessionSheet, ExitConfirmModal, FocusExercise, RIRModal, RestTimer, SessionComplete, SessionTimer, WorkoutSession, clearActiveDraft, loadActiveDraft };

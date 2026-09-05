import React from 'react';
import { C } from './compound-ui.jsx';
import { EXERCISES, buildSessionItem } from './workout-data.jsx';

// custom-workout.jsx — Build-your-own workout, spreadsheet-style. One scrolling
// page: every exercise you've added stays visible with plain kg × reps rows —
// no per-set tick, no RIR question, no rest timer. Add exercises and sets as
// you go; the AI only kicks in at the end, when you hit Finish (the normal
// SessionComplete screen runs the debrief + 1RMs there).
//
// The in-progress sheet persists to localStorage on every change, so backing
// out or reloading mid-workout doesn't lose it.

const DRAFT_KEY = 'compound:customDraft';

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { return null; }
}
function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

// ── Type-to-search picker (bottom sheet) ────────────────────────────────────
function ExercisePickerSheet({ excludeIds = [], onPick, onClose }) {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  const results = q
    ? EXERCISES.filter((e) =>
        !excludeIds.includes(e.id) &&
        (e.name.toLowerCase().includes(q) || e.groups.some((g) => g.toLowerCase().includes(q))))
      .slice(0, 8)
    : [];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '80vh', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 10 }}>ADD AN EXERCISE</div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — bench, row, curl, legs…"
          style={{ width: '100%', boxSizing: 'border-box', background: C.surf1, border: `1px solid ${q ? C.accentDim : C.line}`, borderRadius: 12, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 15, padding: '13px 14px', outline: 'none' }}
        />
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
          {q && results.length === 0 && (
            <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 10, padding: '12px 14px', fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid }}>
              Nothing matches "{query}" — try a muscle group (chest, back, legs…) or a shorter word.
            </div>
          )}
          {!q && (
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, padding: '8px 2px' }}>
              Type to search the library — it lands on the sheet with 3 empty rows.
            </div>
          )}
          {results.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e)}
              style={{ width: '100%', textAlign: 'left', padding: '11px 13px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15.5, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase' }}>{e.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1, marginTop: 2 }}>
                  {e.groups.join(' · ').toUpperCase()}{e.type === 'bodyweight' ? ' · BODYWEIGHT' : ''}
                </div>
              </div>
              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: C.accent + '1f', border: `1px solid ${C.accent}66`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 15 }}>+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── The sheet ────────────────────────────────────────────────────────────────
function CustomWorkoutLog({ user, onExit, onComplete }) {
  const draft = React.useMemo(loadDraft, []);
  const [exercises, setExercises] = React.useState(() => (draft && draft.exercises) || []);
  const [startedAt] = React.useState(() => (draft && draft.startedAt) || Date.now());
  const [pickerOpen, setPickerOpen] = React.useState(() => !(draft && draft.exercises && draft.exercises.length));
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // Persist on every change — reload or accidental back never loses the sheet.
  React.useEffect(() => {
    if (exercises.length) saveDraft({ startedAt, exercises });
  }, [exercises, startedAt]);

  const addExercise = (libEx) => {
    // durationMin 10 keeps buildSessionItem from prepending a warmup set —
    // the sheet is freeform, warmups are just rows you choose to log.
    const item = buildSessionItem(libEx, { durationMin: 10, preFeel: 0, idx: exercises.length, setsPerExercise: 3 });
    item.sets = item.sets.map((s) => ({ ...s, reps: null }));
    setExercises((all) => [...all, item]);
    setPickerOpen(false);
  };
  const removeExercise = (id) => setExercises((all) => all.filter((e) => e.id !== id));
  const addSet = (id) => setExercises((all) => all.map((e) => {
    if (e.id !== id) return e;
    const last = e.sets[e.sets.length - 1] || {};
    return { ...e, sets: [...e.sets, { target: last.target ?? 10, targetHold: last.targetHold ?? null, suggested: last.weight ?? last.suggested ?? null, weight: last.weight ?? null, reps: null, rir: null, complete: false, isWarmup: false }] };
  }));
  const removeLastSet = (id) => setExercises((all) => all.map((e) => (e.id === id && e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e)));
  const updateSet = (id, setIdx, patch) => setExercises((all) => all.map((e) => {
    if (e.id !== id) return e;
    const sets = [...e.sets];
    sets[setIdx] = { ...sets[setIdx], ...patch };
    return { ...e, sets };
  }));

  const loggedSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.reps != null || (e.isHold && s.weight != null)).length, 0);

  const finish = () => {
    // A row counts once it has reps (holds count on any entry). Ticks are gone —
    // Finish is the single confirmation for the whole sheet, and it SAVES the
    // completed workout right here: history, volume, 1RMs and the week strip
    // all have it even if the app is closed on the debrief screen.
    const finalExercises = exercises
      .map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, rir: null, complete: e.isHold ? true : s.reps != null && s.reps > 0 })) }))
      .filter((e) => e.sets.some((s) => s.complete));
    const durationMin = Math.max(5, Math.round((Date.now() - startedAt) / 60000));
    const groups = new Set();
    finalExercises.forEach((e) => (e.groups || []).forEach((g) => groups.add(g)));
    const config = { location: (user && user.equipment) || 'gym', duration: durationMin, groups: [...groups], preFeel: 0, custom: true };
    let entryId = null;
    if (window.recordWorkout) {
      try {
        const { list } = window.recordWorkout(finalExercises, config);
        entryId = list[list.length - 1] && list[list.length - 1].id;
      } catch (e) {}
    }
    clearDraft();
    setDone({ exercises: finalExercises, config, entryId });
  };

  // Finish → the normal completion screen: stats, EST. 1RM per lift, and the
  // AI debrief (kcal + insights) — this is the ONLY place AI runs. The workout
  // is already recorded; the debrief just patches its AI kcal onto the entry.
  if (done) {
    const SessionComplete = window.SessionComplete;
    return (
      <SessionComplete
        exercises={done.exercises}
        config={done.config}
        onDone={(analysis) => {
          if (analysis && analysis.kcal != null && done.entryId && window.updateWorkout) {
            try { window.updateWorkout(done.entryId, { aiKcal: Math.round(analysis.kcal), aiInsights: analysis.insights || [] }); } catch (e) {}
          }
          onComplete();
        }}
      />
    );
  }

  const inputStyle = (filled) => ({
    width: '100%', boxSizing: 'border-box',
    background: C.surf2, border: `1px solid ${filled ? C.accentDim : C.line}`, borderRadius: 8,
    fontFamily: 'JetBrains Mono, monospace', fontSize: 17, fontWeight: 600,
    color: filled ? C.accent : C.text,
    outline: 0, padding: '9px 6px', textAlign: 'center',
  });

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button
          onClick={() => (exercises.length ? setConfirmExit(true) : (clearDraft(), onExit()))}
          style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>EXIT</span>
        </button>
        <ElapsedTimer startedAt={startedAt} />
        <div style={{ width: 70, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5, color: C.textLow }}>
          {loggedSets} SET{loggedSets === 1 ? '' : 'S'}
        </div>
      </div>

      {/* The sheet — every exercise stays visible */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 12px' }}>
        {exercises.length === 0 && (
          <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '22px 16px', textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
            Empty sheet. Add your first exercise below and fill in kg × reps as you train.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exercises.map((e, idx) => (
            <div key={e.id} style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', lineHeight: 1.05 }}>
                    {String(idx + 1).padStart(2, '0')} · {e.name}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.2, marginTop: 3 }}>{(e.groups || []).join(' · ').toUpperCase()}</div>
                </div>
                <button onClick={() => removeExercise(e.id)} title="Remove exercise" style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: 'transparent', border: `1px solid ${C.line}`, color: C.textLow, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1 }}>✕</button>
              </div>

              {/* Column labels */}
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 8, marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: C.textLow, letterSpacing: 1.4 }}>
                <span>SET</span>
                <span style={{ textAlign: 'center' }}>{e.type === 'weighted' ? 'KG' : (e.isHold ? 'SECONDS' : '—')}</span>
                <span style={{ textAlign: 'center' }}>{e.isHold ? '' : 'REPS'}</span>
              </div>

              {/* Rows — just numbers, no ticks, no questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {e.sets.map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textLow, textAlign: 'center' }}>{i + 1}</span>
                    {e.isHold ? (
                      <>
                        <input type="number" inputMode="numeric" value={s.weight ?? ''} placeholder={String(s.targetHold || 30)}
                          onChange={(ev) => updateSet(e.id, i, { weight: ev.target.value ? Number(ev.target.value) : null })}
                          style={inputStyle(s.weight != null)} />
                        <span />
                      </>
                    ) : (
                      <>
                        {e.type === 'weighted' ? (
                          <input type="number" inputMode="decimal" value={s.weight ?? ''} placeholder={s.suggested != null ? String(s.suggested) : '··'}
                            onChange={(ev) => updateSet(e.id, i, { weight: ev.target.value ? Number(ev.target.value) : null })}
                            style={inputStyle(s.weight != null)} />
                        ) : (
                          <span style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow }}>BW</span>
                        )}
                        <input type="number" inputMode="numeric" value={s.reps ?? ''} placeholder="··"
                          onChange={(ev) => updateSet(e.id, i, { reps: ev.target.value ? Number(ev.target.value) : null })}
                          style={inputStyle(s.reps != null)} />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => addSet(e.id)} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: `1px dashed ${C.lineStrong}`, borderRadius: 10, color: C.textMid, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: 1.4 }}>＋ SET</button>
                {e.sets.length > 1 && (
                  <button onClick={() => removeLastSet(e.id)} style={{ width: 60, padding: '8px 0', background: 'transparent', border: `1px dashed ${C.line}`, borderRadius: 10, color: C.textLow, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: 1.4 }}>−</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add the next exercise — everything above stays put */}
        <button
          onClick={() => setPickerOpen(true)}
          style={{ width: '100%', marginTop: 12, padding: '14px 14px', background: 'transparent', border: `1px dashed ${C.accentDim}`, borderRadius: 12, color: C.accent, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          ＋ Add exercise
        </button>
      </div>

      {/* Finish — this is where the AI kicks in, not before */}
      <div style={{ flexShrink: 0, padding: '12px 22px 20px', borderTop: `1px solid ${C.line}`, background: C.bg }}>
        <button
          onClick={finish}
          disabled={!loggedSets}
          style={{ width: '100%', height: 52, background: loggedSets ? C.accent : C.surf3, border: 0, borderRadius: 12, color: loggedSets ? C.onAccent : C.textLow, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: loggedSets ? 'pointer' : 'default' }}
        >
          {loggedSets ? `Finish workout — ${loggedSets} set${loggedSets === 1 ? '' : 's'} logged` : 'Log a set to finish'}
        </button>
      </div>

      {pickerOpen && <ExercisePickerSheet onPick={addExercise} onClose={() => setPickerOpen(false)} />}

      {confirmExit && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 230, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <div style={{ width: '100%', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              LEAVE THE<br /><span style={{ color: C.accent }}>SHEET?</span>
            </h3>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, margin: '10px 0 18px', lineHeight: 1.5 }}>
              It's saved — coming back to Build My Own picks up right where you left off.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setConfirmExit(false)} style={{ height: 48, background: C.accent, border: 0, borderRadius: 12, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer' }}>Keep going</button>
              <button onClick={() => { setConfirmExit(false); onExit(); }} style={{ height: 46, background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 12, color: C.text, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer' }}>Save & exit</button>
              <button onClick={() => { clearDraft(); setConfirmExit(false); onExit(); }} style={{ height: 40, background: 'transparent', border: 0, color: C.danger, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', cursor: 'pointer' }}>Discard workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ElapsedTimer({ startedAt }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, color: C.accent, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>
      {mm}:{ss}
    </div>
  );
}

// True when there's an unfinished sheet to resume (for the hub card's subtitle).
function hasCustomDraft() {
  const d = loadDraft();
  return !!(d && d.exercises && d.exercises.length);
}

Object.assign(window, { CustomWorkoutLog, ExercisePickerSheet, hasCustomDraft });

export { CustomWorkoutLog, ExercisePickerSheet, hasCustomDraft };

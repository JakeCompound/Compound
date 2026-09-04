import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';
import { EXERCISES, buildSessionItem } from './workout-data.jsx';
import { SubHeader } from './workout-dashboard.jsx';

// custom-workout.jsx — Build-your-own session. Search the exercise library
// (everything the Reeplex + bench + bar/DB setup supports), pick how many sets
// each, then the normal live session flow logs weight/reps per set, and the
// completion screen's AI debrief reads it back (kcal, 1RMs, insights).

function CustomWorkoutBuilder({ user, onBack, onStart }) {
  const [query, setQuery] = React.useState('');
  const [picked, setPicked] = React.useState([]); // [{ exId, sets }]

  const q = query.trim().toLowerCase();
  const results = q
    ? EXERCISES.filter((e) =>
        !picked.some((p) => p.exId === e.id) &&
        (e.name.toLowerCase().includes(q) || e.groups.some((g) => g.toLowerCase().includes(q))))
      .slice(0, 8)
    : [];

  const add = (e) => { setPicked((p) => [...p, { exId: e.id, sets: 3 }]); setQuery(''); };
  const remove = (exId) => setPicked((p) => p.filter((x) => x.exId !== exId));
  const bumpSets = (exId, d) => setPicked((p) => p.map((x) => (x.exId === exId ? { ...x, sets: Math.max(1, Math.min(8, x.sets + d)) } : x)));

  const totalSets = picked.reduce((s, p) => s + p.sets, 0);
  // Rough pacing guide only (~2.5 min a set incl. rest) — the completion screen
  // and AI debrief use this as the session length.
  const estMin = Math.max(10, Math.round((totalSets * 2.5) / 5) * 5);

  const start = () => {
    if (!picked.length) return;
    const groups = new Set();
    const session = picked.map((p, idx) => {
      const e = EXERCISES.find((x) => x.id === p.exId);
      e.groups.forEach((g) => groups.add(g));
      return buildSessionItem(e, { durationMin: estMin, preFeel: 0, idx, setsPerExercise: p.sets });
    });
    onStart({
      config: { location: (user && user.equipment) || 'gym', duration: estMin, groups: [...groups], preFeel: 0, custom: true },
      session,
    });
  };

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="BUILD MY OWN" sub="any exercise · your structure" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 12px' }}>
        {/* Type-to-search — no scrolling through the whole library */}
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>ADD AN EXERCISE</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — bench, row, curl, legs…"
          style={{ width: '100%', boxSizing: 'border-box', background: C.surf1, border: `1px solid ${q ? C.accentDim : C.line}`, borderRadius: 12, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 15, padding: '13px 14px', outline: 'none' }}
        />

        {q && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.length === 0 && (
              <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 10, padding: '12px 14px', fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid }}>
                Nothing matches "{query}" — try a muscle group (chest, back, legs…) or a shorter word.
              </div>
            )}
            {results.map((e) => (
              <button
                key={e.id}
                onClick={() => add(e)}
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
        )}

        {/* The session so far */}
        <div style={{ marginTop: 20 }}>
          <SectionLabel meta={picked.length ? `${picked.length} ${picked.length === 1 ? 'EXERCISE' : 'EXERCISES'} · ${totalSets} SETS` : ''}>YOUR SESSION</SectionLabel>
          {picked.length === 0 ? (
            <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
              Search above and tap <span style={{ color: C.accent }}>+</span> to build your session. Weight and reps get logged set-by-set once you start.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {picked.map((p, i) => {
                const e = EXERCISES.find((x) => x.id === p.exId);
                return (
                  <div key={p.exId} style={{ padding: '12px 12px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: C.surf2, color: C.textLow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15.5, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1, marginTop: 2 }}>{e.groups.join(' · ').toUpperCase()}</div>
                    </div>
                    {/* Sets stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', height: 28, borderRadius: 14, border: `1px solid ${C.accent}55`, background: C.accent + '14', overflow: 'hidden', flexShrink: 0 }}>
                      <button onClick={() => bumpSets(p.exId, -1)} disabled={p.sets <= 1} style={{ width: 26, height: 28, background: 'transparent', border: 0, borderRight: `1px solid ${C.accent}33`, color: p.sets > 1 ? C.accent : C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, lineHeight: 1, cursor: p.sets > 1 ? 'pointer' : 'default' }}>−</button>
                      <div style={{ width: 44, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: C.accent, letterSpacing: 0.5 }}>{p.sets} SET{p.sets > 1 ? 'S' : ''}</div>
                      <button onClick={() => bumpSets(p.exId, 1)} style={{ width: 26, height: 28, background: 'transparent', border: 0, borderLeft: `1px solid ${C.accent}33`, color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 15, lineHeight: 1, cursor: 'pointer' }}>+</button>
                    </div>
                    <button onClick={() => remove(p.exId)} title="Remove" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: 'rgba(229,86,75,.14)', border: '1px solid rgba(229,86,75,.5)', color: C.danger, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky start */}
      <div style={{ flexShrink: 0, padding: '12px 22px 20px', borderTop: `1px solid ${C.line}`, background: C.bg }}>
        <button
          onClick={start}
          disabled={!picked.length}
          style={{ width: '100%', height: 52, background: picked.length ? C.accent : C.surf3, border: 0, borderRadius: 12, color: picked.length ? C.onAccent : C.textLow, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: picked.length ? 'pointer' : 'default' }}
        >
          {picked.length ? `Start workout — ${picked.length} ${picked.length === 1 ? 'exercise' : 'exercises'} · ~${estMin}m` : 'Add an exercise to start'}
        </button>
      </div>
    </div>
  );
}

// Bottom-sheet version of the same type-to-search picker — used INSIDE a live
// session so a workout can be made up as you go: finish an exercise, search,
// add the next one on the spot.
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
              Type to search the library — it's added to this session with 3 sets (log as many as you actually do).
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

Object.assign(window, { CustomWorkoutBuilder, ExercisePickerSheet });

export { CustomWorkoutBuilder, ExercisePickerSheet };

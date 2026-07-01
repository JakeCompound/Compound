import React from 'react';
import { C, Stepper } from './compound-ui.jsx';

// three-rings.jsx — Home hero: three north-star progress rings.
// Weekly Nips (red over limit) · Workouts /target (green at target, red when unmakeable) · Life Score.

function ProgressRing({ size = 100, stroke = 8, fraction, color, track = 'rgba(255,255,255,.08)', glow }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    setT(0);
    let raf, done = false;
    const start = performance.now();
    const tick = (now) => {
      if (done) return;
      const p = Math.min(1, (now - start) / 800);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fb = setTimeout(() => { if (!done) setT(1); }, 1000);
    return () => { done = true; cancelAnimationFrame(raf); clearTimeout(fb); };
  }, [fraction, color]);
  const shown = f * t;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circ * shown} ${circ}`}
        style={{ filter: glow ? `drop-shadow(0 0 8px ${color}88)` : 'none' }}
      />
    </svg>
  );
}

function NorthStarRing({ size, fraction, color, glow, onClick, top, value, unit, label, sub }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        transform: pressed ? 'scale(0.96)' : 'scale(1)', transition: 'transform .1s',
        flex: 1, minWidth: 0,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <ProgressRing size={size} fraction={fraction} color={color} glow={glow} />
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          }}
        >
          {top && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 1.5, color: C.textLow }}>
              {top}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 30, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </span>
            {unit && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid }}>{unit}</span>}
          </div>
          {sub && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1, color: C.textLow, marginTop: 1 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, letterSpacing: 1.2, color: C.text, textTransform: 'uppercase' }}>
        {label}
      </div>
    </button>
  );
}

function ThreeRings({ state, onOpenCheckin, onGoWorkout, onChanged, alcohol = true }) {
  const limit = state.nipLimit || 55;
  const [showNip, setShowNip] = React.useState(false);

  const ringSize = 104;

  // Nips
  const nips = state.weeklyNips || 0;
  const overLimit = nips > limit;
  const nipColor = overLimit ? C.danger : nips >= limit * 0.85 ? '#E8A23F' : C.accent;
  const nipFraction = limit > 0 ? nips / limit : 0;

  // Workouts
  const wTarget = state.workoutsTarget || 3;
  const wDone = state.weeklyWorkouts != null ? state.weeklyWorkouts : (state.workoutsDone || 0);
  const wLeft = Math.max(0, wTarget - wDone);
  const daysLeft = state.daysLeftInWeek != null ? state.daysLeftInWeek : 7;
  const wComplete = wDone >= wTarget;
  const wUnmakeable = !wComplete && wLeft > daysLeft;
  const wColor = wComplete ? C.success : wUnmakeable ? C.danger : C.accent;
  const wFraction = wTarget > 0 ? wDone / wTarget : 0;

  // Life score
  const score = window.computeLifeScore ? window.computeLifeScore(state.metrics || {}) : 0;
  const scoreColor = score >= 80 ? C.success : score >= 40 ? C.accent : score > 0 ? '#E8A23F' : C.textLow;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
        {alcohol && (
          <NorthStarRing
            size={ringSize}
            fraction={overLimit ? 1 : nipFraction}
            color={nipColor}
            glow={overLimit}
            onClick={() => setShowNip(true)}
            value={nips}
            sub={`/ ${limit}`}
            label="Wk Nips"
          />
        )}
        <NorthStarRing
          size={ringSize}
          fraction={wFraction}
          color={wColor}
          glow={wComplete}
          onClick={onGoWorkout}
          value={wDone}
          sub={`/ ${wTarget}`}
          label="Workouts"
        />
        <NorthStarRing
          size={ringSize}
          fraction={score / 100}
          color={scoreColor}
          glow={score >= 80}
          onClick={onOpenCheckin}
          value={score}
          sub="/ 100"
          label="Life Score"
        />
      </div>

      {/* Status line */}
      {(() => {
        const workoutMsg = wComplete ? 'Workouts done.' : wUnmakeable ? `${wLeft} workouts, ${daysLeft} days — tight.` : `${wLeft} workouts to go.`;
        const alarm = alcohol && overLimit;
        return (
          <div
            style={{
              marginTop: 12, padding: '8px 14px',
              background: alarm ? 'rgba(229,86,75,.10)' : C.surf1,
              border: `1px solid ${alarm ? 'rgba(229,86,75,.35)' : C.line}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 4, background: alarm ? C.danger : (alcohol ? nipColor : wColor), flexShrink: 0 }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: alarm ? C.text : C.textMid, lineHeight: 1.4 }}>
              {!alcohol
                ? workoutMsg
                : overLimit
                  ? `${nips - limit} over your weekly limit.`
                  : `${Math.max(0, limit - nips)} nips left this week. ${workoutMsg}`}
            </span>
          </div>
        );
      })()}

      {showNip && window.NipQuickAdd && (
        <window.NipQuickAdd onClose={() => setShowNip(false)} onChanged={onChanged} />
      )}
    </div>
  );
}

function NipLimitSheet({ value, weekly, onSave, onClose }) {
  const [v, setV] = React.useState(value);
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
          WEEKLY NIP LIMIT
        </div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase' }}>
          SET THE CAP.<br /><span style={{ color: C.accent }}>TAPER 5–10, NO HERO CUTS.</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '10px 0 16px' }}>
          Logged so far this week: <span style={{ color: C.accent, fontWeight: 600 }}>{weekly} nips</span>. Set next week's ceiling each Sunday.
        </p>
        <div style={{ margin: '6px 0 18px' }}>
          <Stepper value={v} onChange={setV} min={0} max={150} step={1} unit="nips / week" large />
        </div>
        <button
          onClick={() => onSave(v)}
          style={{
            width: '100%', height: 52, background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.6,
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Set limit
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ThreeRings, ProgressRing });

export { NipLimitSheet, NorthStarRing, ProgressRing, ThreeRings };

import React from 'react';
import { C } from './compound-ui.jsx';

// home-components.jsx — Visual building blocks for the Home tab
// Life Score arc, radar chart, streak cards, week strip, etc.

// ── Life Score arc (animated) ─────────────────────────────────────────────
function LifeScoreArc({ value, label = 'LIFE SCORE', size = 220 }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    setProgress(0);
    let raf;
    let cancelled = false;
    const start = performance.now();
    const tick = (t) => {
      if (cancelled) return;
      const p = Math.min(1, (t - start) / 1200);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Safety fallback — if rAF is throttled or never fires (e.g. tab inactive),
    // snap to final value after the intended duration so the score is never stuck at 0.
    const fallback = setTimeout(() => { if (!cancelled) setProgress(1); }, 1400);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [value]);

  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.78;
  const fullDash = circ * arcFraction;
  const filled = fullDash * (value / 100) * progress;
  const trackOffset = 0;

  // status text
  const status =
    value >= 80 ? 'LOCKED IN' :
    value >= 60 ? 'ON TRACK' :
    value >= 40 ? 'BUILDING' :
    value > 0   ? 'SHOWING UP' :
                  'FIRST LIGHT';

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-220deg)' }}>
        <defs>
          <linearGradient id="scoreArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2A30F" />
            <stop offset="100%" stopColor="#B36F00" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="6"
          strokeDasharray={`${fullDash} ${circ}`}
          strokeDashoffset={trackOffset}
          strokeLinecap="round"
        />
        {/* fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreArc)"
          strokeWidth="6"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 14px rgba(242,163,15,.45))', transition: 'stroke-dasharray .4s' }}
        />
        {/* tick marks every 10% */}
        {Array.from({ length: 11 }).map((_, i) => {
          const frac = i / 10;
          const angle = arcFraction * frac;
          const a = (angle * 2 * Math.PI);
          const cx = size / 2 + Math.cos(a) * (r + 8);
          const cy = size / 2 + Math.sin(a) * (r + 8);
          const ix = size / 2 + Math.cos(a) * (r + 4);
          const iy = size / 2 + Math.sin(a) * (r + 4);
          return (
            <line
              key={i}
              x1={ix} y1={iy} x2={cx} y2={cy}
              stroke={value/100 >= frac ? '#F2A30F' : 'rgba(255,255,255,.18)'}
              strokeWidth="1"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2.5, color: C.textLow }}>
          {label}
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 64,
            fontWeight: 600,
            color: C.text,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            marginTop: 2,
          }}
        >
          {Math.round(value * progress)}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.5, marginTop: 6 }}>
          {status}
        </div>
      </div>
    </div>
  );
}

// ── Streak card ──────────────────────────────────────────────────────────
function StreakCard({ glyph, label, current, best, next, hot }) {
  const pct = next > 0 ? Math.min(1, current / next) : 0;
  return (
    <div
      style={{
        minWidth: 138,
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: '14px 14px 12px',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{glyph}</span>
        {hot && (
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 1.5,
              color: C.accent, background: C.accentDim, padding: '2px 6px', borderRadius: 4,
            }}
          >
            ON FIRE
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, color: C.textLow }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 32,
          color: hot ? C.accent : C.text, fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1, marginTop: 2,
        }}
      >
        {current}
        <span style={{ fontSize: 12, color: C.textMid, marginLeft: 4 }}>days</span>
      </div>
      <div style={{ height: 3, background: C.surf2, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: C.accent }} />
      </div>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 6,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.2, color: C.textLow,
        }}
      >
        <span>BEST {best}</span>
        <span>NEXT {next}</span>
      </div>
    </div>
  );
}

// ── Life Balance Radar ────────────────────────────────────────────────────
function LifeBalanceRadar({ values, size = 240 }) {
  const axes = Object.keys(values);
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;

  const point = (axisIndex, value) => {
    const angle = (Math.PI * 2 * axisIndex) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r * value, cy + Math.sin(angle) * r * value];
  };

  // grid rings at 0.25, 0.5, 0.75, 1
  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = axes.map((a, i) => point(i, values[a]));
  const polyData = dataPoints.map((p) => p.join(',')).join(' ');

  // also animate
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    setT(0);
    let raf;
    let cancelled = false;
    const start = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const p = Math.min(1, (now - start) / 900);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fallback = setTimeout(() => { if (!cancelled) setT(1); }, 1100);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [values]);

  const animatedData = axes.map((a, i) => point(i, values[a] * t));
  const animatedPoly = animatedData.map((p) => p.join(',')).join(' ');

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* rings */}
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={axes.map((a, i) => point(i, ring).join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="1"
          />
        ))}
        {/* spokes */}
        {axes.map((a, i) => {
          const [x, y] = point(i, 1);
          return <line key={a} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.07)" strokeWidth="1" />;
        })}
        {/* filled polygon */}
        <polygon points={animatedPoly} fill="rgba(242,163,15,.18)" stroke="#F2A30F" strokeWidth="1.5" strokeLinejoin="round" />
        {/* node dots */}
        {animatedData.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={C.accent} />
        ))}
      </svg>
      {/* axis labels */}
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 24);
        const ly = cy + Math.sin(angle) * (r + 24);
        return (
          <div
            key={a}
            style={{
              position: 'absolute',
              left: lx, top: ly,
              transform: 'translate(-50%, -50%)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              letterSpacing: 1.5,
              color: C.textMid,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <div>{a.toUpperCase()}</div>
            <div style={{ color: C.accent, fontWeight: 600, fontSize: 11, marginTop: 1 }}>
              {Math.round(values[a] * 100)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── This-week strip ──────────────────────────────────────────────────────
function WeekStrip({ days }) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {days.map((d, i) => {
        const future = d.future;
        const today = d.today;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 10,
              padding: '10px 4px 8px',
              background: today ? C.accentSoft : C.surf1,
              border: today ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
              opacity: future ? 0.45 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                fontWeight: 600,
                color: today ? C.accent : C.text,
                letterSpacing: 1,
              }}
            >
              {labels[i]}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <DayDot kind="checkin" on={d.checkin} future={future} />
              <DayDot kind="workout" on={d.workout} future={future} />
              <DayDot kind="spirit" on={d.spirit} future={future} />
              <DayDot kind="afd" on={d.afd} future={future} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayDot({ kind, on, future }) {
  const color = on ? C.accent : (future ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.15)');
  // tiny glyphs
  const size = 12;
  if (kind === 'checkin') return <svg width={size} height={size} viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill={color} /></svg>;
  if (kind === 'workout') return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <rect x="1" y="5" width="2" height="2" fill={color} />
      <rect x="9" y="5" width="2" height="2" fill={color} />
      <rect x="3.5" y="4" width="1.2" height="4" fill={color} />
      <rect x="7.3" y="4" width="1.2" height="4" fill={color} />
      <rect x="4.6" y="5.4" width="2.8" height="1.2" fill={color} />
    </svg>
  );
  if (kind === 'spirit') return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <path d="M2 2 L2 10 L6 8.5 L10 10 L10 2 Z" fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
  if (kind === 'afd') return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <circle cx="6" cy="6" r="3.4" fill="none" stroke={color} strokeWidth="1" />
      <line x1="3.5" y1="3.5" x2="8.5" y2="8.5" stroke={color} strokeWidth="1" />
    </svg>
  );
  return null;
}

// ── Tonight's check-in CTA card ──────────────────────────────────────────
function CheckinCard({ time, done, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left',
        padding: '18px 18px',
        background: done ? C.surf1 : C.surf2,
        border: done ? `1px solid ${C.line}` : `1px solid ${C.accentDim}`,
        borderRadius: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {!done && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 90% 50%, rgba(242,163,15,.10), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          width: 46, height: 46, borderRadius: 12,
          background: done ? C.surf3 : C.accent,
          color: done ? C.text : '#0A0A0C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {done ? (
          <svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 11 L9 15 L17 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.6" />
            <line x1="7" y1="3" x2="7" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="15" y1="3" x2="15" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: done ? C.success : C.accent, marginBottom: 4 }}>
          {done ? 'CHECK-IN COMPLETE' : `TONIGHT · ${time || '21:00'}`}
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 1, textTransform: 'uppercase', color: C.text, lineHeight: 1.1 }}>
          {done ? 'See you tomorrow.' : 'Reflect for 90 seconds.'}
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, marginTop: 4 }}>
          {done ? '9 / 9 questions answered.' : '9 short questions. The signal is the consistency.'}
        </div>
      </div>
      {!done && (
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: C.accent, zIndex: 1 }}>
          <path d="M3 7 L11 7 M7 3 L11 7 L7 11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Workout-remaining urgency banner ──────────────────────────────────────
function WorkoutBanner({ done, target, daysLeft }) {
  const remaining = Math.max(0, target - done);
  const urgent = remaining > 0 && remaining >= daysLeft;
  const complete = remaining === 0;

  return (
    <div
      style={{
        padding: '14px 16px',
        background: complete ? C.surf1 : urgent ? 'rgba(229,86,75,.08)' : C.surf1,
        border: `1px solid ${complete ? C.line : urgent ? 'rgba(229,86,75,.35)' : C.line}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: complete ? C.surf2 : urgent ? 'rgba(229,86,75,.14)' : C.surf2,
          color: complete ? C.success : urgent ? C.danger : C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="1" y="7" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="17" y="7" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="3.5" y="5" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="13.5" y="5" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="6" y="9" width="8" height="2" fill="currentColor" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: urgent ? C.danger : C.textLow, marginBottom: 2 }}>
          {complete ? 'WEEK COMPLETE' : urgent ? 'TIGHT MARGIN' : 'WORKOUTS THIS WEEK'}
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase', color: C.text }}>
          {complete
            ? `${done} / ${target} done. Anything extra is profit.`
            : `${remaining} ${remaining === 1 ? 'workout' : 'workouts'} in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
          fontSize: 22,
          color: complete ? C.success : urgent ? C.danger : C.accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {done}<span style={{ fontSize: 13, color: C.textMid }}>/{target}</span>
      </div>
    </div>
  );
}

// ── AI Insight card ───────────────────────────────────────────────────────
function InsightCard({ insight }) {
  return (
    <div
      style={{
        padding: '18px 18px',
        background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -40, top: -40, width: 140, height: 140,
          background: 'radial-gradient(circle, rgba(242,163,15,.22), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, position: 'relative' }}>
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 1 L7.2 4.8 L11 6 L7.2 7.2 L6 11 L4.8 7.2 L1 6 L4.8 4.8 Z" fill={C.accent} />
        </svg>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, color: C.accent }}>
          INSIGHT · {insight.tag}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 0.5,
          color: C.text,
          textTransform: 'uppercase',
          lineHeight: 1.1,
          margin: '0 0 8px',
          position: 'relative',
        }}
      >
        {insight.title}
      </div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: 0, position: 'relative' }}>
        {insight.body}
      </p>
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────────────
function SectionLabel({ children, meta }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: 2.4,
        color: C.textLow,
        marginBottom: 10,
      }}
    >
      <span>{children}</span>
      {meta && <span style={{ color: C.textMid }}>{meta}</span>}
    </div>
  );
}

// ── Bottom tab bar ───────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: <IconTabHome /> },
    { id: 'workout', label: 'Workout', icon: <IconTabWorkout /> },
    { id: 'nutrition', label: 'Nutrition', icon: <IconTabNutrition /> },
    { id: 'reports', label: 'Reports', icon: <IconTabReports /> },
  ];
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '8px 14px 4px',
        background: 'rgba(7,7,9,.92)',
        borderTop: `1px solid ${C.line}`,
        display: 'flex',
        position: 'relative',
        zIndex: 8,
        backdropFilter: 'blur(12px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              padding: '8px 0 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? C.accent : C.textLow,
              cursor: 'pointer',
              transition: 'color .15s',
            }}
          >
            <div style={{ position: 'relative' }}>
              {tab.icon}
              {isActive && (
                <div style={{
                  position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: 2, background: C.accent,
                }} />
              )}
            </div>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.5,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IconTabHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 10 L11 3 L19 10 V19 H13 V13 H9 V19 H3 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconTabWorkout() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="8" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="19" y="8" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="3.5" y="6" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="15.5" y="6" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="6.5" y="10" width="9" height="2" fill="currentColor" />
    </svg>
  );
}
function IconTabNutrition() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 4 C7 4 4 7 4 11 C4 16 8 19 11 19 C14 19 18 16 18 11 C18 7 15 4 11 4 Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 4 C11 4 10 2 12 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconTabReports() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <line x1="3" y1="19" x2="19" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4" y="11" width="3" height="6" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <rect x="9.5" y="7" width="3" height="10" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <rect x="15" y="13" width="3" height="4" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

Object.assign(window, {
  LifeScoreArc, StreakCard, LifeBalanceRadar, WeekStrip, DayDot,
  CheckinCard, WorkoutBanner, InsightCard, SectionLabel, TabBar,
});

export { CheckinCard, DayDot, IconTabHome, IconTabNutrition, IconTabReports, IconTabWorkout, InsightCard, LifeBalanceRadar, LifeScoreArc, SectionLabel, StreakCard, TabBar, WeekStrip, WorkoutBanner };

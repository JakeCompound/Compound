// workout-dashboard.jsx — Workout Dashboard, Past Workouts, Weekly Plan

// ── Workout Dashboard ────────────────────────────────────────────────────
function WorkoutDashboard({ onBack }) {
  const [selectedLift, setSelectedLift] = React.useState('bench');
  const history = window.loadWorkouts ? window.loadWorkouts() : [];

  if (history.length === 0) {
    return (
      <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="DASHBOARD" sub="strength · volume · recovery" onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 32px' }}>
          <div
            style={{
              padding: '28px 18px', textAlign: 'center',
              background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
              border: `1px solid ${C.line}`, borderRadius: 16,
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.5, marginBottom: 10 }}>
              NO SESSIONS LOGGED
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: C.text, textTransform: 'uppercase', lineHeight: 1, marginBottom: 10, letterSpacing: 0.5 }}>
              YOUR STRENGTH DATA<br /><span style={{ color: C.accent }}>STARTS WITH SESSION 1.</span>
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, lineHeight: 1.5, margin: '0 auto', maxWidth: 280 }}>
              1RM trends, volume, your PB wall and recovery heatmap all build from real logged workouts. Finish one and they fill in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const series = window.lift1RMSeries(history, selectedLift);
  const liftLabel = TRACKED_LIFTS.find((l) => l.key === selectedLift).label;
  const pbs = window.pbWall(history);
  const heatmap = window.recoveryHeatmap(history);
  const volume = window.volumeSeries(history, 7);
  // Fatigue: recent volume + recent check-in sleep/calm (real, rough)
  const recentVol = volume.reduce((a, b) => a + b.volume, 0);
  const fatigue = Math.min(100, Math.round((recentVol / 30000) * 100));

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="DASHBOARD" sub="strength · volume · recovery" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 32px' }}>
        {/* 1RM hero */}
        <SectionLabel meta={`ESTIMATED · ${history.length} SESSIONS`}>1RM TRACKER</SectionLabel>
        <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 1, color: C.text, textTransform: 'uppercase' }}>
              {liftLabel}
            </div>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 600, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
                {series.length ? series[series.length - 1] : '—'}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid, marginLeft: 4 }}>KG</span>
            </div>
          </div>
          {series.length >= 2 ? (
            <>
              <Trend1RM data={series} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.4 }}>
                <span>{series.length} SESSIONS · {series[0]}KG</span>
                <span style={{ color: C.accent }}>{series[series.length - 1] - series[0] >= 0 ? '+' : ''}{(series[series.length - 1] - series[0]).toFixed(1)}KG</span>
              </div>
            </>
          ) : (
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, padding: '8px 0', lineHeight: 1.5 }}>
              {series.length === 1 ? 'One session logged — log this lift again to plot a trend.' : 'No sessions with this lift yet. Train it and it charts here.'}
            </div>
          )}
        </div>

        {/* Lift picker */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginLeft: -22, marginRight: -22, paddingLeft: 22, paddingRight: 22, marginBottom: 24 }}>
          {TRACKED_LIFTS.map((l) => {
            const active = l.key === selectedLift;
            return (
              <button
                key={l.key}
                onClick={() => setSelectedLift(l.key)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  background: active ? C.accentDim : C.surf1,
                  border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                  borderRadius: 999,
                  color: active ? C.accent : C.text,
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 13,
                  letterSpacing: 1, textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {l.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Volume */}
        <SectionLabel meta={`LAST ${volume.length} SESSIONS`}>VOLUME · KG LIFTED</SectionLabel>
        <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <VolumeChart sessions={volume} />
        </div>

        {/* Body heatmap */}
        <SectionLabel meta="RECENCY">BODY HEATMAP</SectionLabel>
        <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
          <BodyHeatmap recovery={heatmap} />
        </div>

        {/* PB Wall */}
        <SectionLabel meta="EST. 1RM">PB WALL</SectionLabel>
        {pbs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pbs.map((pb, i) => (
              <PbRow key={pb.lift} pb={{ ...pb, when: window.relativeDay(pb.when).toLowerCase() }} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '16px', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, textAlign: 'center' }}>
            No PBs yet — log a tracked lift (bench, squat, shoulder press, curl, pulldown, row) to set your first.
          </div>
        )}

        {/* Fatigue / Strength balance */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FatigueCard score={fatigue} />
          <BalanceCard left={92} right={94} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: C.textLow, letterSpacing: 1, marginTop: 10, lineHeight: 1.5 }}>
          STRENGTH BALANCE NEEDS PER-SIDE LOGGING (NATIVE) — SHOWN AS REFERENCE.
        </div>
      </div>
    </div>
  );
}

function SubHeader({ title, sub, onBack, right }) {
  return (
    <div style={{ padding: '14px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>BACK</span>
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.5, marginTop: 2 }}>
            {sub.toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ width: 50, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ── 1RM trend chart ─────────────────────────────────────────────────────
function Trend1RM({ data }) {
  const w = 320, h = 90;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.1, max - min);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;

  // animate
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    setT(0);
    let raf;
    let cancelled = false;
    const start = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const p = Math.min(1, (now - start) / 700);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fallback = setTimeout(() => { if (!cancelled) setT(1); }, 900);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [data]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(242,163,15,.25)" />
          <stop offset="100%" stopColor="rgba(242,163,15,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendArea)" style={{ opacity: t }} />
      <path d={path} fill="none" stroke="#F2A30F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000 * (1 - t) }} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 3 : 1.5} fill={i === points.length - 1 ? '#F2A30F' : 'rgba(242,163,15,.5)'} style={{ opacity: t }} />
      ))}
    </svg>
  );
}

// ── Volume chart (per-session bars) ─────────────────────────────────────
function VolumeChart({ sessions }) {
  const max = Math.max(...sessions.map((s) => s.volume));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, gap: 6 }}>
      {sessions.map((s) => {
        const height = Math.max(8, (s.volume / max) * 100);
        const isPR = s.prs && s.prs.length > 0;
        return (
          <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: isPR ? C.accent : C.textLow, fontWeight: 500 }}>
              {Math.round(s.volume / 100) / 10}k
            </span>
            <div
              style={{
                width: '100%',
                height: `${height}%`,
                background: isPR ? C.accent : 'rgba(242,163,15,.35)',
                borderRadius: '3px 3px 0 0',
                position: 'relative',
              }}
            >
              {isPR && (
                <span
                  style={{
                    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 11, color: C.accent,
                  }}
                >
                  ★
                </span>
              )}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1 }}>
              {s.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Body heatmap ─────────────────────────────────────────────────────────
function BodyHeatmap({ recovery }) {
  // Simple stylised front-body silhouette with regions
  const region = (key, defaultColor = 'rgba(255,255,255,.12)') => {
    const status = recovery[key];
    return status ? statusColor(status) : defaultColor;
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="120" height="180" viewBox="0 0 120 180" style={{ flexShrink: 0 }}>
        {/* head */}
        <circle cx="60" cy="18" r="14" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.12)" />
        {/* neck */}
        <rect x="55" y="30" width="10" height="8" fill="rgba(255,255,255,.07)" />
        {/* chest */}
        <rect x="36" y="40" width="48" height="22" rx="6" fill={region('Chest')} stroke="rgba(0,0,0,.4)" />
        {/* shoulders */}
        <ellipse cx="30" cy="44" rx="9" ry="11" fill={region('Shoulders')} stroke="rgba(0,0,0,.4)" />
        <ellipse cx="90" cy="44" rx="9" ry="11" fill={region('Shoulders')} stroke="rgba(0,0,0,.4)" />
        {/* biceps (upper arms) */}
        <rect x="20" y="55" width="11" height="28" rx="4" fill={region('Biceps')} stroke="rgba(0,0,0,.4)" />
        <rect x="89" y="55" width="11" height="28" rx="4" fill={region('Biceps')} stroke="rgba(0,0,0,.4)" />
        {/* triceps (forearms placeholder) */}
        <rect x="22" y="85" width="8" height="22" rx="3" fill={region('Triceps')} stroke="rgba(0,0,0,.4)" />
        <rect x="90" y="85" width="8" height="22" rx="3" fill={region('Triceps')} stroke="rgba(0,0,0,.4)" />
        {/* core */}
        <rect x="42" y="64" width="36" height="28" rx="4" fill={region('Core')} stroke="rgba(0,0,0,.4)" />
        {/* hips */}
        <rect x="40" y="94" width="40" height="14" rx="4" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.12)" />
        {/* legs */}
        <rect x="42" y="110" width="14" height="58" rx="4" fill={region('Legs')} stroke="rgba(0,0,0,.4)" />
        <rect x="64" y="110" width="14" height="58" rx="4" fill={region('Legs')} stroke="rgba(0,0,0,.4)" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1, color: C.text, textTransform: 'uppercase', marginBottom: 8 }}>
          Recovery status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(recovery).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: statusColor(v) }} />
              <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: C.text, letterSpacing: 1.4 }}>
                {k.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: statusColor(v), letterSpacing: 1 }}>
                {v.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PB row ──────────────────────────────────────────────────────────────
function PbRow({ pb, rank }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div
        style={{
          width: 30, height: 30, borderRadius: 8,
          background: rank <= 3 ? C.accentDim : C.surf2,
          color: rank <= 3 ? C.accent : C.textLow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
        }}
      >
        {String(rank).padStart(2, '0')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, color: C.text, textTransform: 'uppercase' }}>
          {pb.lift}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.4, marginTop: 1 }}>
          {pb.when.toUpperCase()}{pb.estimated && ' · EST'}
        </div>
      </div>
      <div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 22, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
          {pb.weight}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, marginLeft: 3 }}>KG</span>
      </div>
    </div>
  );
}

function FatigueCard({ score }) {
  // Lower = more recovered. We display as 0-100 stress.
  const color = score < 35 ? C.success : score < 65 ? C.accent : C.danger;
  return (
    <div style={{ padding: 14, background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.8 }}>
        FATIGUE
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 28, color, fontVariantNumeric: 'tabular-nums' }}>
          {score}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow }}>/100</span>
      </div>
      <div style={{ height: 3, background: C.surf2, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color }} />
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.3, marginTop: 6 }}>
        VOL + SLEEP + CALM
      </div>
    </div>
  );
}

function BalanceCard({ left, right }) {
  const diff = Math.abs(left - right);
  const isOk = diff < 5;
  return (
    <div style={{ padding: 14, background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.8 }}>
        STRENGTH BALANCE
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
        <div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow }}>L</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 20, color: C.text, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
            {left}
          </span>
        </div>
        <div style={{ width: 12, height: 1, background: C.line }} />
        <div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow }}>R</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 20, color: C.text, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
            {right}
          </span>
        </div>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: isOk ? C.success : C.accent, letterSpacing: 1.3, marginTop: 8 }}>
        {isOk ? 'WITHIN 5% · BALANCED' : `${diff}% IMBALANCE`}
      </div>
    </div>
  );
}

// ── Past Workouts ────────────────────────────────────────────────────────
function PastWorkouts({ onBack }) {
  const history = (window.loadWorkouts ? window.loadWorkouts() : []).slice().reverse();
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="PAST WORKOUTS" sub={history.length ? `${history.length} logged` : 'none yet'} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 32px' }}>
        {history.length === 0 ? (
          <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.6, marginBottom: 6 }}>
              NO SESSIONS YET
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
              Your finished workouts log here — date, duration, volume and how it felt.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((s) => (
              <HistoryRow
                key={s.id}
                session={{
                  id: s.id,
                  day: window.dayAbbrev(s.date),
                  date: window.relativeDay(s.date),
                  groups: s.muscles && s.muscles.length ? s.muscles.slice(0, 2) : ['SESSION'],
                  duration: s.durationMin,
                  exercises: s.exercises.length,
                  volume: s.volume,
                  feeling: s.feeling,
                  prs: s.prs || [],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ session }) {
  return (
    <div
      style={{
        padding: '14px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        display: 'flex', gap: 12, alignItems: 'center',
      }}
    >
      <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: C.accent, letterSpacing: 1 }}>
          {session.day}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.textLow, letterSpacing: 1, marginTop: 1 }}>
          {session.date}
        </div>
      </div>
      <div style={{ width: 1, height: 36, background: C.line, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: 1, textTransform: 'uppercase' }}>
            {session.groups.join(' · ')}
          </div>
          {session.prs.length > 0 && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.accent, background: C.accentSoft, padding: '2px 5px', borderRadius: 4, letterSpacing: 1 }}>
              PB
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1 }}>
          <span>{session.duration}M</span>
          <span>·</span>
          <span>{session.exercises} EX</span>
          <span>·</span>
          <span>{(session.volume / 1000).toFixed(1)}T VOL</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} width="9" height="9" viewBox="0 0 9 9">
            <path
              d="M4.5 0.8 L5.4 3.2 L8 3.4 L6 5 L6.6 7.7 L4.5 6.2 L2.4 7.7 L3 5 L1 3.4 L3.6 3.2 Z"
              fill={s <= session.feeling ? C.accent : 'transparent'}
              stroke={s <= session.feeling ? C.accent : C.lineStrong}
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Plan ──────────────────────────────────────────────────────────
function WeeklyPlan({ user, onBack, onStart }) {
  const plan = makeWeeklyPlan(user.trainingDays || 3);
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="WEEKLY PLAN" sub={`${user.trainingDays || 3}-day split`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, margin: '0 0 18px', lineHeight: 1.5 }}>
          Suggested split for this week. Long-press any day to swap it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.map((p, i) => (
            <PlanDayCard key={p.day + i} plan={p} onStart={onStart} />
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            padding: 14,
            background: C.accentSoft,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 12,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 18 }}>📅</span>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>
            Heads up: if you haven't logged your scheduled sessions by Sunday morning, expect a push notification.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanDayCard({ plan, onStart }) {
  return (
    <div
      style={{
        padding: 14,
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div
        style={{
          width: 52, height: 52, borderRadius: 12,
          background: C.surf2, color: C.accent,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          {plan.day}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: 1, textTransform: 'uppercase' }}>
          {plan.label}
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 2 }}>
          {plan.focus} · ~{plan.est}m
        </div>
      </div>
      <button
        onClick={onStart}
        style={{
          background: C.surf3, border: `1px solid ${C.line}`,
          color: C.accent, padding: '8px 12px', borderRadius: 8,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5,
          cursor: 'pointer', textTransform: 'uppercase',
        }}
      >
        Start →
      </button>
    </div>
  );
}

Object.assign(window, {
  WorkoutDashboard, PastWorkouts, WeeklyPlan, SubHeader,
});

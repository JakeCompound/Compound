// workout-screens.jsx — Workout tab: internal home, new-workout flow, live session

// ── Workout tab home (internal nav) ──────────────────────────────────────
function WorkoutHome({ onNav, hasInProgress, user = {} }) {
  const history = window.loadWorkouts ? window.loadWorkouts() : [];
  const doneThisWeek = window.sessionsThisWeek ? window.sessionsThisWeek(history) : 0;
  const target = user.trainingDays || 3;
  const today = new Date();
  const daysLeft = 7 - ((today.getDay() + 6) % 7);
  const remaining = Math.max(0, target - doneThisWeek);
  const weekLine = remaining === 0
    ? `${doneThisWeek}/${target} done — week complete.`
    : `${remaining} ${remaining === 1 ? 'workout' : 'workouts'} in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`;
  const weekSub = remaining === 0
    ? 'Anything extra this week is profit.'
    : remaining >= daysLeft ? 'Tight margin — book them in.' : 'On track. Keep stacking.';
  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', padding: '14px 22px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow }}>
            TAB · WORKOUT
          </div>
          <h1
            style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 32,
              lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '6px 0 0', textTransform: 'uppercase',
            }}
          >
            TRAINING <span style={{ color: C.accent }}>HUB.</span>
          </h1>
        </div>
        <button
          onClick={() => onNav('dashboard')}
          style={{
            background: C.surf1, border: `1px solid ${C.line}`,
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.text,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="10" width="3" height="6" stroke="currentColor" strokeWidth="1.4" />
            <rect x="7.5" y="6" width="3" height="10" stroke="currentColor" strokeWidth="1.4" />
            <rect x="13" y="12" width="3" height="4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      {/* Hero CTA — Start new workout */}
      <div style={{ marginTop: 18 }}>
        <HeroCta onClick={() => onNav('new')} />
      </div>

      {/* Resume if in progress */}
      {hasInProgress && (
        <div style={{ marginTop: 10 }}>
          <ResumeCard onClick={() => onNav('session')} />
        </div>
      )}

      {/* Saved Workouts — named, reusable */}
      <div style={{ marginTop: 22 }}>
        <SavedWorkoutsButton onOpen={() => onNav('saved')} />
      </div>

      {/* Secondary actions */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel>QUICK ACTIONS</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SecondaryCard
            label="WEEKLY PLAN"
            sub="3-day split · suggested for this week"
            icon={<IconCal />}
            onClick={() => onNav('plan')}
          />
      {/* Past workouts */}
          <SecondaryCard
            label="PAST WORKOUTS"
            sub={history.length ? `${history.length} logged` : 'none yet'}
            icon={<IconHistory />}
            onClick={() => onNav('past')}
          />
          <SecondaryCard
            label="DASHBOARD"
            sub="1RM tracker · volume · PB wall · heatmap"
            icon={<IconChart />}
            onClick={() => onNav('dashboard')}
          />
        </div>
      </div>

      {/* This week summary */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel meta="MON – SUN">SESSIONS THIS WEEK</SectionLabel>
        <div
          style={{
            padding: 16,
            background: C.surf1,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 14,
          }}
        >
          <BigCount value={doneThisWeek} target={target} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase', color: C.text }}>
              {weekLine}
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, marginTop: 2 }}>
              {weekSub}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCta({ onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '22px 22px',
        background: 'linear-gradient(135deg, #F2A30F 0%, #C57700 100%)',
        border: 0,
        borderRadius: 16,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        color: '#0A0A0C',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform .1s',
        boxShadow: '0 12px 36px rgba(242,163,15,.28)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -30, top: -30, width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(255,255,255,.2), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.5, color: 'rgba(10,10,12,.65)', marginBottom: 10 }}>
            ◆ AI PROGRAMMED · 30S
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 34, letterSpacing: 0.5, lineHeight: 0.95, textTransform: 'uppercase' }}>
            START NEW<br />WORKOUT
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'rgba(10,10,12,.7)', marginTop: 10, maxWidth: 240 }}>
            Tell us where, how long, what to hit. We program around your recovery and history.
          </div>
        </div>
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#0A0A0C', color: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 8,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path d="M5 11 L17 11 M11 5 L17 11 L11 17" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function ResumeCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        padding: '14px 16px',
        background: C.surf2,
        border: `1px solid ${C.accentDim}`,
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: C.accent, boxShadow: `0 0 12px ${C.accent}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.accent, marginBottom: 2 }}>
          IN PROGRESS
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase', color: C.text }}>
          Resume your workout
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: C.accent }}>
        <path d="M3 7 L11 7 M7 3 L11 7 L7 11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function SecondaryCard({ label, sub, icon, onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '14px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform .08s, background .12s',
      }}
    >
      <div
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: C.surf2, color: C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1.2, textTransform: 'uppercase', color: C.text }}>
          {label}
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: C.textLow, flexShrink: 0 }}>
        <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function BigCount({ value, target }) {
  const pct = Math.min(1, value / target);
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={C.accent} strokeWidth="3" strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600,
          color: C.text, fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}/{target}
      </div>
    </div>
  );
}

function IconCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2.5" y1="8" x2="17.5" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 5 V10 L13 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 14 L7 10 L11 12 L17 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}

// ── New Workout flow (5 steps) ───────────────────────────────────────────
function NewWorkoutFlow({ user, onBack, onStart }) {
  const [step, setStep] = React.useState(0);
  const [config, setConfig] = React.useState({
    location: user.equipment || 'gym',
    duration: 30,
    groups: [],
    preFeel: 0,
  });
  const set = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const [previewSession, setPreviewSession] = React.useState(null);
  const [swapIdx, setSwapIdx] = React.useState(null);

  // (Re)generate the preview whenever we land on the preview step.
  React.useEffect(() => {
    if (step === 4) setPreviewSession(generateSession(config));
    // eslint-disable-next-line
  }, [step]);

  const doSwap = (newExId) => {
    if (swapIdx == null || !previewSession) return;
    const item = window.buildSessionItem(
      window.EXERCISES.find((e) => e.id === newExId),
      { durationMin: config.duration, preFeel: config.preFeel, idx: swapIdx, setsPerExercise: 3 }
    );
    setPreviewSession((s) => s.map((ex, i) => (i === swapIdx ? item : ex)));
    setSwapIdx(null);
  };

  const TOTAL = 5;
  const canAdvance = () => {
    if (step === 0) return !!config.location;
    if (step === 1) return !!config.duration;
    if (step === 2) return config.groups.length > 0;
    if (step === 3) return config.preFeel > 0;
    return true;
  };
  const next = () => {
    if (step >= TOTAL - 1) {
      const session = previewSession || generateSession(config);
      onStart({ config, session });
    } else {
      setStep(step + 1);
    }
  };
  const back = () => (step === 0 ? onBack() : setStep(step - 1));

  // Auto-advance single-select steps to the next step.
  const nextRef = React.useRef(next);
  nextRef.current = next;
  const auto = (patch) => { set(patch); setTimeout(() => nextRef.current && nextRef.current(), 240); };

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={back}
            style={{ background: 'transparent', border: 0, color: C.textMid, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            BACK
          </button>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.accent }}>
            NEW WORKOUT · {step + 1} / {TOTAL}
          </div>
          <span style={{ width: 56 }} />
        </div>
        <StepBar current={step + 1} total={TOTAL} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 0' }}>
        {step === 0 && <StepLocation value={config.location} onChange={(v) => auto({ location: v })} />}
        {step === 1 && <StepDuration value={config.duration} onChange={(v) => auto({ duration: v })} />}
        {step === 2 && <StepGroups value={config.groups} onChange={(v) => set({ groups: v })} location={config.location} />}
        {step === 3 && <StepPreFeel value={config.preFeel} onChange={(v) => auto({ preFeel: v })} />}
        {step === 4 && <StepPreview config={config} session={previewSession} onSwap={(i) => setSwapIdx(i)} />}
      </div>

      {swapIdx != null && previewSession && (
        <SwapExerciseSheet
          current={previewSession[swapIdx]}
          location={config.location}
          onPick={doSwap}
          onClose={() => setSwapIdx(null)}
        />
      )}

      <div style={{ padding: '14px 22px 22px' }}>
        <PrimaryButton onClick={next} disabled={!canAdvance()}>
          {step === TOTAL - 1 ? 'Start Workout' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function StepLocation({ value, onChange }) {
  return (
    <div>
      <NewStepHead tag="LOCATION" title="WHERE ARE" accent="WE TRAINING?" sub="Switching mid-flow is fine. We'll re-program the session." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SelectCard active={value === 'home'} onClick={() => onChange('home')} title="AT HOME" subtitle="Bodyweight only" meta="BW" glyph={<IconHome />} />
        <SelectCard active={value === 'gym'}  onClick={() => onChange('gym')}  title="GYM / GARAGE" subtitle="Reeplex PRO90 + dumbbells ≤ 35kg" meta="FULL" glyph={<IconGym />} />
      </div>
    </div>
  );
}

function StepDuration({ value, onChange }) {
  const opts = [10, 20, 30, 60];
  return (
    <div>
      <NewStepHead tag="DURATION" title="HOW LONG" accent="DO YOU HAVE?" sub="Pick what's real. We'll fit the session to it." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opts.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              style={{
                aspectRatio: '1.2 / 1',
                background: active ? C.accentDim : C.surf1,
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                borderRadius: 14,
                cursor: 'pointer',
                color: active ? C.accent : C.text,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 44, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {m}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 2 }}>
                MINUTES
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepGroups({ value, onChange, location }) {
  const toggle = (g) => {
    onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  };
  // Body heatmap hint badges — from real workout history (empty = all green/recovered)
  const recovery = (window.recoveryHeatmap ? window.recoveryHeatmap(window.loadWorkouts ? window.loadWorkouts() : []) : {});
  return (
    <div>
      <NewStepHead tag="MUSCLE GROUPS" title="WHAT DO YOU" accent="WANT TO TRAIN?" sub="Pick one or many. Red groups are still recovering from recent work." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {MUSCLE_GROUP_OPTIONS.map((g) => {
          const active = value.includes(g);
          const status = recovery[g];
          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              style={{
                padding: '10px 14px',
                background: active ? C.accentDim : C.surf1,
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                borderRadius: 999,
                color: active ? C.accent : C.text,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {status && <span style={{ width: 6, height: 6, borderRadius: 3, background: statusColor(status) }} />}
              {g}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, color: C.textLow }}>
        <Legend color={statusColor('green')} label="RECOVERED" />
        <Legend color={statusColor('amber')} label="DEVELOPING" />
        <Legend color={statusColor('red')} label="WORKED" />
      </div>
    </div>
  );
}

function statusColor(s) {
  if (s === 'green') return '#5AC57E';
  if (s === 'amber') return '#F2A30F';
  if (s === 'red') return '#E5564B';
  return '#666';
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: color }} />
      {label}
    </span>
  );
}

function StepPreFeel({ value, onChange }) {
  const labels = ['', 'Drained', 'Tired', 'Neutral', 'Sharp', 'Primed'];
  return (
    <div>
      <NewStepHead tag="PRE-FEELING" title="HOW DO YOU FEEL" accent="GOING IN?" sub="Honest answer. We bias the load — easier days, lighter sets." />
      <div style={{ marginTop: 24 }}>
        <StarRating value={value} onChange={onChange} size={42} />
      </div>
      {value > 0 && (
        <div
          style={{
            marginTop: 22,
            padding: '14px 16px',
            background: C.surf1,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2 }}>
            PROGRAMMING BIAS
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: C.text, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {labels[value]}
          </div>
        </div>
      )}
    </div>
  );
}

function StepPreview({ config, session, onSwap }) {
  const preview = session || React.useMemo(() => generateSession(config), [config]);
  const totalSets = preview.reduce((s, ex) => s + ex.sets.length, 0);
  return (
    <div>
      <NewStepHead tag="PROGRAM PREVIEW" title="HERE'S YOUR" accent="SESSION." sub="Tap any exercise to swap it for a similar one. Weights are AI-suggested — change anything live." />
      <div
        style={{
          display: 'flex', gap: 10, marginBottom: 16,
        }}
      >
        <PreviewStat label="EXERCISES" value={preview.length} />
        <PreviewStat label="SETS" value={totalSets} />
        <PreviewStat label="EST" value={`${config.duration}m`} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {preview.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => onSwap && onSwap(i)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '12px 14px',
              background: C.surf1,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textLow, width: 22 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, color: C.text, textTransform: 'uppercase' }}>
                {ex.name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.4, marginTop: 1 }}>
                {ex.sets.length} SETS · {ex.groups.slice(0,2).join(' · ').toUpperCase()}
              </div>
            </div>
            {ex.tracked1RM && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, background: C.accentSoft, padding: '2px 6px', borderRadius: 4, letterSpacing: 1 }}>
                1RM
              </span>
            )}
            {/* swap affordance */}
            <svg width="15" height="15" viewBox="0 0 15 15" style={{ color: C.textMid, flexShrink: 0 }}>
              <path d="M4 3 L1.5 5.5 L4 8 M1.5 5.5 H10 A1.5 1.5 0 0 1 11.5 7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 12 L13.5 9.5 L11 7 M13.5 9.5 H5 A1.5 1.5 0 0 1 3.5 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function SwapExerciseSheet({ current, location, onPick, onClose }) {
  const options = window.similarExercises ? window.similarExercises(current.exId, location) : [];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '80%', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>SWAP EXERCISE</div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '0 0 4px', textTransform: 'uppercase' }}>
          REPLACE <span style={{ color: C.accent }}>{current.name}</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '0 0 16px' }}>
          Same muscle, different movement. Pick what suits your gear or how you feel.
        </p>
        {options.length === 0 ? (
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, padding: '12px 0' }}>No close alternatives for this one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((o) => (
              <button key={o.id} onClick={() => onPick(o.id)} style={{ width: '100%', textAlign: 'left', padding: '13px 14px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>{o.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: C.textLow, letterSpacing: 1.2, marginTop: 1 }}>{o.groups.join(' · ').toUpperCase()} · {o.equip === 'home' ? 'BODYWEIGHT' : 'GYM'}</div>
                </div>
                {o.tracked1RM && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, background: C.accentSoft, padding: '2px 6px', borderRadius: 4, letterSpacing: 1 }}>1RM</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 600, color: C.accent, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function NewStepHead({ tag, title, accent, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.accent, marginBottom: 12 }}>
        {tag}
      </div>
      <h2
        style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 34,
          lineHeight: 0.98, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase',
        }}
      >
        {title}<br />
        <span style={{ color: C.accent }}>{accent}</span>
      </h2>
      {sub && (
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.45, margin: '14px 0 0', maxWidth: 320 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

Object.assign(window, {
  WorkoutHome, NewWorkoutFlow, statusColor,
});

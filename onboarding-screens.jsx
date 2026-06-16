// onboarding-screens.jsx — All onboarding screens for COMPOUND

// ── 01 WELCOME ─────────────────────────────────────────────────────────────
function ScreenWelcome({ onNext }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1800);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const arcSize = 240;
  const r = 108;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.78;
  const offset = dash * (1 - progress);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: C.bg,
        padding: '8px 28px 32px',
        position: 'relative',
      }}
    >
      {/* Tiny brand row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0 0',
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: C.accent,
            fontSize: 11,
            letterSpacing: 3,
          }}
        >
          ◆ COMPOUND
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: C.textLow,
            fontSize: 10,
            letterSpacing: 2,
          }}
        >
          v 1.0
        </span>
      </div>

      {/* Animated arc */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width={arcSize} height={arcSize} style={{ transform: 'rotate(-220deg)' }}>
          <defs>
            <linearGradient id="welcArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F2A30F" />
              <stop offset="100%" stopColor="#B36F00" />
            </linearGradient>
          </defs>
          <circle
            cx={arcSize / 2}
            cy={arcSize / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,.06)"
            strokeWidth="2"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
          <circle
            cx={arcSize / 2}
            cy={arcSize / 2}
            r={r}
            fill="none"
            stroke="url(#welcArc)"
            strokeWidth="3"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 12px rgba(242,163,15,.4))' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: C.textLow,
              letterSpacing: 3,
              marginBottom: 4,
            }}
          >
            DAY
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 72,
              fontWeight: 600,
              color: C.text,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            00
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: C.accent,
              letterSpacing: 3,
              marginTop: 6,
              opacity: progress,
            }}
          >
            FIRST LIGHT
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: 16 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: 3,
            color: C.accent,
            marginBottom: 16,
            opacity: 0.85,
          }}
        >
          — MANTRA
        </div>
        <h1
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 50,
            lineHeight: 0.92,
            color: C.text,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          CONSISTENCY
          <br />
          <span style={{ color: C.accent }}>OVER PERFECTION.</span>
        </h1>
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: C.textMid,
            fontSize: 15,
            lineHeight: 1.5,
            margin: '20px 0 28px',
            maxWidth: 320,
          }}
        >
          Small reps. Stacked daily. Across health, mind, relationships, and spirit.
          You don't need to be perfect — you need to show up.
        </p>
        <PrimaryButton onClick={onNext}>Build my base</PrimaryButton>
      </div>
    </div>
  );
}

// ── Reusable form layout ───────────────────────────────────────────────────
function FormShell({ step, total, title, accentLine, sub, onSkip, skipLabel, onSave, children, footer }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <StepBar current={step} total={total} />
      <div style={{ padding: '4px 24px 0', display: 'flex', justifyContent: 'flex-end', height: 30 }}>
        {onSave && <SaveExitButton onClick={onSave} />}
      </div>
      <ScreenHead step={step} total={total} title={title} accentLine={accentLine} sub={sub} onSkip={onSkip} skipLabel={skipLabel} />
      <div style={{ flex: 1, padding: '24px 24px 8px', overflow: 'auto' }}>{children}</div>
      <div style={{ padding: '12px 24px 24px' }}>{footer}</div>
    </div>
  );
}

// ── 02 NAME ────────────────────────────────────────────────────────────────
function ScreenName({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="WHAT SHOULD"
      accentLine="WE CALL YOU?"
      sub="First name is fine. We'll use it sparingly — when it counts."
      footer={
        <FooterNav
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!data.name.trim()}
        />
      }
    >
      <FieldLabel>Your name</FieldLabel>
      <TextInput value={data.name} onChange={(v) => set({ name: v })} placeholder="e.g. James" autoFocus maxLength={24} />
    </FormShell>
  );
}

// ── 03 DOB ─────────────────────────────────────────────────────────────────
function ScreenAge({ data, set, ctx, onNext, onBack }) {
  const age = computeAge(data.dob);
  const dob = data.dob || '1992-04-15';
  return (
    <FormShell
      {...ctx}
      footer={<FooterNav onBack={onBack} onNext={onNext} nextDisabled={!age || age < 13} />}
    >
      <FieldLabel>Date of birth</FieldLabel>
      <div style={{ marginTop: 12 }}>
        <DateWheel value={dob} onChange={(v) => set({ dob: v })} />
      </div>

      {/* Derived age + birthday preview */}
      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            background: C.surf1,
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginBottom: 4 }}>
            CURRENT AGE
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 28, color: C.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {age ?? '—'} <span style={{ fontSize: 12, color: C.textMid }}>yrs</span>
          </div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            background: C.surf1,
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginBottom: 4 }}>
            NEXT BIRTHDAY
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 18, color: C.text, lineHeight: 1.1 }}>
            {(() => {
              const [, m, d] = dob.split('-').map(Number);
              return `${String(d).padStart(2,'0')} ${MONTHS_SHORT[m-1]}`;
            })()}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: '12px 14px',
          background: C.accentSoft,
          border: `1px solid ${C.accentDim}`,
          borderRadius: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 18 }}>🎂</span>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.text, lineHeight: 1.45, margin: 0 }}>
          We'll send you a quiet birthday message — and a one-time streak freeze, on the house.
        </p>
      </div>
    </FormShell>
  );
}

// ── 04 WEIGHT ──────────────────────────────────────────────────────────────
function ScreenWeight({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="WEIGHT"
      accentLine="& TARGET."
      sub="Today's number, and where you want to land. Friday weigh-ins will tell the rest."
      footer={<FooterNav onBack={onBack} onNext={onNext} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <FieldLabel>Current weight</FieldLabel>
          <Stepper value={data.weight} onChange={(v) => set({ weight: v })} min={30} max={250} step={0.5} unit="kg" large />
        </div>
        <div>
          <FieldLabel>Goal weight</FieldLabel>
          <Stepper value={data.weightGoal} onChange={(v) => set({ weightGoal: v })} min={30} max={250} step={0.5} unit="kg" large />
        </div>
        <DeltaCard from={data.weight} to={data.weightGoal} />
      </div>
    </FormShell>
  );
}

function DeltaCard({ from, to }) {
  const delta = +(to - from).toFixed(1);
  const dir = delta === 0 ? 'maintain' : delta < 0 ? 'cut' : 'gain';
  const label = delta === 0 ? 'HOLD STEADY' : delta < 0 ? 'CUT' : 'GAIN';
  return (
    <div
      style={{
        padding: '14px 18px',
        background: C.surf1,
        border: `1px dashed ${C.line}`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginBottom: 4 }}>
          PROGRAM TILT
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 700, color: C.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 28, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
        {delta > 0 ? '+' : ''}{delta} <span style={{ fontSize: 13, color: C.textMid }}>kg</span>
      </div>
    </div>
  );
}

// ── 05 TRAINING DAYS ───────────────────────────────────────────────────────
function ScreenTrainingDays({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="HOW MANY DAYS"
      accentLine="DO YOU LIFT?"
      sub="The honest answer, not the aspirational one. We'll hold you to it."
      footer={<FooterNav onBack={onBack} onNext={onNext} />}
    >
      <FieldLabel>Training days per week</FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 14 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const active = data.trainingDays === n;
          return (
            <button
              key={n}
              onClick={() => { set({ trainingDays: n }); setTimeout(onNext, 240); }}
              style={{
                aspectRatio: '1 / 1.2',
                background: active ? C.accent : C.surf1,
                color: active ? '#0A0A0C' : C.text,
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                borderRadius: 10,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 20,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .12s',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, marginTop: 18, lineHeight: 1.5 }}>
        We'll nudge you when you're running out of days to hit your weekly target.
      </p>
    </FormShell>
  );
}

// ── 06 STEPS & SLEEP ───────────────────────────────────────────────────────
function ScreenStepsSleep({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="DAILY"
      accentLine="BASELINES."
      sub="The two metrics that move everything else. Set targets you can actually defend."
      footer={<FooterNav onBack={onBack} onNext={onNext} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <FieldLabel>Step goal</FieldLabel>
          <Stepper
            value={data.stepGoal}
            onChange={(v) => set({ stepGoal: v })}
            min={1000}
            max={30000}
            step={500}
            unit="steps / day"
            large
          />
        </div>
        <div>
          <FieldLabel>Sleep goal</FieldLabel>
          <Stepper
            value={data.sleepGoal}
            onChange={(v) => set({ sleepGoal: v })}
            min={4}
            max={12}
            step={0.5}
            unit="hours / night"
            large
          />
        </div>
      </div>
    </FormShell>
  );
}

// ── 07 EQUIPMENT ───────────────────────────────────────────────────────────
function ScreenEquipment({ data, set, ctx, onNext, onBack }) {
  const opts = [
    {
      key: 'home',
      title: 'AT HOME',
      sub: 'Bodyweight only. Push-ups, pull-ups, squats, planks, dips, holds.',
      meta: 'BW',
      glyph: <IconHome />,
    },
    {
      key: 'gym',
      title: 'GYM / GARAGE',
      sub: 'Reeplex PRO90 + dumbbells up to 35kg. Full split available.',
      meta: '≤ 35kg',
      glyph: <IconGym />,
    },
  ];
  return (
    <FormShell
      {...ctx}
      title="WHERE DO"
      accentLine="YOU TRAIN?"
      sub="We'll generate workouts that actually use what you have. Switch any time."
      footer={<FooterNav onBack={onBack} onNext={onNext} nextDisabled={!data.equipment} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o) => (
          <SelectCard
            key={o.key}
            active={data.equipment === o.key}
            onClick={() => { set({ equipment: o.key }); setTimeout(onNext, 240); }}
            title={o.title}
            subtitle={o.sub}
            meta={o.meta}
            glyph={o.glyph}
          />
        ))}
      </div>
    </FormShell>
  );
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 10 L11 3 L19 10 V19 H13 V13 H9 V19 H3 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconGym() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1.5" y="8" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="18.5" y="8" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="4.5" y="6" width="2.5" height="10" rx="1" fill="currentColor" />
      <rect x="15" y="6" width="2.5" height="10" rx="1" fill="currentColor" />
      <rect x="7" y="10" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

// ── 08 NIGHTLY CHECK-IN TIME ───────────────────────────────────────────────
function ScreenCheckInTime({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="NIGHTLY"
      accentLine="CHECK-IN."
      sub="A short, honest 9-question reflection. Pick the time you'll actually be free."
      footer={<FooterNav onBack={onBack} onNext={onNext} />}
    >
      <FieldLabel>Reminder time</FieldLabel>
      <div style={{ marginTop: 12 }}>
        <TimeWheel value={data.checkInTime} onChange={(v) => set({ checkInTime: v })} />
      </div>
      <BellHint text="We'll send a quiet push at this time, every night. Skipping breaks your streak." />
    </FormShell>
  );
}

function BellHint({ text }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: '14px 16px',
        background: C.accentSoft,
        border: `1px solid ${C.accentDim}`,
        borderRadius: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: 1, flexShrink: 0 }}>
        <path
          d="M9 1.6 C6.2 1.6 4.4 3.7 4.4 6.5 V9.6 L3 12.4 H15 L13.6 9.6 V6.5 C13.6 3.7 11.8 1.6 9 1.6 Z M7 13.8 C7 15 7.9 16 9 16 C10.1 16 11 15 11 13.8"
          stroke={C.accent}
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text, lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

// ── 09 FRIDAY WEIGH-IN TIME ────────────────────────────────────────────────
function ScreenWeighInTime({ data, set, ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="FRIDAY"
      accentLine="WEIGH-IN."
      sub="Every Friday morning. Post bathroom, pre water, pre breakfast. One number."
      footer={<FooterNav onBack={onBack} onNext={onNext} />}
    >
      <FieldLabel>Weigh-in window (5:00 – 7:00 AM)</FieldLabel>
      <div style={{ marginTop: 12 }}>
        <TimeWheel value={data.weighInTime} onChange={(v) => set({ weighInTime: v })} hourMin={5} hourMax={7} />
      </div>
      <BellHint text="“Friday weigh-in — hop on the scales before breakfast. Post bathroom, pre water.”" />
    </FormShell>
  );
}

// ── 10 GRATITUDE LIBRARY ───────────────────────────────────────────────────
const GRATITUDE_CATEGORIES = [
  { id: 'people', label: 'People', glyph: '👨‍👩‍👧‍👦', prompt: 'The people who make the whole thing worth it.', examples: ['A healthy family', 'A loyal partner', 'Good mates who show up', 'Kids who are thriving', 'Parents still around', 'A partner who backs me', 'Family close by', 'Friends I can call anytime', 'Grandkids', 'People who depend on me', 'A good role model growing up', 'Someone who believes in me'] },
  { id: 'health', label: 'Health & body', glyph: '💪', prompt: 'A body and mind that let you do the work.', examples: ['Good health', 'A strong body', 'A clear mind', 'No serious injuries', 'Energy to train', 'Sleeping well', 'Two working legs', 'Getting older but still going', 'A body that recovers', 'Mental toughness', 'Good eyesight', 'Freedom from pain'] },
  { id: 'home', label: 'Home & security', glyph: '🏠', prompt: 'The foundation under everything else.', examples: ['A good house', 'A roof that\u2019s ours', 'A safe neighbourhood', 'Food on the table', 'Money in the bank', 'A warm home in winter', 'A bit of land', 'No debt hanging over me', 'A shed of my own', 'A comfortable bed', 'Security for my family', 'A place to call home'] },
  { id: 'work', label: 'Work & opportunity', glyph: '💼', prompt: 'What you\u2019ve built and what it provides.', examples: ['A good business', 'Steady income', 'Work I\u2019m proud of', 'Freedom to choose my hours', 'Opportunities ahead', 'Good people to work with', 'A trade behind me', 'Customers who trust me', 'Building something lasting', 'Being my own boss', 'Work that means something', 'A reputation I\u2019ve earned'] },
  { id: 'things', label: 'What you\u2019ve earned', glyph: '🚙', prompt: 'The things you worked for and get to enjoy.', examples: ['A good car', 'A good ute', 'Tools that do the job', 'A bit put away', 'Toys for the weekend', 'A boat', 'The caravan', 'A reliable vehicle', 'Gear that lasts', 'Something I built with my hands', 'A bike in the garage', 'Hard-earned savings'] },
  { id: 'simple', label: 'Space to breathe', glyph: '🌅', prompt: 'The room to slow down and actually live.', examples: ['Ability to slow down and relax', 'Time off when I need it', 'Weekends with family', 'A quiet morning', 'A holiday on the horizon', 'A day with nothing on', 'Time in nature', 'A good night\u2019s sleep', 'Sunday with no alarm', 'Fishing or being outdoors', 'A coffee in peace', 'Room to switch off'] },
  { id: 'faith', label: 'Faith & purpose', glyph: '🙏', prompt: 'What grounds you when the noise is loudest.', examples: ['A sense of purpose', 'Faith to lean on', 'Peace of mind', 'Knowing my why', 'Something bigger than me', 'A reason to get up', 'Gratitude itself', 'Second chances', 'Lessons from hard times', 'Hope for the future', 'A clear conscience', 'Direction in life'] },
];

function ScreenGratitudeIntro({ ctx, onNext, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="BUILD YOUR"
      accentLine="GRATITUDE LIBRARY."
      sub="Each night the app pulls 3 random items for you. The bigger your library, the deeper the well. Aim for 20–50 items."
      footer={<FooterNav onBack={onBack} onNext={onNext} nextLabel="Start the library" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GRATITUDE_CATEGORIES.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 14px',
              background: C.surf1,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 22 }}>{c.glyph}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 15, letterSpacing: 1, color: C.text, textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.35 }}>{c.prompt}</div>
            </div>
          </div>
        ))}
      </div>
    </FormShell>
  );
}

function ScreenGratitudeBuilder({ data, set, ctx, onNext, onBack }) {
  const [activeCat, setActiveCat] = React.useState(GRATITUDE_CATEGORIES[0].id);
  const [input, setInput] = React.useState('');

  const items = data.gratitude || [];
  const byCat = (id) => items.filter((g) => g.cat === id);
  const cat = GRATITUDE_CATEGORIES.find((c) => c.id === activeCat);
  const totalCount = items.length;
  const target = 20;
  const pct = Math.min(1, totalCount / target);

  // Encourage spread across life areas, not just one bucket.
  const MIN_ITEMS = 6;
  const MIN_AREAS = 3;
  const areasCovered = new Set(items.map((g) => g.cat)).size;
  const ready = totalCount >= MIN_ITEMS && areasCovered >= MIN_AREAS;
  const areasLeft = MIN_AREAS - areasCovered;
  const nextLabel =
    totalCount < MIN_ITEMS ? `${MIN_ITEMS - totalCount} more to continue`
    : areasCovered < MIN_AREAS ? `Add from ${areasLeft} more area${areasLeft > 1 ? 's' : ''}`
    : 'Continue';

  const add = (text) => {
    const t = text.trim();
    if (!t) return;
    set({ gratitude: [...items, { id: Date.now() + Math.random(), cat: activeCat, text: t }] });
    setInput('');
  };
  const remove = (id) => set({ gratitude: items.filter((g) => g.id !== id) });

  return (
    <FormShell
      {...ctx}
      title="GRATITUDE"
      accentLine="LIBRARY."
      sub={null}
      footer={<FooterNav onBack={onBack} onNext={onNext} nextDisabled={!ready} nextLabel={nextLabel} />}
    >
      {/* Progress strip */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: 1.5,
            color: C.textMid,
            marginBottom: 6,
          }}
        >
          <span>LIBRARY DEPTH</span>
          <span>
            <span style={{ color: C.accent, fontSize: 14, fontWeight: 600 }}>{totalCount}</span>
            <span style={{ color: C.textLow }}> / {target}+</span>
          </span>
        </div>
        <div style={{ height: 4, background: C.surf2, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: C.accent, transition: 'width .25s' }} />
        </div>

        {/* Areas-covered indicator — nudges spread across categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow }}>
            AREAS
          </span>
          <div style={{ display: 'flex', gap: 5, flex: 1 }}>
            {GRATITUDE_CATEGORIES.map((c) => {
              const has = byCat(c.id).length > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  title={c.label}
                  style={{
                    flex: 1, height: 6, borderRadius: 3, border: 0, padding: 0, cursor: 'pointer',
                    background: has ? C.accent : 'rgba(255,255,255,.10)',
                    transition: 'background .2s',
                  }}
                />
              );
            })}
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1, color: areasCovered >= MIN_AREAS ? C.accent : C.textLow }}>
            {areasCovered}/{MIN_AREAS}+
          </span>
        </div>
        {!ready && totalCount >= 2 && areasCovered < MIN_AREAS && (
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, lineHeight: 1.45, margin: '10px 0 0' }}>
            Good start. Now pull from a few different areas — a fuller picture makes your nightly shuffle land harder.
          </p>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginLeft: -2, marginRight: -2 }}>
        {GRATITUDE_CATEGORIES.map((c) => {
          const count = byCat(c.id).length;
          const active = c.id === activeCat;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{
                flexShrink: 0,
                padding: '8px 12px',
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                background: active ? C.accentDim : C.surf1,
                color: active ? C.accent : C.text,
                borderRadius: 999,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{c.glyph}</span>
              <span>{c.label}</span>
              {count > 0 && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    color: active ? '#0A0A0C' : C.textLow,
                    background: active ? C.accent : 'transparent',
                    borderRadius: 4,
                    padding: '1px 5px',
                    marginLeft: 2,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current category prompt */}
      <p style={{ fontFamily: 'Outfit, sans-serif', color: C.textMid, fontSize: 13, lineHeight: 1.5, margin: '14px 0 10px' }}>
        {cat.prompt}
      </p>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(input); }}
          placeholder={`Add to ${cat.label.toLowerCase()}…`}
          style={{
            flex: 1,
            background: C.surf1,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            color: C.text,
            fontFamily: 'Outfit, sans-serif',
            fontSize: 14,
            padding: '12px 14px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => add(input)}
          disabled={!input.trim()}
          style={{
            width: 46,
            background: input.trim() ? C.accent : C.surf2,
            color: input.trim() ? '#0A0A0C' : C.textLow,
            border: 0,
            borderRadius: 10,
            fontSize: 22,
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'default',
          }}
        >
          +
        </button>
      </div>

      {/* Selected items for this category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {byCat(activeCat).map((g) => (
          <div
            key={g.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: C.surf1,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
            }}
          >
            <div style={{ width: 4, height: 16, background: C.accent, borderRadius: 2 }} />
            <span style={{ flex: 1, fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.text }}>{g.text}</span>
            <button
              onClick={() => remove(g.id)}
              style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Suggestions — stay visible; tap to add as many as apply. Used ones drop off. */}
      {(() => {
        const usedTexts = new Set(byCat(activeCat).map((g) => g.text.toLowerCase()));
        const available = (cat.examples || []).filter((ex) => !usedTexts.has(ex.toLowerCase()));
        if (available.length === 0) {
          return (
            <div style={{ marginTop: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.5 }}>
              ALL CAUGHT UP HERE — ADD YOUR OWN ABOVE, OR TRY ANOTHER CATEGORY.
            </div>
          );
        }
        return (
          <div style={{ marginTop: byCat(activeCat).length ? 16 : 4 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 2, marginBottom: 8 }}>
              {byCat(activeCat).length ? 'MORE IDEAS — TAP ANY THAT FIT' : 'TAP ANY THAT FIT YOUR LIFE'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {available.map((ex, i) => (
                <button
                  key={ex + i}
                  onClick={() => add(ex)}
                  style={{
                    padding: '7px 11px',
                    background: 'transparent',
                    border: `1px dashed ${C.lineStrong}`,
                    borderRadius: 999,
                    color: C.textMid,
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  + {ex}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </FormShell>
  );
}

// ── 11 FITNESS STARTING POINT ──────────────────────────────────────────────
function ScreenFitnessLevel({ data, set, ctx, onNext, onBack }) {
  const opts = [
    { key: 'beginner', title: 'BEGINNER', sub: 'New to lifting, returning after a long break, or building base strength.', meta: '0–6 mo' },
    { key: 'intermediate', title: 'INTERMEDIATE', sub: 'Consistent for 6+ months. Comfortable with the major lifts.', meta: '6–24 mo' },
    { key: 'advanced', title: 'ADVANCED', sub: 'Years in. Diminishing returns. Want smarter programming, not harder.', meta: '24+ mo' },
  ];
  return (
    <FormShell
      {...ctx}
      title="WHERE ARE YOU"
      accentLine="STARTING FROM?"
      sub="Be honest — overshooting only slows your progress. The AI calibrates from here."
      footer={<FooterNav onBack={onBack} onNext={onNext} nextDisabled={!data.fitnessLevel} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o) => (
          <SelectCard
            key={o.key}
            active={data.fitnessLevel === o.key}
            onClick={() => { set({ fitnessLevel: o.key }); setTimeout(onNext, 240); }}
            title={o.title}
            subtitle={o.sub}
            meta={o.meta}
          />
        ))}
      </div>
    </FormShell>
  );
}

// ── 12.5 TRACK FOOD? (gates the calculator + diet tracking) ─────────────────
function ScreenTrackFood({ data, set, ctx, onYes, onNo, onBack }) {
  return (
    <FormShell
      {...ctx}
      title="WANT TO TRACK"
      accentLine="FOOD & CALORIES?"
      sub="Optional. If yes, we'll calculate your calorie + protein targets and you can log meals from the + button. If no, we still track your weight — just no macro targets."
      footer={<FooterNav onBack={onBack} onNext={onNo} nextLabel="Not right now" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SelectCard
          active={false}
          onClick={onYes}
          title="YES — TRACK IT"
          subtitle="Set my calorie & protein targets, log meals by photo or text."
          meta="RECOMMENDED"
          glyph={<span style={{ fontSize: 20 }}>🍽️</span>}
        />
        <SelectCard
          active={false}
          onClick={onNo}
          title="NOT RIGHT NOW"
          subtitle="Skip targets. Keep weight tracking only. Turn it on later in Settings."
          glyph={<span style={{ fontSize: 20 }}>⏭️</span>}
        />
      </div>
    </FormShell>
  );
}

// ── 12 1RM ESTIMATES (skippable) ───────────────────────────────────────────
const LIFTS = [
  { key: 'bench', label: 'Flat Bench Press', placeholder: 80 },
  { key: 'shoulder', label: 'Shoulder Press', placeholder: 50 },
  { key: 'squat', label: 'Squat', placeholder: 100 },
  { key: 'curl', label: 'Bicep Curl', placeholder: 18 },
  { key: 'pulldown', label: 'Lat Pulldown', placeholder: 65 },
  { key: 'row', label: 'Seated Row', placeholder: 70 },
];

function Screen1RM({ data, set, ctx, onNext, onBack }) {
  const lifts = data.lifts || {};
  const setLift = (k, v) => set({ lifts: { ...lifts, [k]: v } });
  return (
    <FormShell
      {...ctx}
      title="CURRENT"
      accentLine="ESTIMATES."
      sub="Roughly what you'd grind out for one rep, today, fresh. Skip if you're not sure — we'll learn it from session 1."
      onSkip={onNext}
      skipLabel="Skip — learn from session 1"
      footer={<FooterNav onBack={onBack} onNext={onNext} nextLabel="Save & continue" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LIFTS.map((l) => (
          <LiftRow
            key={l.key}
            label={l.label}
            value={lifts[l.key]}
            placeholder={l.placeholder}
            onChange={(v) => setLift(l.key, v)}
          />
        ))}
      </div>
    </FormShell>
  );
}

function LiftRow({ label, value, placeholder, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: C.text }}>
          {label}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.5, marginTop: 2 }}>
          1RM ESTIMATE
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          background: C.surf2,
          borderRadius: 8,
          padding: '6px 12px',
          border: `1px solid ${value ? C.accentDim : C.line}`,
        }}
      >
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={String(placeholder)}
          style={{
            width: 54,
            background: 'transparent',
            border: 0,
            color: value ? C.accent : C.textLow,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 20,
            fontWeight: 600,
            outline: 0,
            textAlign: 'right',
            padding: 0,
          }}
        />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid, letterSpacing: 1 }}>KG</span>
      </div>
    </div>
  );
}

// ── 13 COMPLETION ──────────────────────────────────────────────────────────
function ScreenComplete({ data, onFinish }) {
  const stats = [
    { label: 'TRAINING', value: `${data.trainingDays}×/wk` },
    { label: 'TARGET', value: `${data.weightGoal}kg` },
    { label: 'STEPS', value: `${(data.stepGoal / 1000).toFixed(1)}k` },
    { label: 'SLEEP', value: `${data.sleepGoal}h` },
    { label: 'GRATITUDE', value: `${(data.gratitude || []).length} items` },
    { label: 'CHECK-IN', value: data.checkInTime },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, padding: '32px 28px 28px', position: 'relative' }}>
      {/* check mark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: '50%',
            border: `2px solid ${C.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.accentSoft,
            boxShadow: '0 0 40px rgba(242,163,15,.25)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path d="M11 22 L19 30 L33 14" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 3, marginTop: 18 }}>
          BASE BUILT
        </div>
      </div>

      <h1
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 0.96,
          color: C.text,
          margin: '20px 0 16px',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          textAlign: 'center',
        }}
      >
        WELCOME IN,
        <br />
        <span style={{ color: C.accent }}>{(data.name || 'FRIEND').toUpperCase()}.</span>
      </h1>
      <p
        style={{
          fontFamily: 'Outfit, sans-serif',
          color: C.textMid,
          fontSize: 14,
          lineHeight: 1.5,
          margin: '0 auto 24px',
          maxWidth: 300,
          textAlign: 'center',
        }}
      >
        Your first check-in is tonight at <span style={{ color: C.accent }}>{data.checkInTime}</span>. Show up. That's the whole thing.
      </p>

      {/* stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: '12px 14px',
              background: C.surf1,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.8 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: C.text, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <PrimaryButton onClick={onFinish}>Enter Compound</PrimaryButton>
      </div>
    </div>
  );
}
// ── Footer nav ─────────────────────────────────────────────────────────────
function FooterNav({ onBack, onNext, nextDisabled, nextLabel = 'Continue' }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 56,
            height: 56,
            border: `1px solid ${C.line}`,
            background: C.surf1,
            borderRadius: 12,
            color: C.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="12" viewBox="0 0 16 12">
            <path d="M15 6 L3 6 M7 1.5 L2.5 6 L7 10.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div style={{ flex: 1 }}>
        <PrimaryButton onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ── Save & Exit modal ──────────────────────────────────────────────────────
function SaveExitModal({ onResume, onExit }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,7,9,.84)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 3, marginBottom: 18 }}>
        SAVED.
      </div>
      <h2
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 36,
          color: C.text,
          textTransform: 'uppercase',
          textAlign: 'center',
          margin: '0 0 14px',
          lineHeight: 0.98,
        }}
      >
        WE'LL BE HERE
        <br />
        <span style={{ color: C.accent }}>WHEN YOU'RE BACK.</span>
      </h2>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, textAlign: 'center', maxWidth: 280, marginBottom: 28, lineHeight: 1.5 }}>
        Your progress is saved. Pick up exactly where you left off — no rush, no penalty.
      </p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={onResume} icon={false}>Keep going</PrimaryButton>
        <button
          onClick={onExit}
          style={{
            height: 48,
            background: 'transparent',
            border: 0,
            color: C.textMid,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            letterSpacing: 2,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Exit for now →
        </button>
      </div>
    </div>
  );
}

// ── Exit (placeholder lock screen) ─────────────────────────────────────────
function ExitedScreen({ onReturn }) {
  return (
    <div
      style={{
        height: '100%',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.accent, letterSpacing: 4, marginBottom: 14 }}>
        ◆ COMPOUND
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, marginBottom: 32, textAlign: 'center' }}>
        Onboarding paused.<br />Your data is saved locally.
      </div>
      <PrimaryButton onClick={onReturn}>Resume onboarding</PrimaryButton>
    </div>
  );
}

Object.assign(window, {
  ScreenWelcome, ScreenName, ScreenAge, ScreenWeight, ScreenTrainingDays,
  ScreenStepsSleep, ScreenEquipment, ScreenCheckInTime, ScreenWeighInTime,
  ScreenGratitudeIntro, ScreenGratitudeBuilder, ScreenFitnessLevel,
  Screen1RM, ScreenTrackFood, ScreenComplete, SaveExitModal, ExitedScreen, FormShell, FooterNav,
  GRATITUDE_CATEGORIES, LIFTS,
});

// macro-calc-screen.jsx — rippedbody-style calculator UI (onboarding + Settings recalc).

function MacroCalculator({ user, initial, onDone, onBack, oneTap }) {
  // Seed from user profile / prior targets
  const prior = initial || (window.loadTargets ? window.loadTargets() : null) || {};
  const [gender, setGender] = React.useState(user.gender || prior.gender || 'male');
  const [age, setAge] = React.useState(window.computeAge ? (window.computeAge(user.dob) || 32) : 32);
  const [weightKg, setWeightKg] = React.useState(user.weight || 82.5);
  const [heightCm, setHeightCm] = React.useState(user.heightCm || prior.heightCm || 178);
  const [bodyFat, setBodyFat] = React.useState(prior.bodyFat ?? null);
  const [activity, setActivity] = React.useState(prior.activity || 'light');
  const [goal, setGoal] = React.useState(prior.goal || (user.weightGoal < user.weight ? 'cut' : user.weightGoal > user.weight ? 'gain' : 'maintain'));
  const [rate, setRate] = React.useState(prior.rate || 0.5);
  const [fatPref, setFatPref] = React.useState(prior.fatPref || 'std');
  const [step, setStep] = React.useState(oneTap ? 1 : 0); // oneTap skips stats, confirm activity/goal

  const result = window.calcTargets({
    gender, age, weightKg, heightCm, bodyFat,
    activity, goal, rate, fatPref,
    inDeficit: goal === 'cut', proteinPerLb: 0.6,
  });

  const rateOpts = goal === 'cut' ? window.CUT_RATES : goal === 'gain' ? window.GAIN_RATES : [];

  const commit = () => {
    const t = { ...result, gender, age, weightKg, heightCm, bodyFat, fatPref, setAt: Date.now() };
    window.saveTargets(t);
    onDone && onDone(t);
  };

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button onClick={step === 0 || oneTap ? onBack : () => setStep(0)} style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>BACK</span>
        </button>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>
          {oneTap ? 'RECALCULATE' : 'YOUR TARGETS'}
        </span>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 8px' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <CalcHead tag="STEP 1 / 2" title="YOUR" accent="STATS." />
            <div>
              <FieldLabel>Gender</FieldLabel>
              <SegRow value={gender} onChange={setGender} options={[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel>Age</FieldLabel><Stepper value={age} onChange={setAge} min={13} max={99} unit="yrs" /></div>
              <div><FieldLabel>Height</FieldLabel><Stepper value={heightCm} onChange={setHeightCm} min={120} max={220} unit="cm" /></div>
            </div>
            <div>
              <FieldLabel>Weight</FieldLabel>
              <Stepper value={weightKg} onChange={setWeightKg} min={30} max={250} step={0.5} unit="kg" />
            </div>
            <div>
              <FieldLabel info="Optional. If you know it, the estimate uses lean mass (more accurate).">Body fat % (optional)</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stepper value={bodyFat ?? 0} onChange={(v) => setBodyFat(v === 0 ? null : v)} min={0} max={60} unit={bodyFat == null ? 'skip' : '%'} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CalcHead tag={oneTap ? 'CONFIRM' : 'STEP 2 / 2'} title="ACTIVITY" accent="& GOAL." />
            <div>
              <FieldLabel>Activity level</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {Object.entries(window.ACTIVITY).map(([k, a]) => (
                  <SelectCard key={k} active={activity === k} onClick={() => setActivity(k)} title={a.label} subtitle={a.sub} meta={`×${a.mult}`} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Goal</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 4 }}>
                {Object.entries(window.GOALS).map(([k, g]) => (
                  <button key={k} onClick={() => { setGoal(k); setRate(k === 'gain' ? 0.5 : 0.5); }}
                    style={{ padding: '12px 6px', borderRadius: 10, cursor: 'pointer',
                      background: goal === k ? C.accentDim : C.surf1, border: goal === k ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                      color: goal === k ? C.accent : C.text, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {rateOpts.length > 0 && (
              <div>
                <FieldLabel>Pace</FieldLabel>
                <SegRow value={rate} onChange={setRate} options={rateOpts.map((r) => ({ v: r.v, l: r.label }))} small />
              </div>
            )}
            <div>
              <FieldLabel>Fat preference</FieldLabel>
              <SegRow value={fatPref} onChange={setFatPref} options={[{ v: 'low', l: 'Lower' }, { v: 'std', l: 'Standard' }, { v: 'high', l: 'Higher' }]} small />
            </div>

            {/* Result preview */}
            <div style={{ background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)', border: `1px solid ${C.accentDim}`, borderRadius: 14, padding: 16, marginTop: 4 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>YOUR DAILY TARGET</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 38, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{result.calories}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.textMid }}>KCAL</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                <MacroPill label="PROTEIN" value={`${result.protein}g`} color={C.accent} />
                <MacroPill label="CARBS" value={`${result.carbs}g`} color="#7CA8E0" />
                <MacroPill label="FAT" value={`${result.fat}g`} color="#7BB661" />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1, marginTop: 10 }}>
                TDEE {result.tdee} · PROTEIN 0.6 g/lb · CARBS & FAT EDITABLE LATER
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 22px 22px' }}>
        {step === 0 ? (
          <PrimaryButton onClick={() => setStep(1)}>Next</PrimaryButton>
        ) : (
          <PrimaryButton onClick={commit} icon={false}>Lock in targets</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function CalcHead({ tag, title, accent }) {
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.accent, marginBottom: 10 }}>{tag}</div>
      <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 32, lineHeight: 0.98, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase' }}>
        {title} <span style={{ color: C.accent }}>{accent}</span>
      </h2>
    </div>
  );
}

function SegRow({ value, onChange, options, small }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={String(o.v)} onClick={() => onChange(o.v)}
            style={{ flex: small ? '1 1 auto' : 1, padding: small ? '9px 12px' : '12px 10px', borderRadius: 10, cursor: 'pointer',
              background: active ? C.accentDim : C.surf1, border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
              color: active ? C.accent : C.text, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 13.5, letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function MacroPill({ label, value, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: C.textLow, letterSpacing: 1.4 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 18, color, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

Object.assign(window, { MacroCalculator });

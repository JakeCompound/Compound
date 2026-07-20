import React from 'react';
import { C, FieldLabel, PrimaryButton, Stepper } from './compound-ui.jsx';

// macro-calc-screen.jsx — rippedbody-style calculator UI (onboarding + Settings recalc).

function MacroCalculator({ user, initial, onDone, onBack, oneTap }) {
  // Seed from user profile / prior targets
  const prior = initial || (window.loadTargets ? window.loadTargets() : null) || {};
  const [gender, setGender] = React.useState(user.gender || prior.gender || 'male');
  const [age, setAge] = React.useState(window.computeAge ? (window.computeAge(user.dob) || 32) : 32);
  const [weightKg, setWeightKg] = React.useState(user.weight || 82.5);
  const [heightCm, setHeightCm] = React.useState(user.heightCm || prior.heightCm || 178);
  const [bodyFat, setBodyFat] = React.useState(prior.bodyFat ?? null);
  const [steps, setSteps] = React.useState(prior.steps ?? 7000);
  const [sessions, setSessions] = React.useState(prior.sessions ?? (user.trainingDays || 3));
  const [minutes, setMinutes] = React.useState(prior.minutes ?? 45);
  // v2 earned-calories model: the base assumes only a lifestyle floor; workouts
  // and steps above it are earned per-day. Default to the lowest honest option.
  const [lifestyle, setLifestyle] = React.useState(prior.lifestyle || 'sedentary');
  const [goal, setGoal] = React.useState(prior.goal || (user.weightGoal < user.weight ? 'cut' : user.weightGoal > user.weight ? 'gain' : 'maintain'));
  const [rate, setRate] = React.useState(prior.rate || 0.5);
  const [fatPref, setFatPref] = React.useState(prior.fatPref || 'std');
  // User-edited macros (step 2). null until seeded from the computed targets.
  const [editP, setEditP] = React.useState(null);
  const [editC, setEditC] = React.useState(null);
  const [editF, setEditF] = React.useState(null);
  const [step, setStep] = React.useState(oneTap ? 1 : 0); // 0 stats · 1 activity+goal · 2 macros

  // v3: the leangains formula (musclehacking.com) with fixed assumptions —
  // body fat 20%+, standard muscle mass, 5,000 steps, −500 kcal (−350 women),
  // 30% protein, 50-50 carb/fat. Only stats are asked; the rest is assumed.
  const result = window.calcTargets({ formula: 'leangains', gender, age, weightKg, heightCm });

  const rateOpts = goal === 'cut' ? window.CUT_RATES : goal === 'gain' ? window.GAIN_RATES : [];

  // Editable macros (step 2) — seeded from the computed targets, locked to the
  // calorie target so raising one macro forces trimming another to stay at/under it.
  const macroP = editP ?? result.protein;
  const macroC = editC ?? result.carbs;
  const macroF = editF ?? result.fat;
  const usedKcal = macroP * 4 + macroC * 4 + macroF * 9;
  const remainingKcal = result.calories - usedKcal;
  const overBy = Math.max(0, -remainingKcal);
  const proteinFloor = result.protein; // the 0.6 g/lb recommendation
  const belowProtein = macroP < proteinFloor;
  // Re-seed each time the user advances, so changing calories upstream resets macros.
  const goToMacros = () => { setEditP(result.protein); setEditC(result.carbs); setEditF(result.fat); setStep(2); };

  const commit = () => {
    const t = { ...result, protein: macroP, carbs: macroC, fat: macroF, gender, age, weightKg, heightCm, bodyFat, fatPref, setAt: Date.now() };
    window.saveTargets(t);
    onDone && onDone(t);
  };

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => { if (step === 2) setStep(1); else if (step === 1 && !oneTap) setStep(0); else onBack(); }} style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>BACK</span>
        </button>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>
          {oneTap ? 'RECALCULATE' : 'YOUR TARGETS'}
        </span>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px 8px' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <CalcHead tag="STEP 1 / 3" title="YOUR" accent="STATS." />
            <div>
              <FieldLabel>Gender</FieldLabel>
              <SegRow value={gender} onChange={setGender} options={[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
              <div><FieldLabel>Age</FieldLabel><Stepper value={age} onChange={setAge} min={13} max={99} unit="yrs" /></div>
              <div><FieldLabel>Height</FieldLabel><Stepper value={heightCm} onChange={setHeightCm} min={120} max={220} unit="cm" /></div>
            </div>
            <div>
              <FieldLabel>Weight</FieldLabel>
              <Stepper value={weightKg} onChange={setWeightKg} min={30} max={250} step={0.5} unit="kg" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CalcHead tag={oneTap ? 'CONFIRM' : 'STEP 2 / 3'} title="YOUR" accent="PLAN." />

            {/* Result preview — the leangains formula needs nothing more from you */}
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
                MAINTENANCE {result.tdee} − {gender === 'female' ? 350 : 500} · PROTEIN 30% · CARBS/FAT 50-50
              </div>
            </div>

            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.55, margin: 0 }}>
              This base assumes an ordinary day (about 5,000 steps, no training). Every workout, walk, run and
              step count you log is <span style={{ color: C.accent }}>added to that day's allowance</span> — you earn it by doing it.
              The gentle built-in deficit keeps weight moving down steadily; the weekly weigh-in fine-tunes from there.
            </p>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CalcHead tag={oneTap ? 'MACROS' : 'STEP 3 / 3'} title="DIAL IN" accent="MACROS." />

            {/* Calorie target + live remaining/over readout */}
            <div style={{ background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)', border: `1px solid ${C.accentDim}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>CALORIE TARGET</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 38, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{result.calories}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.textMid }}>KCAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, color: remainingKcal < 0 ? C.danger : C.success, fontVariantNumeric: 'tabular-nums' }}>{Math.abs(remainingKcal)}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid, letterSpacing: 1 }}>{remainingKcal < 0 ? 'KCAL OVER' : 'KCAL REMAINING'}</span>
              </div>
              {remainingKcal < 0 && (
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.accent, marginTop: 8, lineHeight: 1.4 }}>
                  Over by {overBy} kcal — trim a macro to fit.
                </div>
              )}
              {belowProtein && (
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.accent, marginTop: remainingKcal < 0 ? 4 : 8, lineHeight: 1.4 }}>
                  Protein below the 0.6 g/lb recommendation ({proteinFloor}g) — fine to leave, but more helps.
                </div>
              )}
            </div>

            <div><FieldLabel>Protein</FieldLabel><Stepper value={macroP} onChange={setEditP} min={0} max={400} step={5} unit="g protein" /></div>
            <div><FieldLabel>Carbs</FieldLabel><Stepper value={macroC} onChange={setEditC} min={0} max={700} step={5} unit="g carbs" /></div>
            <div><FieldLabel>Fat</FieldLabel><Stepper value={macroF} onChange={setEditF} min={0} max={250} step={5} unit="g fat" /></div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: '12px 22px 22px' }}>
        {step === 0 ? (
          <PrimaryButton onClick={() => setStep(1)}>Next</PrimaryButton>
        ) : step === 1 ? (
          <PrimaryButton onClick={goToMacros}>Next</PrimaryButton>
        ) : (
          <PrimaryButton onClick={commit} icon={false} disabled={overBy > 0}>Lock in targets</PrimaryButton>
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

export { CalcHead, MacroCalculator, MacroPill, SegRow };

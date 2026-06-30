import React from 'react';
import { C, FieldLabel, MultiChip, StarRating, StepBar, Stepper } from './compound-ui.jsx';
import { FooterNav } from './onboarding-screens.jsx';

// checkin-modal.jsx — Nightly 9-question check-in
// Slides up from bottom over the Home screen.

const MUSCLE_GROUPS = ['Chest', 'Triceps', 'Biceps', 'Back', 'Legs', 'Core', 'Cardio', 'Full Body'];

const DIET_TIERS = [
  { stars: 1, label: 'Poor', body: 'Junk food, no restraint, no awareness.' },
  { stars: 2, label: 'Below average', body: 'Mostly poor choices.' },
  { stars: 3, label: 'Neutral', body: 'Mix of good and bad, mild restraint.' },
  { stars: 4, label: 'Good', body: 'Mostly healthy, minor slip.' },
  { stars: 5, label: 'Excellent', body: 'Mindful, clean, on plan.' },
];

const CALM_TIERS = [
  { stars: 1, label: 'Overwhelmed', body: 'Anxious, reactive.' },
  { stars: 2, label: 'High stress', body: 'Struggling to cope.' },
  { stars: 3, label: 'Moderate', body: 'Manageable tension.' },
  { stars: 4, label: 'Mostly calm', body: 'Handling things well.' },
  { stars: 5, label: 'Centred', body: 'Clear-minded, at peace.' },
];

// In-progress check-in draft — survives a re-render/rotation that remounts the
// modal. Keyed to the day so a stale draft never restores tomorrow.
const CHECKIN_DRAFT_KEY = 'compound:checkinDraft';
const ciToday = () => new Date().toISOString().slice(0, 10);
function loadCheckinDraft() {
  try { const d = JSON.parse(sessionStorage.getItem(CHECKIN_DRAFT_KEY)); if (d && d.date === ciToday()) return d; } catch (e) {}
  return null;
}
function saveCheckinDraft(step, answers, gratShuffle) {
  try { sessionStorage.setItem(CHECKIN_DRAFT_KEY, JSON.stringify({ date: ciToday(), step, answers, gratShuffle })); } catch (e) {}
}
function clearCheckinDraft() { try { sessionStorage.removeItem(CHECKIN_DRAFT_KEY); } catch (e) {} }

function CheckinModal({ open, onClose, onComplete, gratitudeLibrary = [], user = {}, initialAnswers = null }) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({
    workoutToday: null,
    workoutGroups: [],
    workoutMinutes: 30,
    workoutIntensity: 0,
    steps: 8500,
    sleep: 7.5,
    dietRating: 0,
    afd: null,
    nips: 0,
    calmRating: 0,
    gratitudeAcked: [false, false, false, false, false, false],
    gratitudeNew: '',
    partnerTime: null,
    partnerNote: '',
    spirit: null,
    spiritMinutes: 15,
    spiritNotes: '',
    workoutDays: Array.isArray(user.workoutDays) ? user.workoutDays : null,
  });

  // Gratitude shuffle — 6 random items, computed once when modal opens.
  const [gratShuffle, setGratShuffle] = React.useState([]);
  // Texts shown so far this session — Refresh works through the whole library
  // before repeating any (pinned/ticked items don't count against it).
  const gratSeenRef = React.useRef(new Set());
  React.useEffect(() => {
    if (!open) return;
    const pool = gratitudeLibrary.length > 0 ? gratitudeLibrary : DEFAULT_GRATITUDE;

    // Restore an in-progress check-in if we remounted mid-session (e.g. a
    // landscape rotation). Only for a fresh check-in, not when editing.
    const draft = initialAnswers ? null : loadCheckinDraft();
    if (draft && Array.isArray(draft.gratShuffle) && draft.gratShuffle.length) {
      setStep(draft.step || 0);
      setAnswers((a) => ({ ...a, ...draft.answers }));
      setGratShuffle(draft.gratShuffle);
      gratSeenRef.current = new Set(draft.gratShuffle.map((g) => g.text));
      return;
    }

    setStep(0);
    const shuf = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
    setGratShuffle(shuf);
    gratSeenRef.current = new Set(shuf.map((g) => g.text));
    // Editing an existing check-in → prefill with what was logged today
    // (pre-tick all so the min-2 gate is already satisfied).
    if (initialAnswers) {
      setAnswers((a) => ({ ...a, ...initialAnswers, gratitudeAcked: shuf.map(() => true), gratitudeNew: initialAnswers.gratitudeNew || '' }));
    } else {
      // Fresh open: prefill nips from today's live tally (logged via + Add).
      var liveNips = window.loadNipsToday ? window.loadNipsToday() : 0;
      setAnswers((a) => ({ ...a, gratitudeAcked: shuf.map(() => false), gratitudeNew: '', nips: liveNips, afd: liveNips > 0 ? false : a.afd }));
    }
  }, [open]);

  // Persist the in-progress draft on every change so a remount can restore it.
  React.useEffect(() => {
    if (!open || gratShuffle.length === 0) return;
    saveCheckinDraft(step, answers, gratShuffle);
  }, [open, step, answers, gratShuffle]);

  // Re-roll the un-ticked slots, pulling items the user hasn't seen yet this
  // session, so Refresh works through the whole library before repeating any.
  // Ticked items stay pinned. When the library is exhausted, a fresh cycle
  // starts (seen forgets everything except the pinned items). A library too
  // small to fill the slots falls back to reshuffling the current un-ticked.
  const refreshGratitude = () => {
    const pool = gratitudeLibrary.length > 0 ? gratitudeLibrary : DEFAULT_GRATITUDE;
    const seen = gratSeenRef.current;
    const shownTexts = new Set(gratShuffle.map((g) => g.text));
    const untickedCount = gratShuffle.filter((g, i) => !answers.gratitudeAcked[i]).length;

    let candidates = pool.filter((g) => !shownTexts.has(g.text) && !seen.has(g.text)).sort(() => Math.random() - 0.5);
    if (candidates.length < untickedCount) {
      // Use the last unseen items, then begin a new cycle: forget all but the pinned.
      const usedTexts = new Set(candidates.map((g) => g.text));
      seen.clear();
      gratShuffle.forEach((g, i) => { if (answers.gratitudeAcked[i]) seen.add(g.text); });
      const rest = pool.filter((g) => !shownTexts.has(g.text) && !usedTexts.has(g.text) && !seen.has(g.text)).sort(() => Math.random() - 0.5);
      candidates = [...candidates, ...rest];
    }
    const reshuffledUnticked = gratShuffle.filter((g, i) => !answers.gratitudeAcked[i]).sort(() => Math.random() - 0.5);
    const fillers = [...candidates, ...reshuffledUnticked];
    let fi = 0;
    const next = gratShuffle.map((g, i) => (answers.gratitudeAcked[i] ? g : (fillers[fi++] || g)));
    next.forEach((g) => seen.add(g.text));
    setGratShuffle(next);
  };

  const set = (patch) => setAnswers((a) => ({ ...a, ...patch }));

  // Compose the actual sequence of steps based on conditional branches.
  const isSunday = new Date().getDay() === 0;
  const seq = (() => {
    const s = ['workout'];
    if (answers.workoutToday === true) s.push('workoutGroups', 'workoutMinutes', 'workoutIntensity');
    s.push('steps', 'sleep', 'diet', 'afd');
    if (answers.afd === false) s.push('nips');
    s.push('calm', 'gratitude', 'partner', 'spirit');
    if (answers.spirit === true) s.push('spiritDetail');
    if (isSunday) s.push('weekPlan');
    return s;
  })();

  const currentKey = seq[step];
  const total = seq.length;

  const advance = () => {
    if (step >= total - 1) {
      clearCheckinDraft();
      onComplete && onComplete(answers);
    } else {
      setStep(step + 1);
    }
  };
  const back = () => setStep(Math.max(0, step - 1));
  // Closing = cancelling the in-progress check-in → drop the draft.
  const handleClose = () => { clearCheckinDraft(); onClose && onClose(); };

  // Auto-advance: a ref always points at the freshest advance() so a delayed
  // call (after the answer's re-render) completes with up-to-date answers.
  const advanceRef = React.useRef(advance);
  advanceRef.current = advance;
  const auto = (patch) => { set(patch); setTimeout(() => advanceRef.current && advanceRef.current(), 280); };

  const canAdvance = (() => {
    switch (currentKey) {
      case 'workout': return answers.workoutToday !== null;
      case 'workoutGroups': return answers.workoutGroups.length > 0;
      case 'workoutIntensity': return answers.workoutIntensity > 0;
      case 'diet': return answers.dietRating > 0;
      case 'afd': return answers.afd !== null;
      case 'calm': return answers.calmRating > 0;
      case 'gratitude': return answers.gratitudeAcked.filter(Boolean).length >= Math.min(2, gratShuffle.length || 2);
      case 'partner': return answers.partnerTime !== null;
      case 'spirit': return answers.spirit !== null;
      case 'weekPlan': return Array.isArray(answers.workoutDays) && answers.workoutDays.length > 0;
      default: return true;
    }
  })();

  const renderStep = () => {
    switch (currentKey) {
      case 'workout':
        return (
          <CIQuestion
            tag="HEALTH · 1 / 9"
            title="DID YOU WORKOUT"
            accent="TODAY?"
            sub="Anything that got the heart up and the body moving counts. Be honest."
          >
            <YesNo value={answers.workoutToday} onChange={(v) => auto({ workoutToday: v })} />
          </CIQuestion>
        );
      case 'workoutGroups':
        return (
          <CIQuestion tag="WORKOUT · MUSCLE GROUPS" title="WHAT DID YOU" accent="TRAIN?" sub="Pick everything you hit. Multiple groups are fine.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {MUSCLE_GROUPS.map((g) => {
                const active = answers.workoutGroups.includes(g);
                return (
                  <MultiChip
                    key={g}
                    active={active}
                    onClick={() =>
                      set({
                        workoutGroups: active
                          ? answers.workoutGroups.filter((x) => x !== g)
                          : [...answers.workoutGroups, g],
                      })
                    }
                  >
                    {g}
                  </MultiChip>
                );
              })}
            </div>
          </CIQuestion>
        );
      case 'workoutMinutes':
        return (
          <CIQuestion tag="WORKOUT · DURATION" title="HOW LONG WERE" accent="YOU AT IT?">
            <FieldLabel>Minutes worked out</FieldLabel>
            <div style={{ marginTop: 12 }}>
              <Stepper value={answers.workoutMinutes} onChange={(v) => set({ workoutMinutes: v })} min={5} max={240} step={5} unit="minutes" large />
            </div>
          </CIQuestion>
        );
      case 'workoutIntensity':
        return (
          <CIQuestion tag="WORKOUT · EFFORT" title="HOW HARD DID" accent="IT FEEL?" sub="1 = easy. 5 = the kind that earns the sleep coming.">
            <div style={{ marginTop: 18 }}>
              <StarRating value={answers.workoutIntensity} onChange={(v) => auto({ workoutIntensity: v })} />
            </div>
          </CIQuestion>
        );
      case 'steps':
        return (
          <CIQuestion tag="HEALTH · 2 / 9" title="STEPS TODAY." accent="">
            <FieldLabel>From your phone / watch</FieldLabel>
            <div style={{ marginTop: 12 }}>
              <Stepper value={answers.steps} onChange={(v) => set({ steps: v })} min={0} max={50000} step={500} unit="steps" large />
            </div>
          </CIQuestion>
        );
      case 'sleep':
        return (
          <CIQuestion tag="HEALTH · 3 / 9" title="HOW MUCH SLEEP" accent="LAST NIGHT?">
            <FieldLabel>Hours (lights out → wake up)</FieldLabel>
            <div style={{ marginTop: 12 }}>
              <Stepper value={answers.sleep} onChange={(v) => set({ sleep: v })} min={0} max={14} step={0.25} unit="hours" large />
            </div>
          </CIQuestion>
        );
      case 'diet':
        return (
          <CIQuestion
            tag="HEALTH · 4 / 9"
            title="DIET QUALITY"
            accent="TODAY?"
            sub="Consistent 3–5 stars beats occasional perfection."
          >
            <div style={{ marginTop: 18 }}>
              <StarRating value={answers.dietRating} onChange={(v) => auto({ dietRating: v })} />
            </div>
            <TierGuide tiers={DIET_TIERS} value={answers.dietRating} />
          </CIQuestion>
        );
      case 'afd':
        return (
          <CIQuestion tag="HEALTH · 5 / 9" title="ALCOHOL-FREE" accent="DAY?">
            <YesNo value={answers.afd} onChange={(v) => auto({ afd: v })} yesLabel="Yes — AFD" noLabel="No — drank" />
          </CIQuestion>
        );
      case 'nips':
        return (
          <CIQuestion tag="ALCOHOL · DETAIL" title="ROUGHLY HOW" accent="MANY NIPS?">
            <FieldLabel info="A nip is a standard 30ml spirit measure. A beer ≈ 1.5 nips, a glass of wine ≈ 2 nips. Honest data, only for you.">
              Standard nips equivalent
            </FieldLabel>
            <div style={{ marginTop: 12 }}>
              <Stepper value={answers.nips} onChange={(v) => set({ nips: v })} min={0} max={30} step={1} unit="nips" large />
            </div>
          </CIQuestion>
        );
      case 'calm':
        return (
          <CIQuestion tag="MIND · 6 / 9" title="CALM & IN" accent="CONTROL TODAY?">
            <div style={{ marginTop: 18 }}>
              <StarRating value={answers.calmRating} onChange={(v) => auto({ calmRating: v })} />
            </div>
            <TierGuide tiers={CALM_TIERS} value={answers.calmRating} />
          </CIQuestion>
        );
      case 'gratitude': {
        const tickedCount = answers.gratitudeAcked.filter(Boolean).length;
        return (
          <CIQuestion tag="MIND · 7 / 9" title="GRATITUDE" accent="SHUFFLE." sub="Six from your library. Tick the ones that ring true tonight — at least two. Refresh swaps the rest.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {gratShuffle.map((g, i) => {
                const acked = answers.gratitudeAcked[i];
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const next = [...answers.gratitudeAcked];
                      next[i] = !next[i];
                      set({ gratitudeAcked: next });
                    }}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      padding: '14px 14px',
                      background: acked ? C.accentSoft : C.surf1,
                      border: `1px solid ${acked ? C.accentDim : C.line}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all .15s',
                    }}
                  >
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: acked ? C.accent : 'transparent',
                        border: acked ? `1px solid ${C.accent}` : `1.5px solid ${C.lineStrong}`,
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {acked && (
                        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7 L6 10 L11 4" stroke="#0A0A0C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </div>
                    <div style={{ flex: 1, fontFamily: 'Outfit, sans-serif', fontSize: 15, color: C.text, lineHeight: 1.35 }}>
                      {g.text}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.4, color: tickedCount >= 2 ? C.accent : C.textLow }}>
                {tickedCount} / 2+ TICKED
              </span>
              <button
                onClick={refreshGratitude}
                style={{ background: 'transparent', border: 0, color: C.accent, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.4, display: 'flex', alignItems: 'center', gap: 6, padding: 4 }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 7 A5 5 0 1 1 10.5 3.5 M12 1.5 V4 H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                REFRESH THE REST
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <FieldLabel>Anything new today? (optional)</FieldLabel>
              <input
                value={answers.gratitudeNew}
                onChange={(e) => set({ gratitudeNew: e.target.value })}
                placeholder="A small thing also counts…"
                style={{
                  width: '100%', marginTop: 8,
                  background: C.surf1, border: `1px solid ${C.line}`,
                  borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif',
                  fontSize: 14, padding: '12px 14px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </CIQuestion>
        );
      }
      case 'partner':
        return (
          <CIQuestion
            tag="LOVE · 8 / 9"
            title="QUALITY TIME"
            accent="WITH PARTNER?"
            sub="A Yes means at least one moment of undivided attention. Being in the same house doesn't count."
          >
            <YesNo value={answers.partnerTime} onChange={(v) => set({ partnerTime: v })} />
            <div style={{ marginTop: 18 }}>
              <FieldLabel>What did you do? (optional)</FieldLabel>
              <input
                value={answers.partnerNote}
                onChange={(e) => set({ partnerNote: e.target.value })}
                placeholder="e.g. Walked the dog together"
                style={{
                  width: '100%', marginTop: 8,
                  background: C.surf1, border: `1px solid ${C.line}`,
                  borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif',
                  fontSize: 14, padding: '12px 14px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </CIQuestion>
        );
      case 'spirit':
        return (
          <CIQuestion tag="SPIRIT · 9 / 9" title="SPIRITUAL READING" accent="OR STUDY?">
            <YesNo value={answers.spirit} onChange={(v) => auto({ spirit: v })} />
          </CIQuestion>
        );
      case 'spiritDetail':
        return (
          <CIQuestion tag="SPIRIT · DETAIL" title="WHAT GROUNDED" accent="YOU TODAY?">
            <FieldLabel>Minutes</FieldLabel>
            <div style={{ marginTop: 10 }}>
              <Stepper value={answers.spiritMinutes} onChange={(v) => set({ spiritMinutes: v })} min={5} max={240} step={5} unit="minutes" large />
            </div>
            <div style={{ marginTop: 16 }}>
              <FieldLabel>What did you read or study? (optional)</FieldLabel>
              <input
                value={answers.spiritNotes}
                onChange={(e) => set({ spiritNotes: e.target.value })}
                placeholder="Chapter, verse, book, idea…"
                style={{
                  width: '100%', marginTop: 8,
                  background: C.surf1, border: `1px solid ${C.line}`,
                  borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif',
                  fontSize: 14, padding: '12px 14px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </CIQuestion>
        );
      case 'weekPlan':
        return (
          <CIQuestion tag="SUNDAY REVIEW" title="WHICH DAYS DO YOU" accent="TRAIN THIS WEEK?" sub="Pick your sessions for the week ahead. These become Workout to-dos on Home.">
            <WeekDayPicker value={answers.workoutDays || []} onChange={(v) => set({ workoutDays: v })} />
          </CIQuestion>
        );
      default:
        return null;
    }
  };

  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        pointerEvents: open ? 'auto' : 'none',
        background: open ? 'rgba(0,0,0,.6)' : 'transparent',
        backdropFilter: open ? 'blur(6px)' : 'none',
        transition: 'background .25s ease',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '95%',
          background: C.bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .35s cubic-bezier(.2,.7,.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -20px 60px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
        </div>

        {/* Progress + close */}
        <div style={{ padding: '4px 22px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.accent }}>
              CHECK-IN · {step + 1} / {total}
            </span>
            <button
              onClick={handleClose}
              style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
          <StepBar current={step + 1} total={total} />
        </div>

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 0' }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 22px', flexShrink: 0, borderTop: `1px solid ${C.line}`, background: C.bg }}>
          <FooterNav
            onBack={step > 0 ? back : null}
            onNext={advance}
            nextDisabled={!canAdvance}
            nextLabel={step === total - 1 ? 'Complete check-in' : 'Continue'}
          />
        </div>
      </div>
    </div>
  );
}

// Question shell — tag, headline pair, body slot
function CIQuestion({ tag, title, accent, sub, children }) {
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.5, color: C.accent, marginBottom: 12 }}>
        {tag}
      </div>
      <h2
        style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 32, lineHeight: 0.98, letterSpacing: 0.5,
          color: C.text, margin: 0, textTransform: 'uppercase',
        }}
      >
        {title}
        {accent && (
          <>
            <br />
            <span style={{ color: C.accent }}>{accent}</span>
          </>
        )}
      </h2>
      {sub && (
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, lineHeight: 1.5, margin: '12px 0 18px', maxWidth: 320 }}>
          {sub}
        </p>
      )}
      <div style={{ marginTop: sub ? 8 : 22, paddingBottom: 20 }}>{children}</div>
    </div>
  );
}

function YesNo({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <BigChoice active={value === true} onClick={() => onChange(true)} label={yesLabel} accent />
      <BigChoice active={value === false} onClick={() => onChange(false)} label={noLabel} />
    </div>
  );
}

function BigChoice({ active, onClick, label, accent }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        height: 96,
        background: active ? (accent ? C.accentDim : C.surf3) : C.surf1,
        border: active ? `1px solid ${accent ? C.accent : C.lineStrong}` : `1px solid ${C.line}`,
        borderRadius: 14,
        color: active ? (accent ? C.accent : C.text) : C.text,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform .08s, background .15s',
      }}
    >
      {label}
    </button>
  );
}

function TierGuide({ tiers, value }) {
  if (!value) return null;
  const active = tiers.find((t) => t.stars === value);
  if (!active) return null;
  return (
    <div
      style={{
        marginTop: 18,
        padding: '14px 16px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.accent }}>
          {'★'.repeat(active.stars)}
        </span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1, color: C.text, textTransform: 'uppercase' }}>
          {active.label}
        </span>
      </div>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.45 }}>
        {active.body}
      </span>
    </div>
  );
}

// Default gratitude pool for the demo when library is empty
const DEFAULT_GRATITUDE = [
  { text: 'A healthy family' },
  { text: 'A good business' },
  { text: 'A good house' },
  { text: 'Good health and a strong body' },
  { text: 'The ability to slow down and relax' },
  { text: 'A good ute that never lets me down' },
];

// Celebration screen shown briefly after completion
function CheckinCelebration({ onClose, score }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(7,7,9,.94)',
        backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: 32, textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 100, height: 100, borderRadius: '50%',
          border: `2px solid ${C.accent}`, background: C.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(242,163,15,.4)',
        }}
      >
        <svg width="50" height="50" viewBox="0 0 50 50">
          <path d="M14 25 L22 33 L36 17" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 3, marginTop: 14 }}>
        DAY LOGGED
      </div>
      <h2
        style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 36,
          letterSpacing: 0.5, textTransform: 'uppercase', color: C.text,
          margin: 0, lineHeight: 0.98, textAlign: 'center',
        }}
      >
        SHOWED UP.<br />
        <span style={{ color: C.accent }}>+1 ON THE STREAK.</span>
      </h2>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, maxWidth: 280, margin: '6px 0 0' }}>
        See you tomorrow at the same time. Quiet ones stack.
      </p>
    </div>
  );
}

// Sunday week-plan day picker
function WeekDayPicker({ value, onChange }) {
  const days = [{ i: 1, l: 'MON' }, { i: 2, l: 'TUE' }, { i: 3, l: 'WED' }, { i: 4, l: 'THU' }, { i: 5, l: 'FRI' }, { i: 6, l: 'SAT' }, { i: 0, l: 'SUN' }];
  const toggle = (i) => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i]);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginTop: 8 }}>
        {days.map((d) => {
          const active = value.includes(d.i);
          return (
            <button
              key={d.i}
              onClick={() => toggle(d.i)}
              style={{
                aspectRatio: '1 / 1.3',
                background: active ? C.accent : C.surf1,
                color: active ? '#0A0A0C' : C.text,
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                borderRadius: 10,
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12,
                letterSpacing: 0.5, cursor: 'pointer', transition: 'all .12s',
              }}
            >
              {d.l}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 1.2, marginTop: 10, textAlign: 'center' }}>
        {value.length} {value.length === 1 ? 'SESSION' : 'SESSIONS'} THIS WEEK
      </div>
    </div>
  );
}

Object.assign(window, { CheckinModal, CheckinCelebration, DEFAULT_GRATITUDE });

export { BigChoice, CALM_TIERS, CIQuestion, CheckinCelebration, CheckinModal, DEFAULT_GRATITUDE, DIET_TIERS, MUSCLE_GROUPS, TierGuide, WeekDayPicker, YesNo };

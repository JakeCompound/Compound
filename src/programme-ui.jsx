import React from 'react';
import { C } from './compound-ui.jsx';
import {
  BIG_STEP_MIN, DANGER_TIMES, JOG_KM, JOG_STEPS_MIN, OVER_REASONS, RESET_DAYS, RESET_NOTIFS, SAVERS, STEP_TARGET,
  addDays, dayNumber, dowOf, endDateOf, inProgramme, missReasons, notifSetting, planFor,
  bigStepDay, jogDone, jogWeek, liftWeek, missStreak, nextLiftKey, programmeStreaks, programmeSummary, saversCount, weekNumber,
} from './programme-core.js';
import {
  activeProgramme, getProgrammeDay, loadProgrammes, patchProgrammeDay, programmeCtx,
  startReset, todayKey, updateProgramme, useProgramme,
} from './programme.js';

// programme-ui.jsx — the 3-Week Reset screens: Miracle Morning (SAVERS), the
// Home card (Day X of N, streaks, never-miss-twice), the nightly Reset step,
// the end-of-programme summary, and Settings → Programme.

const mono = { fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' };
const head = { fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 };
const body = { fontFamily: 'Outfit, sans-serif' };
const btnBase = { border: 0, borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function PrimaryBtn({ children, onClick, disabled, style }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ ...btnBase, width: '100%', height: 52, fontSize: 16, background: disabled ? C.accentDim : C.accent, color: disabled ? C.textLow : C.onAccent, cursor: disabled ? 'default' : 'pointer', ...style }}>
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ ...btnBase, width: '100%', height: 46, fontSize: 13, background: 'transparent', border: `1px solid ${C.lineStrong}`, color: C.textMid, ...style }}>
      {children}
    </button>
  );
}

// ── Miracle Morning (SAVERS) ───────────────────────────────────────────────
function MiracleMorningScreen({ date, onClose }) {
  const day = date || todayKey();
  const saved = getProgrammeDay(day);
  const [ticks, setTicks] = React.useState(() => (saved.savers && saved.savers.length === 6 ? saved.savers : [false, false, false, false, false, false]));
  const [num, setNum] = React.useState(saved.number != null ? String(saved.number) : '');
  const [line, setLine] = React.useState(saved.journal || '');
  const isJogDay = (() => { const p = activeProgramme(); return p ? planFor(p, day).jog : false; })();

  const persist = (patch) => patchProgrammeDay(day, patch);
  const toggle = (i) => {
    setTicks((cur) => {
      const next = cur.map((t, j) => (j === i ? !t : t));
      persist({ savers: next });
      return next;
    });
  };
  // Danger time: when tonight's number is most likely to break (one tap, optional).
  const [danger, setDanger] = React.useState(saved.danger || null);
  // How do you feel this morning? 1–5, one tap, optional.
  const [feel, setFeel] = React.useState(typeof saved.feel === 'number' ? saved.feel : null);
  // Aiming to work out today? Not binding - a yes just earns a nudge at 4:30pm.
  const [aim, setAim] = React.useState(typeof saved.aim === 'boolean' ? saved.aim : null);
  const liftInfo = (() => {
    const p = activeProgramme(); if (!p) return null;
    const ld = programmeCtx().liftDates;
    return { week: liftWeek(p, day, ld), next: nextLiftKey(p, day, ld) };
  })();
  // Weight: optional; saved into the normal weigh-in log so the weigh-in to-do
  // and the end-of-programme summary both see it.
  const loadW = () => { try { return JSON.parse(localStorage.getItem('compound:weighins') || '[]'); } catch (e) { return []; } };
  const [weight, setWeight] = React.useState(() => { const w = loadW().find((e) => e.date === day); return w ? String(w.value) : ''; });
  const numOk = num !== '' && Number.isFinite(Number(num)) && Number(num) >= 0;
  const done = () => {
    persist({ savers: ticks, number: Number(num), danger, feel, aim, journal: line.trim(), morningDoneAt: Date.now() });
    const w = Number(weight);
    if (weight !== '' && Number.isFinite(w) && w >= 30 && w <= 300) {
      const next = [...loadW().filter((e) => e.date !== day), { date: day, value: w }].sort((a, b) => (a.date < b.date ? -1 : 1));
      try { localStorage.setItem('compound:weighins', JSON.stringify(next)); window.dispatchEvent(new CustomEvent('compound:weighins-changed')); } catch (e) {}
    }
    onClose && onClose(true);
  };
  const count = ticks.filter(Boolean).length;
  const d = dowOf(day);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 158, background: C.bg, overflowY: 'auto', padding: '22px 22px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: 2.4, color: C.accent }}>{DOW[d]} · MIRACLE MORNING</div>
        <button onClick={() => onClose && onClose(false)} aria-label="Later" style={{ ...btnBase, background: 'transparent', color: C.textLow, fontSize: 12, padding: 6 }}>Later ✕</button>
      </div>
      <h1 style={{ ...head, fontSize: 38, lineHeight: 0.95, color: C.text, marginTop: 10 }}>
        SAVERS.<br /><span style={{ color: C.accent }}>{count}/6 DONE.</span>
      </h1>
      {d === 0 && <div style={{ ...body, fontSize: 13, color: C.textMid, marginTop: 8 }}>Lord's Day · ten minutes before you leave.</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <span style={{ ...body, flex: 1, fontSize: 14, color: C.textMid }}>How do you feel?</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setFeel(feel === n ? null : n)}
            style={{ ...btnBase, ...mono, width: 38, height: 36, fontSize: 15, letterSpacing: 0, background: feel === n ? C.accent : 'transparent', color: feel === n ? C.onAccent : C.textMid, border: `1px solid ${feel === n ? C.accent : C.lineStrong}` }}>
            {n}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...body, fontSize: 14, color: C.textMid, display: 'block' }}>Aiming to work out today?</span>
          {liftInfo && <span style={{ ...mono, fontSize: 9.5, color: C.textLow }}>{liftInfo.week.done}/{liftInfo.week.target} THIS WEEK · NEXT: DAY {liftInfo.next}</span>}
        </span>
        {[true, false].map((b) => (
          <button key={String(b)} onClick={() => setAim(aim === b ? null : b)}
            style={{ ...btnBase, width: 58, height: 36, fontSize: 12, background: aim === b ? C.accent : 'transparent', color: aim === b ? C.onAccent : C.textMid, border: `1px solid ${aim === b ? C.accent : C.lineStrong}` }}>
            {b ? 'Yes' : 'Not today'}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SAVERS.map((s, i) => {
          const on = ticks[i];
          const detail = s.t === 'Exercise' ? (isJogDay ? `Jog · aim ${JOG_KM} km, any distance counts` : '20 push-ups')
            : s.t === 'Reading' && d === 0 ? 'A verse, a hymn or the order of service' : s.d;
          return (
            <button key={i} onClick={() => toggle(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: on ? C.accentSoft : C.surf1, border: `1px solid ${on ? C.accent : C.lineStrong}` }}>
              <span style={{ ...head, fontSize: 22, width: 18, color: on ? C.accent : C.textLow }}>{s.k}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...head, fontSize: 16, fontWeight: 700, color: C.text, display: 'block' }}>{s.t}</span>
                <span style={{ ...body, fontSize: 12.5, color: C.textMid }}>{detail}</span>
              </span>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: on ? C.accent : 'transparent', border: `1.5px solid ${on ? C.accent : C.lineStrong}`, color: C.onAccent, fontSize: 15, fontWeight: 800 }}>{on ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: '14px', borderRadius: 12, background: C.surf1, border: `1px solid ${numOk ? C.lineStrong : C.accent}` }}>
        <label style={{ ...mono, fontSize: 10, letterSpacing: 2, color: C.accent }}>TONIGHT'S DRINK NUMBER · REQUIRED</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <button onClick={() => setNum((n) => String(Math.max(0, (Number(n) || 0) - 1)))} style={{ ...btnBase, width: 44, height: 44, background: C.surf2, color: C.text, fontSize: 20 }}>−</button>
          <input inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0"
            style={{ ...mono, flex: 1, minWidth: 0, height: 44, textAlign: 'center', fontSize: 24, color: C.text, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 10 }} />
          <button onClick={() => setNum((n) => String((Number(n) || 0) + 1))} style={{ ...btnBase, width: 44, height: 44, background: C.surf2, color: C.text, fontSize: 20 }}>＋</button>
        </div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: 2, color: C.textLow, marginTop: 14 }}>DANGER TIME TONIGHT?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {DANGER_TIMES.map((t) => (
            <button key={t} onClick={() => setDanger(danger === t ? null : t)}
              style={{ ...btnBase, height: 34, padding: '0 12px', fontSize: 12, letterSpacing: 0.8, background: danger === t ? C.accent : 'transparent', color: danger === t ? C.onAccent : C.textMid, border: `1px solid ${danger === t ? C.accent : C.lineStrong}` }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '0 14px', height: 46, borderRadius: 12, background: C.surf1, border: `1px solid ${C.lineStrong}` }}>
        <span style={{ ...body, flex: 1, fontSize: 14, color: C.textMid }}>Weight this morning <span style={{ color: C.textLow }}>· optional</span></span>
        <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="kg"
          style={{ ...mono, width: 76, height: 32, textAlign: 'center', fontSize: 15, color: C.text, background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 8 }} />
      </div>

      <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="One line for today (optional)" maxLength={160}
        style={{ ...body, width: '100%', boxSizing: 'border-box', marginTop: 12, height: 46, padding: '0 14px', fontSize: 14, color: C.text, background: C.surf1, border: `1px solid ${C.lineStrong}`, borderRadius: 12 }} />

      <PrimaryBtn onClick={done} disabled={!numOk} style={{ marginTop: 16 }}>
        {numOk ? `Done · ${count}/6` : 'Set tonight\'s number'}
      </PrimaryBtn>
    </div>
  );
}

// ── Home card ─────────────────────────────────────────────────────────────
function StreakPill({ label, s }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 8px', borderRadius: 10, background: C.surf2, textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 22, fontWeight: 600, color: s.current ? C.accent : C.textLow, lineHeight: 1 }}>{s.current}</div>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: 1.2, color: C.textMid, marginTop: 5 }}>{label}</div>
      <div style={{ ...mono, fontSize: 8, color: C.textLow, marginTop: 2 }}>BEST {s.best}</div>
    </div>
  );
}

function ResetHomeCard({ onOpenMorning, onOpenSummary }) {
  const p = useProgramme();
  const [askSteps, setAskSteps] = React.useState(false); // "Big step day" entry open?
  const [stepsIn, setStepsIn] = React.useState('');
  if (!p) return null;
  const today = todayKey();
  const end = endDateOf(p);
  const ctx = programmeCtx();
  if (!inProgramme(p, today)) {
    if (end && today > end) {
      return (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: C.surf1, border: `1px solid ${C.accent}` }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: 2, color: C.accent }}>{p.name.toUpperCase()} · COMPLETE</div>
          <PrimaryBtn onClick={onOpenSummary} style={{ marginTop: 12 }}>See summary</PrimaryBtn>
        </div>
      );
    }
    return null;
  }
  const n = dayNumber(p, today);
  const plan = planFor(p, today, ctx.liftDates);
  const dayData = ctx.days[today] || {};
  const streaks = programmeStreaks(p, ctx, today);
  const missN = missStreak(p, ctx, today);
  const must = missN > 0;
  const liftDone = ctx.liftDates.has(today);
  const steps = ctx.stepsOn(today);
  const jogOk = jogDone(p, ctx, today);
  const jw = jogWeek(p, today, ctx);
  const bigDay = !jogOk && bigStepDay(ctx, today);
  const jogTally = jw.walks ? `${jw.jogs} jog${jw.jogs === 1 ? '' : 's'} + ${jw.walks} step day${jw.walks === 1 ? '' : 's'}${jw.target ? ` of ${jw.target}` : ''}` : jw.target ? `${jw.done}/${jw.target} this week` : `${jw.done} this week`;
  const stepsNum = Number(stepsIn);
  const saveBigSteps = () => { if (stepsNum >= BIG_STEP_MIN) { patchProgrammeDay(today, { bigSteps: stepsNum }); setAskSteps(false); } };
  const isLast = end && today === end;

  const startLift = () => { try { window.dispatchEvent(new CustomEvent('compound:start-programme', { detail: { day: plan.lift } })); } catch (e) {} };
  const row = (label, sub, done, action) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.line}` }}>
      <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: done ? C.success : 'transparent', border: `1.5px solid ${done ? C.success : C.lineStrong}`, color: '#0b0b0b', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{done ? '✓' : ''}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...head, fontSize: 15, fontWeight: 700, color: C.text, display: 'block' }}>{label}</span>
        <span style={{ ...body, fontSize: 12, color: C.textMid }}>{sub}</span>
      </span>
      {action}
    </div>
  );
  const smallBtn = (txt, fn) => <button onClick={fn} style={{ ...btnBase, height: 34, padding: '0 14px', fontSize: 12, background: C.accent, color: C.onAccent }}>{txt}</button>;

  return (
    <div style={{ marginTop: 14, padding: '14px 14px 12px', borderRadius: 16, background: C.surf1, border: `1px solid ${must ? C.accent : C.lineStrong}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: 2, color: C.accent }}>{p.name.toUpperCase()}</div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: 1.4, color: C.textLow }}>WEEK {weekNumber(p, today)}</div>
      </div>
      <h2 style={{ ...head, fontSize: 30, lineHeight: 1, color: C.text, marginTop: 4 }}>
        DAY {n}<span style={{ color: C.textLow }}> OF {p.lengthDays || '∞'}</span>
      </h2>
      {must && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: C.accentSoft, border: `1px solid ${C.accent}`, ...mono, fontSize: 10.5, letterSpacing: 1.2, color: C.accent }}>
          {missN >= 2 ? 'FRESH START · JUST SAVERS AND A NUMBER TODAY' : "NEVER MISS TWICE · TODAY'S THE COMEBACK"}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <StreakPill label="MORNING 6/6" s={streaks.savers} />
        <StreakPill label="DRINKS ≤ NO." s={streaks.drinks} />
        <StreakPill label="SESSIONS" s={streaks.sessions} />
      </div>

      <div style={{ marginTop: 12 }}>
        {row('Miracle Morning', dayData.morningDoneAt ? `${saversCount(dayData)}/6 · tonight's number ${dayData.number}` : 'SAVERS + tonight\'s number', !!dayData.morningDoneAt && saversCount(dayData) === 6,
          !dayData.morningDoneAt || saversCount(dayData) < 6 ? smallBtn(dayData.morningDoneAt ? 'Edit' : 'Open', onOpenMorning) : null)}
        {plan.lift && row(liftDone ? `Day ${plan.lift} · ${RESET_DAYS[plan.lift].name} · done` : `Next: Day ${plan.lift} · ${RESET_DAYS[plan.lift].name}`,
          `${plan.week.done}/${plan.week.target} this week · ${liftDone ? 'nice work' : dayData.aim === true ? 'you said today · two lifts still counts' : 'any day you like'}`,
          liftDone, liftDone ? null : smallBtn('Start', startLift))}
        {row(jogOk ? 'Jog · done' : bigDay ? 'Big step day · covered' : `Jog · aim ${JOG_KM} km`,
          `${jogTally} · ${jogOk ? 'you got out the door' : bigDay ? 'a 500 m lap still earns the jog' : plan.jog ? '5:50am or this arvo · any distance counts' : 'any day · any distance counts'}`,
          jogOk || bigDay,
          jogOk
            ? <input inputMode="decimal" defaultValue={dayData.jogKm != null ? String(dayData.jogKm) : ''} placeholder="km"
                onBlur={(e) => { const n = Number(e.target.value); patchProgrammeDay(today, { jog: true, jogKm: e.target.value !== '' && Number.isFinite(n) && n > 0 ? n : null }); }}
                style={{ ...mono, width: 62, height: 34, textAlign: 'center', fontSize: 14, color: C.text, background: C.surf2, border: `1px solid ${C.lineStrong}`, borderRadius: 8 }} />
            : smallBtn('Log jog', () => patchProgrammeDay(today, { jog: true })))}
        {!jogOk && !bigDay && (askSteps ? (
          <div style={{ padding: '2px 0 10px 30px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input inputMode="numeric" autoFocus value={stepsIn} onChange={(e) => setStepsIn(e.target.value.replace(/[^0-9]/g, ''))} placeholder="today's steps"
                style={{ ...mono, flex: 1, minWidth: 0, height: 34, textAlign: 'center', fontSize: 14, color: C.text, background: C.surf2, border: `1px solid ${C.lineStrong}`, borderRadius: 8 }} />
              <button onClick={saveBigSteps} style={{ ...btnBase, height: 34, padding: '0 14px', fontSize: 12, background: stepsNum >= BIG_STEP_MIN ? C.accent : C.accentDim, color: stepsNum >= BIG_STEP_MIN ? C.onAccent : C.textLow }}>Save</button>
            </div>
            <div style={{ ...body, fontSize: 12, color: C.textMid, marginTop: 6 }}>
              {stepsIn !== '' && stepsNum < BIG_STEP_MIN ? `Needs ${BIG_STEP_MIN.toLocaleString()}+. A 500 m lap still earns the jog.` : `${BIG_STEP_MIN.toLocaleString()}+ steps covers a jog for the week.`}
            </div>
          </div>
        ) : (
          <button onClick={() => { setStepsIn(steps ? String(steps) : ''); setAskSteps(true); }}
            style={{ ...btnBase, background: 'transparent', color: C.textMid, fontSize: 11.5, letterSpacing: 1, padding: '0 0 10px 30px' }}>
            Or log a big step day ({BIG_STEP_MIN.toLocaleString()}+)
          </button>
        ))}
      </div>
      {isLast && <GhostBtn onClick={onOpenSummary} style={{ marginTop: 10 }}>Final day · see summary</GhostBtn>}
    </div>
  );
}

// ── Nightly check-in: the Reset step ───────────────────────────────────────
// Rendered as one extra step inside the existing check-in (after its own
// questions). Writes ONLY to programme_days — never to the coach-readable
// check-ins table.
function ResetCheckinStep({ date, nipsAnswer, stepsAnswer, value, onChange }) {
  const p = activeProgramme();
  const ctx = programmeCtx();
  const day = ctx.days[date] || {};
  const plan = p ? planFor(p, date, ctx.liftDates) : {};
  const d = dowOf(date);
  const v = value || {};
  const set = (k, x) => onChange({ ...v, [k]: x });
  const liftedToday = ctx.liftDates.has(date);
  const sessionLabel = liftedToday || day.aim === true ? 'Workout done today?' : null;
  const num = day.number;
  const act = typeof v.drinks === 'number' ? v.drinks : nipsAnswer;
  const cmp = typeof num === 'number' && typeof act === 'number' ? (act < num ? 'UNDER' : act === num ? 'MATCH' : 'OVER') : null;
  const steps = typeof v.steps === 'number' ? v.steps : stepsAnswer;
  // Any slip today? Drives the closing line only - never a red mark.
  const slipped = cmp === 'OVER' || saversCount(day) < 6 || ['protein', 'ruleKept', 'afterTea', 'noGames', 'screensOff'].some((k) => v[k] === false);

  const yn = (k, label, opt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${C.line}` }}>
      <span style={{ ...body, flex: 1, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{label}{opt && <span style={{ color: C.textLow }}> · optional</span>}</span>
      {[true, false].map((b) => (
        <button key={String(b)} onClick={() => set(k, v[k] === b ? null : b)}
          style={{ ...btnBase, width: 50, height: 34, fontSize: 12, background: v[k] === b ? (b ? C.success : C.danger) : 'transparent', color: v[k] === b ? '#0b0b0b' : C.textMid, border: `1px solid ${v[k] === b ? 'transparent' : C.lineStrong}` }}>
          {b ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
  const numIn = (k, val, placeholder) => (
    <input inputMode="numeric" value={val == null ? '' : String(val)} placeholder={placeholder}
      onChange={(e) => { const s = e.target.value.replace(/[^0-9.]/g, ''); set(k, s === '' ? null : Number(s)); }}
      style={{ ...mono, width: 92, height: 34, textAlign: 'center', fontSize: 15, color: C.text, background: C.surf2, border: `1px solid ${C.lineStrong}`, borderRadius: 8 }} />
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
        <span style={{ ...body, flex: 1, fontSize: 14, color: C.text }}>Miracle Morning</span>
        <span style={{ ...mono, fontSize: 15, color: saversCount(day) === 6 ? C.success : C.accent }}>{saversCount(day)}/6</span>
      </div>
      {sessionLabel && yn('workoutDone', sessionLabel)}
      {(plan.jog || v.jog != null) && yn('jog', 'Jog today? Any distance counts.')}
      {yn('protein', 'Protein 120 g across the day?')}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${C.line}` }}>
        <span style={{ ...body, flex: 1, fontSize: 14, color: C.text }}>Steps <span style={{ color: C.textLow }}>· target {STEP_TARGET.toLocaleString()}</span></span>
        {numIn('steps', steps, '0')}
      </div>
      {typeof steps === 'number' && steps >= BIG_STEP_MIN && <div style={{ ...mono, fontSize: 10.5, letterSpacing: 1.2, textAlign: 'right', color: C.success, paddingBottom: 8 }}>BIG STEP DAY · COUNTS TOWARD YOUR JOGS</div>}
      <div style={{ padding: '9px 0', borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...body, flex: 1, fontSize: 14, color: C.text }}>Drinks <span style={{ color: C.textLow }}>· this morning's number {typeof num === 'number' ? num : '—'}</span></span>
          {numIn('drinks', act, '0')}
        </div>
        {cmp && <div style={{ ...mono, fontSize: 10.5, letterSpacing: 1.4, marginTop: 6, textAlign: 'right', color: cmp === 'OVER' ? C.danger : C.success }}>{cmp}{typeof num === 'number' ? ` · COMMITTED TO ${num}` : ''}</div>}
        {cmp === 'OVER' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ ...body, fontSize: 13, color: C.textMid, lineHeight: 1.45 }}>Over tonight, and you logged it honestly. That's the part that makes the rest work. What made it hard?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {OVER_REASONS.map((t) => (
                <button key={t} onClick={() => set('overReason', v.overReason === t ? null : t)}
                  style={{ ...btnBase, height: 32, padding: '0 11px', fontSize: 12, letterSpacing: 0.8, background: v.overReason === t ? C.accent : 'transparent', color: v.overReason === t ? C.onAccent : C.textMid, border: `1px solid ${v.overReason === t ? C.accent : C.lineStrong}` }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {d >= 1 && d <= 4 && yn('ruleKept', 'Beer only (or spirits capped at 8 measured nips): kept?')}
      {yn('afterTea', 'First drink only after tea (6:00pm)?')}
      {yn('noGames', 'No PUBG or YouTube?')}
      {d !== 0 && yn('screensOff', 'Screens off by 9:45pm?')}
      {yn('familyWalk', 'Family walk?', true)}
      <div style={{ ...body, fontSize: 13, color: C.textMid, lineHeight: 1.5, padding: '12px 0 2px', borderTop: `1px solid ${C.line}` }}>
        {slipped
          ? "Not every box today, and that's fine. You showed up and told the truth. You're growing - tomorrow gets a fresh number."
          : 'Solid day. Stack another one tomorrow.'}
      </div>
    </div>
  );
}
// Prefill for the Reset step: an existing night entry, else auto-detected session.
function resetNightDefaults(date) {
  const p = activeProgramme();
  if (!p) return {};
  const ctx = programmeCtx();
  const day = ctx.days[date] || {};
  if (day.night) return { ...day.night };
  const plan = planFor(p, date, ctx.liftDates);
  const out = {};
  if (ctx.liftDates.has(date)) out.workoutDone = true;
  if (jogDone(p, ctx, date)) out.jog = true;
  return out;
}
function saveResetNight(date, night) {
  if (!night) return;
  patchProgrammeDay(date, { night: { ...night, savedAt: Date.now() } });
}
const resetActiveOn = (date) => { const p = activeProgramme(); return !!(p && inProgramme(p, date)); };

// ── End-of-programme summary ──────────────────────────────────────────────
function ProgrammeSummaryScreen({ programme, onClose }) {
  const p = programme || activeProgramme();
  if (!p) return null;
  const today = todayKey();
  const ctx = programmeCtx();
  let weighins = [];
  try { weighins = JSON.parse(localStorage.getItem('compound:weighins') || '[]'); } catch (e) {}
  const s = p.summary && p.status === 'finished' ? p.summary : programmeSummary(p, ctx, weighins, today);
  const isOpen = p.status === 'active';
  const stat = (label, val, sub) => (
    <div style={{ padding: '12px 0', borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ ...body, flex: 1, fontSize: 14, color: C.textMid }}>{label}</span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ ...mono, fontSize: 18, color: C.text }}>{val}</span>
        {sub && <span style={{ ...mono, display: 'block', fontSize: 9.5, color: C.textLow, marginTop: 2 }}>{sub}</span>}
      </span>
    </div>
  );
  const w = s.weight;
  const delta = w.first != null && w.last != null ? Math.round((w.last - w.first) * 10) / 10 : null;

  const extend = () => { updateProgramme(p.id, { lengthDays: (p.lengthDays || s.days) + 21 }); onClose && onClose(); };
  const forever = () => { updateProgramme(p.id, { lengthDays: null }); onClose && onClose(); };
  const finish = () => { updateProgramme(p.id, { status: 'finished', finishedAt: Date.now(), endDate: today, summary: s }); onClose && onClose(); };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 157, background: C.bg, overflowY: 'auto', padding: '22px 22px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: 2.4, color: C.accent }}>{p.name.toUpperCase()} · SUMMARY</div>
        <button onClick={onClose} style={{ ...btnBase, background: 'transparent', color: C.textLow, fontSize: 12 }}>Close ✕</button>
      </div>
      <h1 style={{ ...head, fontSize: 36, lineHeight: 0.95, color: C.text, marginTop: 10 }}>
        {s.days} {s.days === 1 ? 'DAY' : 'DAYS'}.<br /><span style={{ color: C.accent }}>HERE'S THE TALLY.</span>
      </h1>
      <div style={{ marginTop: 16 }}>
        {stat('Weight', w.last != null ? `${w.last} kg` : '—', w.first != null ? `day 1 ${w.first} kg${delta != null ? ` · ${delta > 0 ? '+' : ''}${delta} kg` : ''}` : 'no day-1 weigh-in')}
        {stat('Workouts', `${s.lifts.done}/${s.lifts.scheduled}`, 'completed / scheduled')}
        {stat('Jogs', `${s.jogs.done}/${s.jogs.scheduled}`, `completed / scheduled${s.jogs.stepDays ? ` · plus ${s.jogs.stepDays} big step day${s.jogs.stepDays === 1 ? '' : 's'}` : ''}${s.jogs.km ? ` · ${s.jogs.km} km logged` : ''}`)}
        {stat('Miracle Morning', `${s.miracleMorning}`, 'days with all six')}
        {s.nightsLogged != null && stat('Nights logged', `${s.nightsLogged}/${s.days}`, 'checked in, good day or not')}
        {stat('Drinks at/under number', `${s.drinks.nightsUnder}/${s.drinks.nightsNumbered}`, 'nights')}
        {stat('Avg drinks per night', s.drinks.byWeek.map((x) => (x.avg == null ? '—' : x.avg)).join(' · '), s.drinks.byWeek.map((x) => `wk ${x.week}`).join(' · '))}
        {stat('Longest streaks', `${s.longest.savers} · ${s.longest.drinks} · ${s.longest.sessions}`, 'morning · drinks · sessions')}
        {s.feel && s.feel.all != null && stat('Morning feel (1–5)', `${s.feel.afterUnder ?? '—'} vs ${s.feel.afterOver ?? '—'}`, `after nights at/under vs over${s.feel.mondays != null ? ` · Mondays ${s.feel.mondays}` : ''}`)}
        {s.overReasons && Object.keys(s.overReasons).length > 0 && stat('Nights over: why', Object.entries(s.overReasons).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '), 'your triggers')}
      </div>
      {isOpen && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryBtn onClick={extend}>Extend 3 more weeks</PrimaryBtn>
          <GhostBtn onClick={forever}>Keep going with no end date</GhostBtn>
          <GhostBtn onClick={finish}>Finish</GhostBtn>
        </div>
      )}
    </div>
  );
}

// ── Settings → Programme ──────────────────────────────────────────────────
function ProgrammeSettings({ onBack }) {
  const p = useProgramme();
  const [, bump] = React.useState(0);
  const [viewing, setViewing] = React.useState(null);
  const past = loadProgrammes().filter((x) => x.status === 'finished').sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  const setLen = (n) => { updateProgramme(p.id, { lengthDays: n }); bump((x) => x + 1); };
  const setNotif = (id, patch) => {
    const cur = (p.notifs || {})[id] || {};
    updateProgramme(p.id, { notifs: { ...(p.notifs || {}), [id]: { ...cur, ...patch } } });
    bump((x) => x + 1);
  };
  const label = { ...mono, fontSize: 10, letterSpacing: 2, color: C.textLow, margin: '22px 0 8px' };
  const card = { background: C.surf1, border: `1px solid ${C.lineStrong}`, borderRadius: 14, padding: '4px 14px' };

  if (viewing) return <ProgrammeSummaryScreen programme={viewing} onClose={() => setViewing(null)} />;

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, overflowY: 'auto', padding: '18px 22px 32px', zIndex: 2 }}>
      <button onClick={onBack} style={{ ...btnBase, background: 'transparent', color: C.textMid, fontSize: 13, padding: 0 }}>‹ Back</button>
      <h1 style={{ ...head, fontSize: 32, color: C.text, marginTop: 10 }}>PROGRAMME</h1>

      {!p && (
        <div style={{ marginTop: 14 }}>
          <p style={{ ...body, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>No programme running. The 3-Week Reset is 3 lifts a week (Push / Pull / Legs), Tue + Thu jogs, Miracle Morning and a nightly drinks number.</p>
          <PrimaryBtn onClick={() => { startReset(todayKey()); bump((x) => x + 1); }} style={{ marginTop: 10 }}>Start 3-Week Reset today</PrimaryBtn>
        </div>
      )}

      {p && (
        <>
          <div style={label}>{p.name.toUpperCase()} · STARTED {p.startDate}</div>
          <div style={{ ...card, padding: 14 }}>
            <div style={{ ...body, fontSize: 14, color: C.text }}>Length</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <button onClick={() => p.lengthDays && setLen(Math.max(dayNumber(p, todayKey()), p.lengthDays - 7))} style={{ ...btnBase, width: 44, height: 40, background: C.surf2, color: C.text, fontSize: 18 }}>−</button>
              <div style={{ ...mono, flex: 1, textAlign: 'center', fontSize: 20, color: C.text }}>{p.lengthDays ? `${p.lengthDays} days` : 'No end date'}</div>
              <button onClick={() => setLen((p.lengthDays || 21) + 7)} style={{ ...btnBase, width: 44, height: 40, background: C.surf2, color: C.text, fontSize: 18 }}>＋</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <GhostBtn onClick={() => setLen(p.lengthDays ? null : 21)} style={{ height: 38, fontSize: 12 }}>{p.lengthDays ? 'No end date' : 'Back to 21 days'}</GhostBtn>
            </div>
          </div>

          <div style={label}>NOTIFICATIONS</div>
          <div style={card}>
            {RESET_NOTIFS.map((n, i) => {
              const s = notifSetting(p, n);
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i ? `1px solid ${C.line}` : 0 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ ...body, fontSize: 14, color: s.on ? C.text : C.textLow, display: 'block' }}>{n.label}</span>
                    <span style={{ ...mono, fontSize: 9.5, color: C.textLow }}>{n.hint}</span>
                  </span>
                  <input type="time" value={s.time || ''} onChange={(e) => setNotif(n.id, { time: e.target.value })}
                    style={{ ...mono, height: 34, fontSize: 13, color: C.text, background: C.surf2, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '0 6px', colorScheme: 'dark' }} />
                  <button onClick={() => setNotif(n.id, { on: !s.on })} aria-label={s.on ? 'Turn off' : 'Turn on'}
                    style={{ width: 44, height: 26, borderRadius: 13, border: 0, cursor: 'pointer', position: 'relative', background: s.on ? C.accent : C.surf3 }}>
                    <span style={{ position: 'absolute', top: 3, left: s.on ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left .15s' }} />
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{ ...body, fontSize: 12, color: C.textLow, lineHeight: 1.5, marginTop: 8 }}>
            While the Reset runs, the usual check-in and workout reminders are muted so you don't get doubles. "Never miss twice" is added to the first reminder of the day after a missed day.
          </p>
          <GhostBtn onClick={() => setViewing(p)} style={{ marginTop: 10 }}>Summary so far</GhostBtn>
        </>
      )}

      <div style={label}>PAST PROGRAMMES</div>
      {past.length === 0 && <div style={{ ...body, fontSize: 13, color: C.textLow }}>None yet.</div>}
      {past.map((x) => (
        <button key={x.id} onClick={() => setViewing(x)} style={{ ...card, width: '100%', textAlign: 'left', cursor: 'pointer', padding: 14, marginBottom: 8, display: 'block' }}>
          <span style={{ ...head, fontSize: 17, color: C.text }}>{x.name}</span>
          <span style={{ ...mono, display: 'block', fontSize: 10, color: C.textLow, marginTop: 4 }}>{x.startDate} → {x.endDate || endDateOf(x) || '—'}</span>
        </button>
      ))}
    </div>
  );
}

export {
  MiracleMorningScreen, ProgrammeSettings, ProgrammeSummaryScreen, ResetCheckinStep, ResetHomeCard,
  resetActiveOn, resetNightDefaults, saveResetNight,
};

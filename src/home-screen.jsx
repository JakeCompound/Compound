import React from 'react';
import { C } from './compound-ui.jsx';
import { DayDot, SectionLabel, WeekStrip } from './home-components.jsx';
import { computeLifeScore, getTodayCopy } from './home-data.jsx';
import { BirthdayCard, ComebackCard, WeighInModal } from './home-extras.jsx';
import { ThreeRings } from './three-rings.jsx';
import { TodayTodos } from './todo-list.jsx';
import { isFirstWeekPostJoin } from './mid-week-join.js';

// home-screen.jsx — The Home tab — assembles all the components

function HomeScreen({ user, set, state, onOpenCheckin, onGoTo, onOpenSettings, onChanged, onRecalc, demoFlags, setDemoFlag }) {
  const lifeScore = computeLifeScore(state.metrics);
  const today = getTodayCopy(state.dayOfWeek);

  // Weigh-in (now a to-do) — local store + modal
  const todayKey = window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0, 10);
  const loadW = () => { try { return JSON.parse(localStorage.getItem('compound:weighins') || '[]'); } catch (e) { return []; } };
  const [weighEntries, setWeighEntries] = React.useState(loadW);
  const [weighOpen, setWeighOpen] = React.useState(false);
  const lastEntry = weighEntries.length ? weighEntries[weighEntries.length - 1] : null;
  const lastWeigh = lastEntry ? lastEntry.value : null;
  const weighDoneToday = !!(lastEntry && lastEntry.date === todayKey);
  const saveWeighToday = (value) => {
    const next = [...weighEntries.filter((e) => e.date !== todayKey), { date: todayKey, value }]
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    try { localStorage.setItem('compound:weighins', JSON.stringify(next)); } catch (e) {}
    setWeighEntries(next);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Up late';
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    if (h < 21) return 'Evening';
    return 'Night';
  })();

  return (
    <div
      style={{
        height: '100%',
        background: C.bg,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px 22px 32px',
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow }}>
            {today.dateLabel} · {today.day.toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1,
              letterSpacing: 0.5,
              color: C.text,
              margin: '6px 0 0',
              textTransform: 'uppercase',
            }}
          >
            {greeting},{' '}
            <span style={{ color: C.accent }}>{(user.name || 'friend').toUpperCase()}.</span>
          </h1>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: 2.5,
              color: C.accent, opacity: 0.78, marginTop: 8,
            }}
          >
            — CONSISTENCY OVER PERFECTION
          </div>
        </div>
        <button
          onClick={() => onOpenSettings && onOpenSettings()}
          style={{
            background: C.surf1, border: `1px solid ${C.line}`,
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.text, flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 1 V3 M8 13 V15 M1 8 H3 M13 8 H15 M3 3 L4.4 4.4 M11.6 11.6 L13 13 M3 13 L4.4 11.6 M11.6 4.4 L13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mid-week join: gentle welcome during the partial first week */}
      {isFirstWeekPostJoin() && <WelcomeBanner />}

      {/* Birthday takeover (above everything) */}
      {demoFlags?.birthday && (
        <div style={{ marginTop: 14 }}>
          <BirthdayCard name={user.name} onClose={() => setDemoFlag('birthday', false)} />
        </div>
      )}

      {/* Plateau nudge — recomp-aware: a flat scale is cross-checked against
          strength + waist before ever suggesting a cut. */}
      {user.dietTracking && (() => {
        const p = window.detectPlateau ? window.detectPlateau() : null;
        if (!p) return null;
        return <PlateauCard p={p} user={user} set={set} onGoTo={onGoTo} onChanged={onChanged} />;
      })()}

      {/* Three north-star rings hero */}
      <div style={{ marginTop: 14 }}>
        <ThreeRings
          state={state}
          onOpenCheckin={onOpenCheckin}
          onGoWorkout={() => onGoTo && onGoTo('workout')}
          onChanged={onChanged}
        />
      </div>

      {/* Real logged steps/sleep ribbon removed per request */}

      {/* Today's To-Do list (check-in + weigh-in with live countdowns) */}
      <div style={{ marginTop: 16 }}>
        {demoFlags?.comeback ? (
          <ComebackCard daysMissed={5} onStart={onOpenCheckin} />
        ) : (
          <div
            style={{
              background: C.surf1,
              border: `1px solid ${C.lineStrong}`,
              borderRadius: 16,
              padding: '14px 14px 16px',
            }}
          >
            <TodayTodos
              user={user}
              set={set}
              state={state}
              onOpenCheckin={onOpenCheckin}
              onWeighIn={() => setWeighOpen(true)}
              onGoWorkout={() => onGoTo && onGoTo('workout')}
              onGoNutrition={() => onGoTo && onGoTo('nutrition')}
              onChanged={onChanged}
              weighDoneToday={weighDoneToday}
            />
          </div>
        )}
      </div>

      {/* This week strip */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel meta="SUN – SAT">THIS WEEK</SectionLabel>
        <WeekStrip days={state.weekDays} />
        <WeekLegend />
      </div>

      {weighOpen && (
        <WeighInModal
          start={lastWeigh != null ? lastWeigh : (user.weight || 80)}
          goal={user.weightGoal}
          onSave={(v) => { saveWeighToday(v); setWeighOpen(false); }}
          onClose={() => setWeighOpen(false)}
        />
      )}
    </div>
  );
}

// Shown only during the partial week a user joins in. Sets expectations gently:
// no pressure to "catch up", full weekly tracking begins Sunday. Dismissible.
function WelcomeBanner() {
  const [hidden, setHidden] = React.useState(() => {
    try { return localStorage.getItem('compound:welcomeDismissed') === '1'; } catch (e) { return false; }
  });
  if (hidden) return null;
  const dismiss = () => { try { localStorage.setItem('compound:welcomeDismissed', '1'); } catch (e) {} setHidden(true); };
  return (
    <div
      style={{
        marginTop: 14, padding: '14px 16px', borderRadius: 14,
        background: C.accentSoft, border: `1px solid ${C.accentDim}`,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>👋</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.accent, marginBottom: 3 }}>WELCOME TO COMPOUND</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.4, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
          You're in — ease into it
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45, margin: '4px 0 0' }}>
          You joined mid-week, so there's nothing to catch up on. Log what you can, build the habit — <span style={{ color: C.accent }}>full weekly tracking kicks in Sunday.</span>
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', flexShrink: 0, padding: 2, lineHeight: 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

function WeekLegend() {
  const items = [
    { label: 'Check-in', kind: 'checkin' },
    { label: 'Workout', kind: 'workout' },
    { label: 'Spirit', kind: 'spirit' },
    { label: 'AFD', kind: 'afd' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        marginTop: 10,
        flexWrap: 'wrap',
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <DayDot kind={it.kind} on={true} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, color: C.textLow }}>
            {it.label.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

function QuickLink({ label, sub, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: accent ? C.accent : C.surf1,
        border: accent ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
        borderRadius: 12,
        padding: '14px 14px',
        cursor: 'pointer',
        color: accent ? '#0A0A0C' : C.text,
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'relative',
      }}
    >
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 1.2 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5, color: accent ? 'rgba(0,0,0,.55)' : C.textMid }}>
        {sub}
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: 'absolute', top: 14, right: 14 }}>
        <path d="M3 6 L9 6 M6 3 L9 6 L6 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Placeholder tabs ────────────────────────────────────────────────────
function PlaceholderTab({ title, sub, accent = '#F2A30F' }) {
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
        textAlign: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 76, height: 76, borderRadius: 18,
          border: `1px solid ${C.line}`, background: C.surf1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}
      >
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path d="M17 4 L19 12 L27 14 L19 16 L17 24 L15 16 L7 14 L15 12 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: accent, letterSpacing: 3 }}>
        COMING NEXT
      </div>
      <h2
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 32,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: C.text,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {title}
      </h2>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, maxWidth: 280, margin: 0 }}>
        {sub}
      </p>
    </div>
  );
}

// ── Plateau nudge ───────────────────────────────────────────────────────
const PLAT_BTN_PRIMARY = { background: C.accent, border: 0, color: '#0A0A0C', padding: '8px 14px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1.2, cursor: 'pointer' };
const PLAT_BTN_SECONDARY = { background: C.surf2, border: `1px solid ${C.accentDim}`, color: C.accent, padding: '8px 14px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1.2, cursor: 'pointer' };
const PLAT_BTN_GHOST = { background: 'transparent', border: `1px solid ${C.line}`, color: C.textMid, padding: '8px 12px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.2, cursor: 'pointer' };

function PlateauCard({ p, user, set, onGoTo, onChanged }) {
  const wrap = (children, accent) => (
    <div style={{ marginTop: 14, padding: '14px 16px', background: C.surf1, border: `1px solid ${accent || C.line}`, borderRadius: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {children}
    </div>
  );
  const done = () => { window.dismissPlateau && window.dismissPlateau(); onChanged && onChanged(); };
  const trim = () => { window.applyPlateauTrim && window.applyPlateauTrim(); onChanged && onChanged(); };
  const addSteps = () => { if (set) set({ stepGoal: (user.stepGoal || 7000) + 1500 }); window.dismissPlateau && window.dismissPlateau(); onChanged && onChanged(); };

  // Recomposition — flat scale but progressing. Don't cut; encourage.
  if (p.kind === 'recomp') {
    const reason = p.liftsUp && p.waistDown ? 'your lifts are up and your waist is down'
      : p.liftsUp ? 'your lifts are climbing'
      : 'your waist is coming down';
    return wrap(
      <>
        <span style={{ fontSize: 20 }}>💪</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.success, letterSpacing: 1.6, marginBottom: 3 }}>RECOMPOSITION</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
            Trading fat for muscle
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45, margin: '4px 0 10px' }}>
            Scale's flat {p.weeks} weeks, but {reason} — that's recomposition, not a stall. Don't cut. Hold the course.
          </p>
          <button onClick={done} style={PLAT_BTN_GHOST}>GOT IT</button>
        </div>
      </>,
      C.success + '55',
    );
  }

  // True stall — strength flat/declining and waist flat. Offer the smaller lever.
  return wrap(
    <>
      <span style={{ fontSize: 20 }}>📊</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.6, marginBottom: 3 }}>TRUE STALL</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
          Held {p.weeks} weeks — lifts &amp; waist flat too
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45, margin: '4px 0 10px' }}>
          A real stall. Pick the smaller lever — eat a touch less, or move a touch more. Your call, and only one nudge every few weeks.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={trim} style={PLAT_BTN_PRIMARY}>TRIM ~120 KCAL/DAY</button>
          <button onClick={addSteps} style={PLAT_BTN_SECONDARY}>+1,500 STEPS/DAY</button>
          <button onClick={done} style={PLAT_BTN_GHOST}>DISMISS</button>
        </div>
        {!p.waistKnown && (
          <>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11.5, color: C.textLow, lineHeight: 1.4, margin: '10px 0 6px' }}>
              No waist data yet — logging it lets us tell true fat loss from a stall next time.
            </p>
            <button onClick={() => onGoTo && onGoTo('reports')} style={{ ...PLAT_BTN_GHOST, borderColor: C.accentDim, color: C.accent }}>LOG A WAIST MEASUREMENT</button>
          </>
        )}
      </div>
    </>,
    C.accentDim,
  );
}

Object.assign(window, { HomeScreen, PlaceholderTab, QuickLink, WeekLegend, PlateauCard });

export { HomeScreen, PlaceholderTab, PlateauCard, QuickLink, WeekLegend };

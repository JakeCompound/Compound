// home-extras.jsx — Extras for Home tab: wearable import banner, streak freeze visible,
// comeback flow nudge, "repeat last workout" quick action.

// ── Wearable info banner ─────────────────────────────────────────────────
// Honest: real Samsung/Apple Health sync needs the native app. Until then,
// steps & sleep come from the nightly check-in. No fabricated imports.
function WearableSyncBanner({ onDismiss }) {
  return (
    <div
      style={{
        padding: '14px 14px',
        background: C.surf1,
        border: `1px dashed ${C.line}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative',
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 17 L4 11 C3 10 3 8 4 7 C5 6 7 6 8 7 L10 9 L12 7 C13 6 15 6 16 7 C17 8 17 10 16 11 Z" fill="currentColor" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.8, color: C.textLow, marginBottom: 2 }}>
          WEARABLE SYNC · COMING SOON
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 1.1 }}>
          Steps & sleep from your check-in
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11.5, color: C.textMid, marginTop: 2, lineHeight: 1.35 }}>
          Auto-sync with Samsung & Apple Health lands in the native app. For now you log them in tonight’s check-in.
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent', border: 0, color: C.textLow,
          padding: 6, cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M4 4 L10 10 M10 4 L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

// ── Real steps/sleep ribbon — shows what the user actually logged today ────
function LoggedTodayRibbon({ steps, sleep }) {
  if (steps == null && sleep == null) return null;
  return (
    <div
      style={{
        padding: '10px 14px',
        background: C.accentSoft,
        border: `1px solid ${C.accentDim}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="6.5" fill={C.accent} />
        <path d="M4 7 L6.2 9.2 L10 5.4" stroke="#0A0A0C" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.4, color: C.text }}>
        FROM TODAY’S CHECK-IN · {steps != null && (<span style={{ color: C.accent, fontWeight: 600 }}>{steps.toLocaleString()} STEPS</span>)}{steps != null && sleep != null ? ' · ' : ''}{sleep != null && (<span style={{ color: C.accent, fontWeight: 600 }}>{sleep}H SLEEP</span>)}
      </div>
    </div>
  );
}

// ── Streak freeze module — shown above streak cards
function StreakFreezeChip({ available, onUse }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: available > 0 ? C.accentDim : C.surf2,
          color: available > 0 ? C.accent : C.textLow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1 L8 15 M2 4 L14 12 M2 12 L14 4 M5 2 L11 2 M5 14 L11 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 2 }}>
          STREAK FREEZE
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.text, lineHeight: 1.35 }}>
          {available > 0
            ? `${available} available · Use it on a sick or travel day. No penalty.`
            : 'Next one resets in 14 days. Use sparingly — they refill monthly.'}
        </div>
      </div>
      {available > 0 && (
        <button
          onClick={onUse}
          style={{
            background: 'transparent', border: `1px solid ${C.accentDim}`,
            color: C.accent, padding: '6px 10px', borderRadius: 6,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
            letterSpacing: 1.4, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          USE
        </button>
      )}
    </div>
  );
}

// ── Comeback ribbon — replaces the check-in card after 3+ missed days
function ComebackCard({ daysMissed, onStart }) {
  return (
    <button
      onClick={onStart}
      style={{
        width: '100%', textAlign: 'left',
        padding: '20px 20px',
        background: 'linear-gradient(135deg, #1A1612 0%, #100E0B 100%)',
        border: `1px solid ${C.accent}`,
        borderRadius: 16, cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -30, top: -30, width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(242,163,15,.22), transparent 65%)',
        }}
      />
      <div
        style={{
          width: 48, height: 48, borderRadius: 12,
          background: C.accent, color: '#0A0A0C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 3 V11 L17 17 M11 21 A10 10 0 1 1 11 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 4 }}>
          WELCOME BACK
        </div>
        <div
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22,
            letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.05,
          }}
        >
          NO STREAK PENALTY.<br />JUST DO TONIGHT.
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginTop: 6, lineHeight: 1.4 }}>
          {daysMissed} days off. We saved your data. Pick up where you left off — no guilt loop, no catch-up game.
        </div>
      </div>
    </button>
  );
}

// ── Birthday takeover card ──────────────────────────────────────────────
function BirthdayCard({ name, onClose }) {
  // Confetti dots — pure CSS
  return (
    <div
      style={{
        padding: '22px 18px',
        background: 'linear-gradient(135deg, #2A1F0E 0%, #100E0B 100%)',
        border: `1px solid ${C.accent}`,
        borderRadius: 16, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Confetti dots */}
      {[...Array(18)].map((_, i) => {
        const left = (i * 31) % 100;
        const top = (i * 17) % 100;
        const size = 3 + (i % 3);
        const color = ['#F2A30F', '#7CA8E0', '#5AC57E', '#E5564B'][i % 4];
        return (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              left: `${left}%`, top: `${top}%`,
              width: size, height: size, borderRadius: 1,
              background: color,
              opacity: 0.6,
              transform: `rotate(${i * 23}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎂</span> ANOTHER ORBIT
        </div>
        <h2
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 32,
            letterSpacing: 0.5, color: C.text, margin: '0 0 12px', textTransform: 'uppercase', lineHeight: 0.98,
          }}
        >
          HAPPY BIRTHDAY,<br /><span style={{ color: C.accent }}>{(name || 'FRIEND').toUpperCase()}.</span>
        </h2>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, margin: '0 0 16px' }}>
          One streak freeze gifted, on the house. No expectation today — just glad you're here for another lap.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: C.accent, border: 0, color: '#0A0A0C',
              padding: '12px 0', borderRadius: 10,
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Thanks — let's go
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  WearableSyncBanner, LoggedTodayRibbon, StreakFreezeChip, ComebackCard, BirthdayCard, WeighInBlock, WeighInModal,
});

// ── Friday weigh-in entry ──────────────────────────────────────────────────
function WeighInBlock({ user }) {
  const KEY = 'compound:weighins';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const [entries, setEntries] = React.useState(load);
  const [open, setOpen] = React.useState(false);
  const last = entries.length ? entries[entries.length - 1] : null;
  const isFriday = new Date().getDay() === 5;
  const todayKey = window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0, 10);
  const doneToday = last && last.date === todayKey;

  const save = (value) => {
    const next = [...entries.filter((e) => e.date !== todayKey), { date: todayKey, value }]
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    setEntries(next);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '14px 16px',
          background: doneToday ? C.surf1 : (isFriday ? C.surf2 : C.surf1),
          border: `1px solid ${doneToday ? C.line : (isFriday ? C.accentDim : C.line)}`,
          borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: C.surf3, color: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 6 V5 A3 3 0 0 1 13 5 V6" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.8, color: isFriday && !doneToday ? C.accent : C.textLow, marginBottom: 2 }}>
            {doneToday ? 'LOGGED TODAY' : isFriday ? 'FRIDAY WEIGH-IN' : 'WEIGH-IN'}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {last ? `${last.value}kg · last reading` : 'Log your first weigh-in'}
          </div>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 1.4 }}>
          {doneToday ? 'EDIT' : 'LOG'}
        </span>
      </button>
      {open && <WeighInModal start={last ? last.value : (user.weight || 80)} goal={user.weightGoal} onSave={save} onClose={() => setOpen(false)} />}
    </>
  );
}

function WeighInModal({ start, goal, onSave, onClose }) {
  const [val, setVal] = React.useState(start);
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
          FRIDAY WEIGH-IN
        </div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase' }}>
          ON THE SCALES.<br /><span style={{ color: C.accent }}>POST-BATHROOM, PRE-WATER.</span>
        </h3>
        <div style={{ margin: '20px 0' }}>
          <Stepper value={val} onChange={setVal} min={30} max={250} step={0.1} unit="kg" large />
        </div>
        {goal != null && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 1.2, marginBottom: 16, textAlign: 'center' }}>
            GOAL {goal}KG · {(val - goal) > 0 ? '+' : ''}{(val - goal).toFixed(1)}KG TO GO
          </div>
        )}
        <button
          onClick={() => onSave(+(+val).toFixed(1))}
          style={{
            width: '100%', height: 52, background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.6,
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Save weigh-in
        </button>
      </div>
    </div>
  );
}

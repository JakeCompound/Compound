// nutrition-screen.jsx — AI chat for nutrition advice
// Uses window.claude.complete with user context from onboarding + check-in data.

const SUGGESTED_PROMPTS = [
  { tag: 'PRE-WORKOUT',  text: 'What should I eat 60 min before training?' },
  { tag: 'PROTEIN',      text: 'Easy high-protein dinner under 30 min?' },
  { tag: 'ALCOHOL',      text: 'How does alcohol affect my recovery and lifts?' },
  { tag: 'FAT LOSS',     text: "I'm at 82kg, target 78. How aggressive should my deficit be?" },
  { tag: 'POST-WORKOUT', text: 'Best post-workout meal if I trained at night?' },
  { tag: 'BREAKFAST',    text: 'High-protein breakfast ideas to hit my macros?' },
];

function NutritionChat({ user }) {
  const [messages, setMessages] = React.useState(() => {
    try {
      const raw = localStorage.getItem('compound:nutrition');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Persist
  React.useEffect(() => {
    try { localStorage.setItem('compound:nutrition', JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const send = async (text) => {
    const t = (text || '').trim();
    if (!t || pending) return;
    setInput('');
    const userMsg = { role: 'user', content: t, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    // Compose system context
    const ctx = buildContext(user);
    const prompt = `${ctx}\n\nUser question: ${t}\n\nGive a concise, direct, coach-like answer (Australian English, no fluff). Use short paragraphs and a bulleted list if needed. Reference their data when relevant but don't restate it.`;

    try {
      const reply = await window.claude.complete(prompt);
      const aiMsg = { role: 'assistant', content: reply, ts: Date.now() };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: "Couldn't reach the model — try again in a moment.",
        ts: Date.now(),
        error: true,
      }]);
    } finally {
      setPending(false);
    }
  };

  const clear = () => {
    setMessages([]);
    try { localStorage.removeItem('compound:nutrition'); } catch (e) {}
  };

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {messages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 18px 0' }}>
          <button
            onClick={clear}
            style={{
              background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 8,
              color: C.textMid, padding: '5px 10px', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5,
            }}
          >
            CLEAR
          </button>
        </div>
      )}

      {/* Scrollable conversation */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
        {messages.length === 0 ? (
          <EmptyNutrition user={user} onPick={(p) => send(p)} />
        ) : (
          <>
            <ContextChip user={user} />
            {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
            {pending && <ThinkingBubble />}
          </>
        )}
      </div>

      {/* Composer */}
      <Composer value={input} onChange={setInput} onSend={() => send(input)} pending={pending} />
    </div>
  );
}

function buildContext(user) {
  const dob = user.dob || '';
  const age = (() => {
    if (!dob) return null;
    const [y, m, d] = dob.split('-').map(Number);
    const today = new Date();
    let a = today.getFullYear() - y;
    if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) a--;
    return a;
  })();

  return `You are Compound — a direct, no-fluff fitness and nutrition coach inside a life-tracking app. Speak in plain Australian English.

The user's profile:
- Name: ${user.name || '—'}
- Age: ${age ?? '—'}
- Current weight: ${user.weight} kg
- Goal weight: ${user.weightGoal} kg (${(user.weightGoal - user.weight).toFixed(1)} kg ${user.weightGoal < user.weight ? 'cut' : user.weightGoal > user.weight ? 'gain' : 'maintain'})
- Training: ${user.trainingDays} days/week at ${user.equipment === 'home' ? 'home (bodyweight)' : 'gym (Reeplex PRO90 + DBs to 35kg)'}
- Fitness level: ${user.fitnessLevel || '—'}
- Step goal: ${user.stepGoal}/day
- Sleep goal: ${user.sleepGoal}h

${buildCheckinContext()}`;
}

// Real recent check-in summary (last 7 days) — no fabricated data.
function buildCheckinContext() {
  let history = [];
  try { history = window.loadCheckins ? window.loadCheckins() : []; } catch (e) {}
  const cutoff = Date.now() - 7 * 86400000;
  const recent = history.filter((h) => new Date(h.date + 'T12:00:00').getTime() >= cutoff);
  if (recent.length === 0) {
    return 'Check-in data: none logged yet — this is a new account. Do not invent past data; encourage them to start logging.';
  }
  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const diet = recent.map((h) => h.answers.dietRating).filter((v) => v > 0);
  const calm = recent.map((h) => h.answers.calmRating).filter((v) => v > 0);
  const sleep = recent.map((h) => h.answers.sleep).filter((v) => typeof v === 'number');
  const workouts = recent.filter((h) => h.answers.workoutToday).length;
  const afds = recent.filter((h) => h.answers.afd).length;
  return `This week's REAL check-in data (last ${recent.length} day${recent.length > 1 ? 's' : ''} logged):
- Diet quality avg: ${diet.length ? avg(diet).toFixed(1) : '—'}/5
- Sleep avg: ${sleep.length ? avg(sleep).toFixed(1) : '—'}h
- Calm avg: ${calm.length ? avg(calm).toFixed(1) : '—'}/5
- Workouts logged: ${workouts}
- Alcohol-free days: ${afds}/${recent.length}
Reference this when relevant. Do not invent numbers beyond these.`;
}

function ContextChip({ user }) {
  const delta = (user.weightGoal - user.weight).toFixed(1);
  const dir = delta < 0 ? 'CUT' : delta > 0 ? 'GAIN' : 'HOLD';
  return (
    <div
      style={{
        padding: '10px 14px',
        background: C.surf1,
        border: `1px dashed ${C.line}`,
        borderRadius: 10,
        marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: C.accent, flexShrink: 0 }}>
        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      </svg>
      <div style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: C.textMid, letterSpacing: 1.3, lineHeight: 1.45 }}>
        CTX · {dir} {Math.abs(delta)}KG · {user.trainingDays}×/WK · {user.equipment?.toUpperCase() || 'GYM'}
      </div>
    </div>
  );
}

function EmptyNutrition({ user, onPick }) {
  return (
    <div>
      <ContextChip user={user} />
      <div
        style={{
          padding: '18px 16px',
          background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
          border: `1px solid ${C.line}`,
          borderRadius: 14, marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>
          NUTRITION COACH · ON
        </div>
        <div
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22,
            letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 8,
          }}
        >
          ASK ANYTHING.<br />MEALS, MACROS, RECOVERY.
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: 0 }}>
          I know your goals, training cadence, and what your check-ins say. No food logging — just direct answers.
        </p>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow, marginBottom: 10 }}>
        SUGGESTED
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p.text}
            onClick={() => onPick(p.text)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '12px 14px',
              background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.5,
                color: C.accent, background: C.accentSoft,
                padding: '3px 6px', borderRadius: 4, flexShrink: 0,
              }}
            >
              {p.tag}
            </span>
            <span style={{ flex: 1, fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.text, lineHeight: 1.4 }}>
              {p.text}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: C.textLow, flexShrink: 0 }}>
              <path d="M3 2 L7 5 L3 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ m }) {
  const isUser = m.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 14px',
          background: isUser ? C.accent : (m.error ? 'rgba(229,86,75,.1)' : C.surf1),
          border: m.error ? `1px solid rgba(229,86,75,.3)` : (isUser ? 0 : `1px solid ${C.line}`),
          borderRadius: 14,
          borderBottomRightRadius: isUser ? 4 : 14,
          borderBottomLeftRadius: isUser ? 14 : 4,
          color: isUser ? '#0A0A0C' : C.text,
          fontFamily: 'Outfit, sans-serif',
          fontSize: 14,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {!isUser && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2, color: C.accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 1 L5.4 3.6 L8 4.5 L5.4 5.4 L4.5 8 L3.6 5.4 L1 4.5 L3.6 3.6 Z" fill={C.accent} /></svg>
            COMPOUND
          </div>
        )}
        {m.content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  const [dots, setDots] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 350);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <div
        style={{
          padding: '12px 14px',
          background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, borderBottomLeftRadius: 4,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6, height: 6, borderRadius: 3,
              background: i <= dots ? C.accent : C.surf3,
              transition: 'background .15s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Composer({ value, onChange, onSend, pending }) {
  return (
    <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.line}`, background: C.bg }}>
      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 22,
          padding: '6px 6px 6px 16px',
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          placeholder="Ask about meals, macros, recovery…"
          style={{
            flex: 1,
            background: 'transparent', border: 0, resize: 'none',
            color: C.text,
            fontFamily: 'Outfit, sans-serif', fontSize: 14, lineHeight: 1.4,
            outline: 0, padding: '10px 0',
            maxHeight: 100,
          }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || pending}
          style={{
            width: 38, height: 38, borderRadius: 19,
            background: !value.trim() || pending ? C.surf3 : C.accent,
            border: 0,
            color: !value.trim() || pending ? C.textLow : '#0A0A0C',
            cursor: !value.trim() || pending ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 13 L13 8 L3 3 L4.5 8 Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { NutritionScreen: NutritionChat, NutritionChat });

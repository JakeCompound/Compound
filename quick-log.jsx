// quick-log.jsx — Text-to-set quick logger powered by Claude
// User can paste freeform text like "75 by 8, felt easy" and it parses into a Set.
// Available as a mic-style button on the live workout screen.

function QuickLogButton({ exercise, onLog }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Quick log a set"
        style={{
          background: 'transparent',
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          color: C.accent,
          padding: '6px 10px',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="4.5" y="1" width="4" height="7" rx="2" fill="currentColor" />
          <path d="M2.5 6 V7 C2.5 9 4.2 10.5 6.5 10.5 C8.8 10.5 10.5 9 10.5 7 V6 M6.5 10.5 V12.5 M4.5 12.5 H8.5"
                stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
        QUICK
      </button>
      {open && (
        <QuickLogModal
          exercise={exercise}
          onLog={(parsed) => { onLog(parsed); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function QuickLogModal({ exercise, onLog, onClose }) {
  const [text, setText] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [parsed, setParsed] = React.useState(null);
  const [error, setError] = React.useState(null);
  const taRef = React.useRef(null);

  React.useEffect(() => {
    setTimeout(() => taRef.current && taRef.current.focus(), 80);
  }, []);

  const examples = [
    '75 by 8 felt easy',
    'did three reps left at 80 for 6',
    '20kg x 12, two in tank',
  ];

  const parse = async () => {
    if (!text.trim() || pending) return;
    setPending(true);
    setError(null);
    setParsed(null);

    const prompt = `You are a workout logger. Parse this freeform set log into JSON.

Exercise: ${exercise.name}
Exercise type: ${exercise.isHold ? 'timed hold (seconds)' : exercise.type === 'weighted' ? 'weighted (kg + reps)' : 'bodyweight reps'}

User text: "${text.trim()}"

Extract:
- weight (number in kg, null if bodyweight/hold)
- reps (integer, null if hold)
- holdSeconds (integer, only if exercise is timed hold)
- rir (integer 0-5, "reps in reserve" / "in the tank" / "could have done X more". Map "to failure"=0, "easy"=4, "very easy"=5)

Respond ONLY with valid JSON, no other text. Use null for unknown values. Example: {"weight": 75, "reps": 8, "holdSeconds": null, "rir": 4}`;

    try {
      const raw = await window.claude.complete(prompt);
      // Extract JSON from response — tolerate code fences
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no_json');
      const obj = JSON.parse(m[0]);
      setParsed(obj);
    } catch (e) {
      setError("Couldn't parse that. Try wording like '75 by 8' or '20kg x 12, 2 in tank'.");
    } finally {
      setPending(false);
    }
  };

  const commit = () => {
    if (!parsed) return;
    onLog({
      weight: parsed.weight,
      reps: parsed.reps,
      holdSeconds: parsed.holdSeconds,
      rir: parsed.rir,
    });
  };

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
        style={{
          width: '100%',
          background: C.bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 22px 22px',
          boxShadow: '0 -20px 60px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>
          QUICK LOG · {exercise.name.toUpperCase()}
        </div>
        <h3
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26,
            lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase',
          }}
        >
          TYPE OR SPEAK<br /><span style={{ color: C.accent }}>YOUR SET.</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '10px 0 14px' }}>
          Drop in whatever feels natural — we'll figure out the numbers.
        </p>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(null); setError(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) parse();
          }}
          rows={2}
          placeholder="e.g. 75 by 8, two in the tank"
          style={{
            width: '100%',
            background: C.surf1, border: `1px solid ${C.line}`,
            borderRadius: 12, padding: '12px 14px',
            color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 16, lineHeight: 1.4,
            outline: 0, resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        {/* Examples row */}
        {!parsed && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                style={{
                  background: 'transparent', border: `1px dashed ${C.line}`,
                  color: C.textMid, padding: '6px 10px', borderRadius: 999,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  cursor: 'pointer', letterSpacing: 0.5,
                }}
              >
                "{ex}"
              </button>
            ))}
          </div>
        )}

        {/* Parsed preview */}
        {parsed && (
          <div
            style={{
              marginTop: 12,
              padding: '14px 16px',
              background: C.accentSoft,
              border: `1px solid ${C.accentDim}`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.8, color: C.accent, marginBottom: 8 }}>
              PARSED → READY TO LOG
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {parsed.weight != null && <ParsedChip label="WEIGHT" value={`${parsed.weight}kg`} />}
              {parsed.reps != null && <ParsedChip label="REPS" value={parsed.reps} />}
              {parsed.holdSeconds != null && <ParsedChip label="HOLD" value={`${parsed.holdSeconds}s`} />}
              {parsed.rir != null && <ParsedChip label="RIR" value={parsed.rir} />}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(229,86,75,.1)', border: `1px solid rgba(229,86,75,.3)`,
              borderRadius: 10, fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.text, lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 48,
              background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 12,
              color: C.text, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 600,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {!parsed ? (
            <button
              onClick={parse}
              disabled={!text.trim() || pending}
              style={{
                flex: 2, height: 48,
                background: !text.trim() || pending ? C.surf3 : C.accent,
                border: 0, borderRadius: 12,
                color: !text.trim() || pending ? C.textLow : '#0A0A0C',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700,
                letterSpacing: 1.4, textTransform: 'uppercase',
                cursor: !text.trim() || pending ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {pending ? <PulseDots /> : 'Parse'}
            </button>
          ) : (
            <button
              onClick={commit}
              style={{
                flex: 2, height: 48,
                background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700,
                letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Log this set →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ParsedChip({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.5 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, color: C.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

function PulseDots() {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setN((x) => (x + 1) % 4), 280);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 3,
            background: i <= n ? '#0A0A0C' : 'rgba(0,0,0,.3)',
            transition: 'background .15s',
          }}
        />
      ))}
    </span>
  );
}

Object.assign(window, { QuickLogButton, QuickLogModal });

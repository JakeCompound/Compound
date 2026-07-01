import React from 'react';
import { C } from './compound-ui.jsx';

// add-button.jsx — Floating "+" on Home → Alcohol (nip) + Food (when diet tracking on).

function AddButton({ dietTracking, alcohol = true, onChanged, onGoNutrition }) {
  const [menu, setMenu] = React.useState(false);
  const [sheet, setSheet] = React.useState(null); // 'nip' | 'food'
  return (
    <>
      <button
        onClick={() => setMenu(true)}
        aria-label="Add"
        style={{
          position: 'absolute', right: 18, bottom: 18, zIndex: 60,
          width: 58, height: 58, borderRadius: 29,
          background: C.accent, border: 0, color: '#0A0A0C',
          boxShadow: '0 10px 30px rgba(242,163,15,.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 5 V21 M5 13 H21" stroke="#0A0A0C" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </button>

      {menu && (
        <div onClick={() => setMenu(false)} style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>ADD TO TODAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alcohol && <AddRow label="Alcohol" sub="Log a nip / beer / wine" glyph="🍺" onClick={() => { setMenu(false); setSheet('nip'); }} />}
              {dietTracking && <AddRow label="Food" sub="Photo or describe — AI does the macros" glyph="🍽️" onClick={() => { setMenu(false); setSheet('food'); }} />}
            </div>
          </div>
        </div>
      )}

      {sheet === 'nip' && <NipQuickAdd onClose={() => setSheet(null)} onChanged={onChanged} />}
      {sheet === 'food' && <FoodAdd onClose={() => setSheet(null)} onChanged={onChanged} onGoNutrition={onGoNutrition} />}
    </>
  );
}

function AddRow({ label, sub, glyph, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '14px 14px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 24 }}>{glyph}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginTop: 1 }}>{sub}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: C.textLow }}><path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

// ── Nip quick-add ──────────────────────────────────────────────────────────
function NipQuickAdd({ onClose, onChanged }) {
  const [n, setN] = React.useState(() => window.loadNipsToday());
  const [kcal, setKcal] = React.useState(() => window.loadAlcoholKcal());
  const [desc, setDesc] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [note, setNote] = React.useState(null);
  // bump nips by delta; add matching calories (default ~65 kcal per nip)
  const bump = (deltaNips, deltaKcal) => {
    const v = window.setNipsToday(Math.max(0, +(n + deltaNips).toFixed(2))); setN(v);
    const kc = (deltaKcal != null) ? deltaKcal : Math.round(deltaNips * 65);
    const nk = window.setAlcoholKcal(Math.max(0, kcal + kc)); setKcal(nk);
    onChanged && onChanged();
  };
  const estimate = async () => {
    if (!desc.trim() || pending) return;
    setPending(true); setNote(null);
    try {
      const raw = await window.claude.complete(`Estimate this drink. 1 nip = 30ml spirit. Beer ≈ 1.5 nips, glass of wine ≈ 2, cocktail (e.g. Long Island Iced Tea) ≈ 3-4, cider ≈ 1.5. Also estimate total calories (ethanol = 7 kcal/g, 0.789 g/ml; plus mixers/sugar). Drink: "${desc.trim()}". Respond ONLY JSON: {"nips": <number>, "kcal": <integer>, "name":"short name"}`);
      const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
      const obj = m ? JSON.parse(m[0]) : { nips: 0, kcal: 0 };
      const addN = Math.max(0, +obj.nips || 0);
      const addK = Math.max(0, Math.round(+obj.kcal || addN * 65));
      if (addN > 0 || addK > 0) {
        const v = window.setNipsToday(+(n + addN).toFixed(2)); setN(v);
        const nk = window.setAlcoholKcal(kcal + addK); setKcal(nk);
        onChanged && onChanged();
        setNote(`Added ${addN} nip${addN !== 1 ? 's' : ''} · ${addK} kcal · ${obj.name || desc.trim()}`);
      } else setNote("Couldn't read that as alcohol — add nips manually above.");
      setDesc('');
    } catch (e) { setNote('Estimate failed — try again or use the buttons.'); }
    finally { setPending(false); }
  };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>TODAY'S DRINKS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 16px' }}>
          <button onClick={() => bump(-1)} style={stepBtn}>−</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 56, color: C.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{(+n).toFixed(n % 1 ? 1 : 0)}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 2, marginTop: 4 }}>NIPS · {kcal} KCAL</div>
          </div>
          <button onClick={() => bump(1)} style={stepBtn}>+</button>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>QUICK ADD A REAL POUR</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PourChip label="+ Nip" sub="1" onClick={() => bump(1, 65)} />
          <PourChip label="+ Beer" sub="1.5" onClick={() => bump(1.5, 150)} />
          <PourChip label="+ Wine" sub="2" onClick={() => bump(2, 125)} />
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, lineHeight: 1.5, margin: '16px 0 0' }}>
          Logged live — tonight's check-in starts pre-filled with this number, and you can still adjust it there.
        </p>

        {/* Custom drink — AI estimates the nips */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>OR DESCRIBE A DRINK</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') estimate(); }} placeholder="e.g. Long Island iced tea, cider, espresso martini" style={{ flex: 1, background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 14, padding: '12px 14px', outline: 'none' }} />
            <button onClick={estimate} disabled={pending || !desc.trim()} style={{ width: 52, background: (pending || !desc.trim()) ? C.surf2 : C.accent, color: (pending || !desc.trim()) ? C.textLow : '#0A0A0C', border: 0, borderRadius: 10, fontSize: 18, cursor: (pending || !desc.trim()) ? 'default' : 'pointer' }}>{pending ? '…' : '→'}</button>
          </div>
          {note && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.accent, marginTop: 8, lineHeight: 1.4 }}>{note}</div>}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 50, marginTop: 16, background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}
const stepBtn = { width: 64, height: 64, borderRadius: 16, border: `1px solid ${C.line}`, background: C.surf2, color: C.text, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, cursor: 'pointer' };
function PourChip({ label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '12px 0', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer', color: C.text }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1 }}>{sub} NIP{sub > 1 ? 'S' : ''}</div>
    </button>
  );
}

// ── Food add (photo + text → AI estimate) ───────────────────────────────────
function FoodAdd({ onClose, onChanged, onGoNutrition }) {
  const [desc, setDesc] = React.useState('');
  const [photo, setPhoto] = React.useState(null); // dataURL
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const fileRef = React.useRef();

  const pickPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (!desc.trim() && !photo) return;
    setPending(true); setErr(null);
    const prompt = `You are COMPOUND's nutrition estimator. Estimate the calories and macros for this meal as accurately as you can from the description${photo ? ' and photo' : ''}.

Meal: "${desc.trim() || '(see photo)'}"

Respond ONLY with valid JSON:
{
  "name": "short meal name",
  "kcal": <integer calories>,
  "p": <protein g>, "c": <carbs g>, "f": <fat g>,
  "confidence": "low" | "medium" | "high",
  "health": "unhealthy" | "neutral" | "healthy",
  "info": "one encouraging, informative sentence — never scolding. Note what's good and flag what bumps calories, warmly.",
  "nips": <number — standard-nip alcohol equivalent if this includes ANY alcohol (1 beer ≈ 1.5, 1 glass of wine ≈ 2, 1 spirit nip = 1, 1 standard drink ≈ 1.4); 0 if no alcohol>,
  "questions": [ { "q": "highest-value clarifying question", "options": ["chip1","chip2","chip3"] } ]
}
Rules: protein/carbs/fat in grams. ALCOHOL CALORIES — never eyeball spirits. Compute ethanol calories = volume_ml × (ABV/100) × 0.789 × 7 kcal, then add mixers. A 30ml nip of 40% spirit ≈ 65 kcal; a 30ml nip of 58% ≈ 95 kcal; scale by the stated ABV and count EVERY nip. Count ALL alcohol into "nips" even when logged as food/drink — never miss alcohol. Still count its calories in kcal. Health rating: leniency applies to FOOD only — reward real food. Rate alcohol HONESTLY: 1–2 drinks "neutral", heavier intake "unhealthy". Never imply heavy drinking is fine. Max 2 questions, only if they'd materially change the estimate (else empty array). Keep "info" warm, honest and brief.`;
    try {
      const raw = await window.claude.complete(photo ? [{ type: 'text', text: prompt }, { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo.split(',')[1] } }] : prompt);
      const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no json');
      const obj = JSON.parse(m[0]);
      const entry = {
        id: 'f-' + Date.now(),
        name: obj.name || (desc.trim().slice(0, 40)) || 'Meal',
        photo: photo || null,
        kcal: Math.round(obj.kcal || 0), p: Math.round(obj.p || 0), c: Math.round(obj.c || 0), f: Math.round(obj.f || 0),
        confidence: ['low', 'medium', 'high'].includes(obj.confidence) ? obj.confidence : 'medium',
        health: ['unhealthy', 'neutral', 'healthy'].includes(obj.health) ? obj.health : 'neutral',
        info: obj.info || '',
        questions: Array.isArray(obj.questions) ? obj.questions.slice(0, 2).map((q) => ({ q: q.q, options: q.options || [], answer: null })) : [],
        nips: Math.max(0, +obj.nips || 0),
        ts: Date.now(),
      };
      window.addFood(entry);
      // Alcohol logged as food still counts toward the weekly nips ring.
      if (entry.nips > 0 && window.setNipsToday) {
        window.setNipsToday((window.loadNipsToday ? window.loadNipsToday() : 0) + entry.nips);
      }
      onChanged && onChanged();
      onClose();
      if (onGoNutrition) onGoNutrition();
    } catch (e) {
      setErr("Couldn't estimate that — try a bit more detail (or check your connection).");
    } finally {
      setPending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '92%', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>ADD A MEAL</div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '0 0 14px', textTransform: 'uppercase' }}>
          WHAT DID YOU<br /><span style={{ color: C.accent }}>EAT?</span>
        </h3>

        {/* Photo */}
        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
        {photo ? (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <img src={photo} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
            <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: 'rgba(0,0,0,.6)', border: 0, color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: '100%', padding: '16px', marginBottom: 12, background: C.surf1, border: `1px dashed ${C.lineStrong}`, borderRadius: 12, color: C.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.4" /><rect x="7" y="3" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>
            Add photo (optional)
          </button>
        )}

        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="e.g. Grilled chicken sub, extra chicken, max salad, no sauce" style={{ width: '100%', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 15, lineHeight: 1.4, outline: 0, resize: 'vertical', boxSizing: 'border-box' }} />

        {err && <div style={{ marginTop: 10, fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.danger, lineHeight: 1.4 }}>{err}</div>}

        <button onClick={submit} disabled={pending || (!desc.trim() && !photo)} style={{ width: '100%', height: 52, marginTop: 14, background: (pending || (!desc.trim() && !photo)) ? C.surf3 : C.accent, border: 0, borderRadius: 12, color: (pending || (!desc.trim() && !photo)) ? C.textLow : '#0A0A0C', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: pending ? 'default' : 'pointer' }}>
          {pending ? 'Estimating…' : 'Log it'}
        </button>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11.5, color: C.textLow, lineHeight: 1.5, margin: '12px 0 0', textAlign: 'center' }}>
          Added straight away. If the AI needs detail, it'll ask in the Nutrition tab — no rush.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { AddButton, NipQuickAdd });

export { AddButton, AddRow, FoodAdd, NipQuickAdd, PourChip, stepBtn };

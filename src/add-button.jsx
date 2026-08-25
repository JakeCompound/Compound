import React from 'react';
import { C, MultiChip, Stepper } from './compound-ui.jsx';
import { alcoholOn } from './alcohol.js';
import { useBackClose } from './back-button.js';

// add-button.jsx — Floating "+" on Home (and Nutrition) → Drink (alcoholic /
// non-alcoholic) + Food.

function AddButton({ dietTracking, alcohol = true, onChanged, onGoNutrition }) {
  const [menu, setMenu] = React.useState(false);
  const [sheet, setSheet] = React.useState(null); // 'drink' | 'food'
  // Hardware back closes these (hooks must run before the early return below).
  useBackClose(menu, () => setMenu(false));
  useBackClose(!!sheet, () => setSheet(null));
  if (!alcohol && !dietTracking) return null; // nothing to add
  return (
    <>
      <button
        onClick={() => setMenu(true)}
        aria-label="Add"
        style={{
          position: 'absolute', right: 18, bottom: 18, zIndex: 60,
          width: 58, height: 58, borderRadius: 29,
          background: C.accent, border: 0, color: C.onAccent,
          boxShadow: '0 10px 30px rgba(242,163,15,.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 5 V21 M5 13 H21" stroke="#0A0A0C" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </button>

      {menu && (
        <div onClick={() => setMenu(false)} style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>ADD TO TODAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AddRow label="Drink" sub={alcohol ? 'Coffee, juice, energy — or a beer' : 'Coffee, juice, energy, soft drink'} glyph={alcohol ? '🥤' : '☕'} onClick={() => { setMenu(false); setSheet('drink'); }} />
              {dietTracking && <AddRow label="Food" sub="Photo or describe — AI does the macros" glyph="🍽️" onClick={() => { setMenu(false); setSheet('food'); }} />}
            </div>
          </div>
        </div>
      )}

      {sheet === 'drink' && <DrinkChooser onClose={() => setSheet(null)} onChanged={onChanged} />}
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
      const raw = await window.claude.complete(`Estimate this drink's alcohol content (in nips) and total calories. 1 nip = 30ml of 40% spirit ≈ 9.5g ethanol. Beer ≈ 1.5 nips, glass of wine ≈ 2, cocktail (e.g. Long Island Iced Tea) ≈ 3-4, cider ≈ 1.5 — scale these for the actual ABV (a 3.5% "mid-strength" beer is meaningfully less than a 4.8% full-strength one).

If it's a NAMED/BRANDED drink (e.g. "Carlton Dry", "Corona", "Jack Daniel's and Coke"), SEARCH THE WEB for its real ABV, serving size and — if the brewer/distiller publishes one — its actual calorie count, and use that real kcal figure directly instead of estimating it yourself.

Otherwise compute: ethanol kcal = volume_ml × (ABV/100) × 0.789 × 7, then add carbs/mixers on top. NEVER SKIP ALCOHOL CALORIES — a beer or cider is virtually never under 60 kcal, a glass of wine never under 90. Drink: "${desc.trim()}". Respond ONLY JSON: {"nips": <number>, "kcal": <integer>, "name":"short name"}`);
      const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
      const obj = m ? JSON.parse(m[0]) : { nips: 0, kcal: 0 };
      const addN = Math.max(0, +obj.nips || 0);
      // Safety floor regardless of what the model returned: a nip's worth of
      // alcohol alone is ~65 kcal (30ml @ 40% ABV × 0.789 g/ml × 7 kcal/g), so
      // the total can never plausibly be less than that per nip.
      const addK = Math.max(Math.round(addN * 65), Math.round(+obj.kcal || 0));
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
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
            <button onClick={estimate} disabled={pending || !desc.trim()} style={{ width: 52, background: (pending || !desc.trim()) ? C.surf2 : C.accent, color: (pending || !desc.trim()) ? C.textLow : C.onAccent, border: 0, borderRadius: 10, fontSize: 18, cursor: (pending || !desc.trim()) ? 'default' : 'pointer' }}>{pending ? '…' : '→'}</button>
          </div>
          {note && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.accent, marginTop: 8, lineHeight: 1.4 }}>{note}</div>}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 50, marginTop: 16, background: C.accent, border: 0, borderRadius: 12, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer' }}>Done</button>
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

// ── Drink chooser — alcoholic vs non-alcoholic ──────────────────────────────
// ── Shared alcohol math ──────────────────────────────────────────────────────
// 1 standard nip = 30ml of 40% spirit ≈ 9.5g ethanol (matches the AI-estimate
// prompts elsewhere in this file, so numbers stay consistent app-wide).
const NIP_GRAMS = 9.5;
const ethanolGrams = (ml, abv) => ml * (abv / 100) * 0.789;
const ethanolKcal = (ml, abv) => ethanolGrams(ml, abv) * 7;
const toNips = (ml, abv) => +(ethanolGrams(ml, abv) / NIP_GRAMS).toFixed(1);

// Log a deterministically-computed drink: add to today's running nips +
// alcohol kcal (same store the pour chips and AI estimate write to), then close.
function logComputed(nips, kcal, onChanged, onClose) {
  const n = window.loadNipsToday ? window.loadNipsToday() : 0;
  const k = window.loadAlcoholKcal ? window.loadAlcoholKcal() : 0;
  if (window.setNipsToday) window.setNipsToday(+(n + nips).toFixed(2));
  if (window.setAlcoholKcal) window.setAlcoholKcal(Math.max(0, k + kcal));
  onChanged && onChanged();
  onClose && onClose();
}

// Shared chrome for the Beer/Spirit/Wine screens: back chevron, tag, title,
// scrollable body, sticky Log button.
function DrinkTypeSheet({ tag, onBack, onClose, kcal, onLog, children }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '88vh', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 0, color: C.textLow, fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0 }}>‹</button>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4 }}>{tag}</div>
        </div>
        {children}
        <button onClick={onLog} style={{ width: '100%', height: 50, marginTop: 8, background: C.accent, border: 0, borderRadius: 12, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer' }}>
          Log it — {kcal} kcal
        </button>
      </div>
    </div>
  );
}
const FIELD_LABEL = { fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 8 };
const CHIP_ROW = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 };

function DrinkChooser({ onClose, onChanged }) {
  let onboard = {};
  try { onboard = JSON.parse(localStorage.getItem('compound:onboarding') || '{}'); } catch (e) {}
  const alcOn = alcoholOn(onboard);
  // Only one side available → skip the extra tap.
  const [pick, setPick] = React.useState(alcOn ? null : 'soft');
  if (pick === 'alc') return <AlcoholTypeChooser onClose={onClose} onChanged={onChanged} />;
  if (pick === 'soft') return <SoftDrinkQuickAdd onClose={onClose} onChanged={onChanged} />;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>WHAT KIND OF DRINK?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AddRow label="Alcoholic" sub="Nip / beer / wine — counts to your nips" glyph="🍺" onClick={() => setPick('alc')} />
          <AddRow label="Non-alcoholic" sub="Coffee, juice, energy, soft drink" glyph="☕" onClick={() => setPick('soft')} />
        </div>
      </div>
    </div>
  );
}

// ── Alcoholic drink: Beer / Spirit / Wine, or Other (free-text AI) ──────────
function AlcoholTypeChooser({ onClose, onChanged }) {
  const [pick, setPick] = React.useState(null); // 'beer' | 'spirit' | 'wine' | 'other'
  if (pick === 'beer') return <BeerLog onBack={() => setPick(null)} onClose={onClose} onChanged={onChanged} />;
  if (pick === 'spirit') return <SpiritLog onBack={() => setPick(null)} onClose={onClose} onChanged={onChanged} />;
  if (pick === 'wine') return <WineLog onBack={() => setPick(null)} onClose={onClose} onChanged={onChanged} />;
  if (pick === 'other') return <NipQuickAdd onClose={onClose} onChanged={onChanged} />;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>WHAT ARE YOU HAVING?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AddRow label="Beer" sub="Size, style and strength — a few taps" glyph="🍺" onClick={() => setPick('beer')} />
          <AddRow label="Spirit" sub="A nip, or a splash more" glyph="🥃" onClick={() => setPick('spirit')} />
          <AddRow label="Wine" sub="Red or white, dry or sweet" glyph="🍷" onClick={() => setPick('wine')} />
          <AddRow label="Other" sub="Cocktail, cider, anything — describe it, AI estimates" glyph="🍹" onClick={() => setPick('other')} />
        </div>
      </div>
    </div>
  );
}

const BEER_SIZES = [
  { key: 'stubbie', label: 'Stubbie/Can', ml: 330 },
  { key: 'bottle', label: 'Bottle', ml: 375 },
  { key: 'schooner', label: 'Schooner', ml: 425 },
  { key: 'pint', label: 'Pint', ml: 570 },
];
// abv = a sensible default (editable below); carb100 = extra kcal per 100ml
// from residual sugar on top of the alcohol itself, roughly by style.
const BEER_STYLES = [
  { key: 'lager', label: 'Lager', abv: 4.5, carb100: 8 },
  { key: 'paleale', label: 'Pale Ale', abv: 5.0, carb100: 12 },
  { key: 'ipa', label: 'IPA', abv: 6.0, carb100: 12 },
  { key: 'pilsner', label: 'Pilsner', abv: 4.8, carb100: 7 },
  { key: 'stout', label: 'Stout', abv: 5.5, carb100: 18 },
  { key: 'wheat', label: 'Wheat', abv: 5.0, carb100: 14 },
  { key: 'cider', label: 'Cider', abv: 4.5, carb100: 20 },
  { key: 'other', label: 'Other', abv: 4.5, carb100: 10 },
];

function BeerLog({ onBack, onClose, onChanged }) {
  const [size, setSize] = React.useState(BEER_SIZES[0]);
  const [style, setStyle] = React.useState(BEER_STYLES[0]);
  const [abv, setAbv] = React.useState(style.abv);
  const pickStyle = (s) => { setStyle(s); setAbv(s.abv); }; // re-suggest ABV, still editable
  const kcal = Math.round(ethanolKcal(size.ml, abv) + (size.ml / 100) * style.carb100);
  const nips = toNips(size.ml, abv);
  return (
    <DrinkTypeSheet tag="BEER" onBack={onBack} onClose={onClose} kcal={kcal} onLog={() => logComputed(nips, kcal, onChanged, onClose)}>
      <div style={FIELD_LABEL}>SIZE</div>
      <div style={CHIP_ROW}>
        {BEER_SIZES.map((s) => <MultiChip key={s.key} active={size.key === s.key} onClick={() => setSize(s)}>{s.label}</MultiChip>)}
      </div>
      <div style={FIELD_LABEL}>STYLE</div>
      <div style={CHIP_ROW}>
        {BEER_STYLES.map((s) => <MultiChip key={s.key} active={style.key === s.key} onClick={() => pickStyle(s)}>{s.label}</MultiChip>)}
      </div>
      <div style={FIELD_LABEL}>ALCOHOL % — EDIT IF THE LABEL SAYS OTHERWISE</div>
      <div style={{ marginBottom: 16 }}><Stepper value={abv} onChange={setAbv} min={0.5} max={15} step={0.1} unit="%" /></div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, margin: '0 0 16px' }}>
        {size.label} of {style.label} at {abv.toFixed(1)}% ≈ <strong style={{ color: C.text }}>{nips} nips</strong>
      </p>
    </DrinkTypeSheet>
  );
}

const SPIRIT_TYPES = ['Vodka', 'Gin', 'Rum', 'Bourbon', 'Scotch', 'Brandy', 'Other'];
const SPIRIT_AMOUNTS = [{ key: 'nip', label: 'Nip', ml: 30 }, { key: 'double', label: 'Double', ml: 60 }, { key: 'large', label: 'Large', ml: 90 }];

function SpiritLog({ onBack, onClose, onChanged }) {
  const [type, setType] = React.useState(SPIRIT_TYPES[0]);
  const [abv, setAbv] = React.useState(40); // most spirits — optional, editable
  const [amount, setAmount] = React.useState(SPIRIT_AMOUNTS[0]);
  const [ml, setMl] = React.useState(30);
  const pickAmount = (a) => { setAmount(a); setMl(a.ml); };
  const kcal = Math.round(ethanolKcal(ml, abv));
  const nips = toNips(ml, abv);
  return (
    <DrinkTypeSheet tag="SPIRIT" onBack={onBack} onClose={onClose} kcal={kcal} onLog={() => logComputed(nips, kcal, onChanged, onClose)}>
      <div style={FIELD_LABEL}>TYPE</div>
      <div style={CHIP_ROW}>
        {SPIRIT_TYPES.map((t) => <MultiChip key={t} active={type === t} onClick={() => setType(t)}>{t}</MultiChip>)}
      </div>
      <div style={FIELD_LABEL}>ALCOHOL % — OPTIONAL, MOST SPIRITS ARE 40%</div>
      <div style={{ marginBottom: 16 }}><Stepper value={abv} onChange={setAbv} min={15} max={65} step={1} unit="%" /></div>
      <div style={FIELD_LABEL}>AMOUNT</div>
      <div style={CHIP_ROW}>
        {SPIRIT_AMOUNTS.map((a) => <MultiChip key={a.key} active={amount.key === a.key && ml === a.ml} onClick={() => pickAmount(a)}>{a.label}</MultiChip>)}
      </div>
      <div style={{ marginBottom: 16 }}><Stepper value={ml} onChange={setMl} min={15} max={180} step={15} unit="ml" /></div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, margin: '0 0 16px' }}>
        {ml}ml of {type.toLowerCase()} at {abv}% ≈ <strong style={{ color: C.text }}>{nips} nips</strong>
      </p>
    </DrinkTypeSheet>
  );
}

const WINE_SIZES = [{ key: 'small', label: 'Small glass', ml: 100 }, { key: 'standard', label: 'Standard glass', ml: 150 }, { key: 'large', label: 'Large glass', ml: 200 }];
// Sensible ABV defaults by colour + sweetness — editable below.
const WINE_ABV = { 'red-dry': 13.5, 'red-sweet': 13, 'white-dry': 12, 'white-sweet': 10.5 };

function WineLog({ onBack, onClose, onChanged }) {
  const [color, setColor] = React.useState('red'); // 'red' | 'white'
  const [sweet, setSweet] = React.useState('dry'); // 'dry' | 'sweet'
  const [size, setSize] = React.useState(WINE_SIZES[1]);
  const [abv, setAbv] = React.useState(WINE_ABV['red-dry']);
  const pickColor = (c) => { setColor(c); setAbv(WINE_ABV[`${c}-${sweet}`]); };
  const pickSweet = (s) => { setSweet(s); setAbv(WINE_ABV[`${color}-${s}`]); };
  // A dry wine has almost no residual sugar; a sweet/dessert wine has plenty.
  const sugarKcal = (sweet === 'sweet' ? 25 : 5) * (size.ml / 150);
  const kcal = Math.round(ethanolKcal(size.ml, abv) + sugarKcal);
  const nips = toNips(size.ml, abv);
  return (
    <DrinkTypeSheet tag="WINE" onBack={onBack} onClose={onClose} kcal={kcal} onLog={() => logComputed(nips, kcal, onChanged, onClose)}>
      <div style={FIELD_LABEL}>COLOUR</div>
      <div style={CHIP_ROW}>
        <MultiChip active={color === 'red'} onClick={() => pickColor('red')}>Red</MultiChip>
        <MultiChip active={color === 'white'} onClick={() => pickColor('white')}>White</MultiChip>
      </div>
      <div style={FIELD_LABEL}>SWEETNESS</div>
      <div style={CHIP_ROW}>
        <MultiChip active={sweet === 'dry'} onClick={() => pickSweet('dry')}>Dry</MultiChip>
        <MultiChip active={sweet === 'sweet'} onClick={() => pickSweet('sweet')}>Sweet</MultiChip>
      </div>
      <div style={FIELD_LABEL}>GLASS SIZE</div>
      <div style={CHIP_ROW}>
        {WINE_SIZES.map((s) => <MultiChip key={s.key} active={size.key === s.key} onClick={() => setSize(s)}>{s.label}</MultiChip>)}
      </div>
      <div style={FIELD_LABEL}>ALCOHOL % — EDIT IF THE LABEL SAYS OTHERWISE</div>
      <div style={{ marginBottom: 16 }}><Stepper value={abv} onChange={setAbv} min={5} max={20} step={0.5} unit="%" /></div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, margin: '0 0 16px' }}>
        {size.label.toLowerCase()} of {sweet} {color} at {abv}% ≈ <strong style={{ color: C.text }}>{nips} nips</strong>
      </p>
    </DrinkTypeSheet>
  );
}

// ── Non-alcoholic quick-add — editable quick picks + describe-a-drink AI ────
function SoftDrinkQuickAdd({ onClose, onChanged }) {
  const [presets, setPresets] = React.useState(() => window.loadSoftPresets());
  const [edit, setEdit] = React.useState(false);
  const [desc, setDesc] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [note, setNote] = React.useState(null);
  const [savePick, setSavePick] = React.useState(null); // last AI drink, offer to pin it
  const recent = (window.recentEntries ? window.recentEntries({ kind: 'drink', limit: 8 }) : [])
    .filter((d) => !presets.some((p) => p.name.toLowerCase() === d.name.toLowerCase()));
  const log = (d) => {
    const r = window.quickLogFood({ ...d, kind: 'drink' });
    setNote(r.repeated ? `${r.name} → ×${r.servings}` + (window.isLogToday() ? ' today' : ' on ' + window.prettyDay()) + ` · ${r.kcal} kcal` : `Added ${r.name} · ${r.kcal} kcal`);
    onChanged && onChanged();
  };
  const pin = (d) => { setPresets(window.pinSoftPreset(d)); setSavePick(null); };
  const estimate = async () => {
    if (!desc.trim() || pending) return;
    setPending(true); setNote(null); setSavePick(null);
    try {
      const raw = await window.claude.complete(`Estimate this NON-ALCOHOLIC drink's calories and macros (coffee, tea, juice, soft drink, energy drink, milk, smoothie, protein shake). Include milk, syrup and sugar if described. If it's a branded drink, you may search the web for its real nutrition label. Drink: "${desc.trim()}". Respond ONLY JSON: {"name":"short drink name","kcal":<int>,"p":<g>,"c":<g>,"f":<g>,"health":"unhealthy"|"neutral"|"healthy","info":"one warm, honest sentence","nips":<number — 0 unless the drink actually contains alcohol, then standard-nip equivalent>}`);
      const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no json');
      const o = JSON.parse(m[0]);
      const d = { name: (o.name || desc.trim()).slice(0, 40), kcal: Math.max(0, Math.round(+o.kcal || 0)),
        p: Math.max(0, Math.round(+o.p || 0)), c: Math.max(0, Math.round(+o.c || 0)), f: Math.max(0, Math.round(+o.f || 0)),
        health: o.health || 'neutral', info: o.info || '' };
      log(d);
      setSavePick(d);
      // Safety net: if it turns out to contain alcohol, it still counts to nips.
      const nips = Math.max(0, +o.nips || 0);
      if (nips > 0 && window.setNipsToday) window.setNipsToday(+(window.loadNipsToday() + nips).toFixed(2));
      setDesc('');
    } catch (e) { setNote('Estimate failed — try again, or pick one above.'); }
    finally { setPending(false); }
  };
  const rowStyle = { width: '100%', textAlign: 'left', padding: '12px 14px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '92%', overflowY: 'auto', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4 }}>NON-ALCOHOLIC DRINK</div>
          <button onClick={() => setEdit(!edit)} style={{ background: 'transparent', border: 0, padding: 0, color: edit ? C.accent : C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: 1.6, cursor: 'pointer' }}>{edit ? 'DONE' : 'EDIT PICKS'}</button>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>{edit ? 'YOUR QUICK PICKS' : 'QUICK SELECT'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {presets.map((d) => (
            <div key={d.name} style={{ ...rowStyle, cursor: 'default' }}>
              <span style={{ fontSize: 21 }}>{d.glyph || '🥤'}</span>
              <button onClick={edit ? undefined : () => log(d)} disabled={edit} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 0, padding: 0, cursor: edit ? 'default' : 'pointer' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, letterSpacing: 0.7, color: C.text, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: C.textLow, letterSpacing: 0.8, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.kcal} KCAL{d.sub ? ' · ' + d.sub : ''}</div>
              </button>
              {edit ? (
                <button onClick={() => setPresets(window.unpinSoftPreset(d.name))} title="Remove quick pick" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: 'rgba(229,86,75,.14)', border: '1px solid rgba(229,86,75,.5)', color: C.danger, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1 }}>✕</button>
              ) : (
                <button onClick={() => log(d)} title="Log it" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: C.accent + '1f', border: `1px solid ${C.accent}66`, color: C.accent, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 15, lineHeight: 1 }}>+</button>
              )}
            </div>
          ))}
          {presets.length === 0 && (
            <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid }}>No quick picks. Describe a drink below and save it as one.</div>
          )}
        </div>

        {/* Pin something already logged often */}
        {edit && recent.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>PIN ONE YOU LOG OFTEN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recent.map((d) => (
                <button key={d.name} onClick={() => pin(d)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px dashed ${C.lineStrong}`, borderRadius: 999, padding: '7px 11px', color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 12, cursor: 'pointer' }}>
                  <span style={{ color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>+</span>{d.name}
                  <span style={{ color: C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>×{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>OR DESCRIBE A DRINK</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') estimate(); }} placeholder="e.g. large flat white, Coke Zero, iced latte" style={{ flex: 1, minWidth: 0, background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 14, padding: '12px 14px', outline: 'none' }} />
            <button onClick={estimate} disabled={pending || !desc.trim()} style={{ width: 52, flexShrink: 0, background: (pending || !desc.trim()) ? C.surf2 : C.accent, color: (pending || !desc.trim()) ? C.textLow : C.onAccent, border: 0, borderRadius: 10, fontSize: 18, cursor: (pending || !desc.trim()) ? 'default' : 'pointer' }}>{pending ? '…' : '→'}</button>
          </div>
          {note && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.accent, marginTop: 8, lineHeight: 1.4 }}>{note}</div>}
          {savePick && (
            <button onClick={() => pin(savePick)} style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${C.accent}88`, borderRadius: 999, padding: '7px 12px', color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: 1.4, cursor: 'pointer' }}>+ SAVE "{savePick.name.toUpperCase()}" AS A QUICK PICK</button>
          )}
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, lineHeight: 1.5, margin: '14px 0 0' }}>
          Drinks land in the food log — tap the <span style={{ color: C.accent }}>+</span> on a row for another one.
        </p>
        <button onClick={onClose} style={{ width: '100%', height: 50, marginTop: 14, background: C.accent, border: 0, borderRadius: 12, color: C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}

// ── Food add (photo + text → AI estimate) ───────────────────────────────────
function FoodAdd({ onClose, onChanged, onGoNutrition }) {
  const [desc, setDesc] = React.useState('');
  const [again, setAgain] = React.useState(null); // note after repeating a past meal
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
Rules: protein/carbs/fat in grams. BRANDED / PACKAGED PRODUCTS — if the meal names a brand or packaged product (e.g. "Musashi 45g protein bar", a fast-food item, a packaged snack), SEARCH THE WEB for its official nutrition panel and use the label values exactly; set confidence "high" and mention in "info" that it's from the label. Beware: a weight in a protein-bar's name (like "45g") is usually its PROTEIN content, not the bar's weight. ENERGY CONSISTENCY — kcal must approximately equal protein×4 + carbs×4 + fat×9 (+ alcohol×7); if your numbers don't reconcile within ~10%, correct them before answering. ALCOHOL CALORIES — never eyeball spirits. Compute ethanol calories = volume_ml × (ABV/100) × 0.789 × 7 kcal, then add mixers. A 30ml nip of 40% spirit ≈ 65 kcal; a 30ml nip of 58% ≈ 95 kcal; scale by the stated ABV and count EVERY nip. Count ALL alcohol into "nips" even when logged as food/drink — never miss alcohol. Still count its calories in kcal. Health rating: leniency applies to FOOD only — reward real food. Rate alcohol HONESTLY: 1–2 drinks "neutral", heavier intake "unhealthy". Never imply heavy drinking is fine. Max 2 questions, only if they'd materially change the estimate (else empty array). Keep "info" warm, honest and brief.`;
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
        kind: 'food', servings: 1,
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: C.ink(.18) }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>ADD A MEAL</div>
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '0 0 14px', textTransform: 'uppercase' }}>
          WHAT DID YOU<br /><span style={{ color: C.accent }}>EAT?</span>
        </h3>

        {/* Repeat something already logged — no re-describing it. Hides as soon
            as the user starts the normal flow (photo or description). */}
        {(() => {
          const recent = (window.recentEntries ? window.recentEntries({ limit: 12 }) : []).filter((r) => r.kind !== 'drink').slice(0, 4);
          if (!recent.length || photo || desc.trim()) return null;
          const repeat = (r) => {
            const res = window.quickLogFood(r);
            setAgain(res.repeated ? `${res.name} → ×${res.servings} · ${res.kcal} kcal` : `Added ${res.name} · ${res.kcal} kcal`);
            onChanged && onChanged();
          };
          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 8 }}>LOG IT AGAIN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recent.map((r) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 11 }}>
                    {r.photo
                      ? <img src={r.photo} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: 7, background: C.surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>🍽️</div>}
                    <button onClick={() => repeat(r)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.6, color: C.text, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 0.8, marginTop: 1 }}>{r.kcal} KCAL · {window.prettyDay(r.day)}</div>
                    </button>
                    <button onClick={() => repeat(r)} title="Log it again" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: C.accent + '1f', border: `1px solid ${C.accent}66`, color: C.accent, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 15, lineHeight: 1 }}>+</button>
                  </div>
                ))}
              </div>
              {again && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.accent, marginTop: 8, lineHeight: 1.4 }}>{again}</div>}
            </div>
          );
        })()}

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

        <button onClick={submit} disabled={pending || (!desc.trim() && !photo)} style={{ width: '100%', height: 52, marginTop: 14, background: (pending || (!desc.trim() && !photo)) ? C.surf3 : C.accent, border: 0, borderRadius: 12, color: (pending || (!desc.trim() && !photo)) ? C.textLow : C.onAccent, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', cursor: pending ? 'default' : 'pointer' }}>
          {pending ? 'Estimating…' : 'Log it'}
        </button>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11.5, color: C.textLow, lineHeight: 1.5, margin: '12px 0 0', textAlign: 'center' }}>
          Added straight away. If the AI needs detail, it'll ask in the Nutrition tab — no rush.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { AddButton, NipQuickAdd, DrinkChooser, SoftDrinkQuickAdd });

export { AddButton, AddRow, DrinkChooser, FoodAdd, NipQuickAdd, PourChip, SoftDrinkQuickAdd, stepBtn };

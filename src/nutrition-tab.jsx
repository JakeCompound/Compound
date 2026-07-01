import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';
import { NutritionChat } from './nutrition-screen.jsx';
import { AddRow, FoodAdd, NipQuickAdd } from './add-button.jsx';
import { alcoholOn } from './alcohol.js';

// nutrition-tab.jsx — Redesigned Nutrition: Today (food tracker) / Ask (AI chat).

const HEALTH_COLOR = { unhealthy: '#E5564B', neutral: '#E8A23F', healthy: '#5AC57E' };
const CONF_COLOR = { low: '#E5564B', medium: '#E8A23F', high: '#5AC57E' };

// Quick-add buttons in the Today view reuse Home's meal/drink sheets.
const ADD_ACTION_BTN = { flex: 1, padding: '12px 14px', background: C.surf1, border: `1px solid ${C.accentDim}`, borderRadius: 12, color: C.accent, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 };

function NutritionTab({ user, dietTracking, onToggleTracking, onChanged, onSetupTargets }) {
  const [view, setView] = React.useState('today');

  if (!dietTracking) {
    return (
      <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <NutHeader view="ask" onView={() => {}} showToggle={false} />
        <div style={{ padding: '12px 22px 0' }}>
          <div style={{ padding: '14px 16px', background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>Turn on food tracking</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, marginTop: 2 }}>Log meals by photo or text, AI does the macros.</div>
            </div>
            <button onClick={onSetupTargets} style={{ background: C.accent, border: 0, color: '#0A0A0C', padding: '9px 14px', borderRadius: 9, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1.4, cursor: 'pointer' }}>SET UP</button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}><NutritionChat user={user} /></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <NutHeader view={view} onView={setView} showToggle />
      {view === 'today'
        ? <NutritionToday user={user} onChanged={onChanged} />
        : view === 'week'
        ? <NutritionWeek user={user} />
        : <div style={{ flex: 1, minHeight: 0 }}><NutritionChat user={user} /></div>}
    </div>
  );
}

function NutHeader({ view, onView, showToggle }) {
  return (
    <div style={{ padding: '14px 22px 12px', borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow }}>TAB · NUTRITION</div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '6px 0 0', textTransform: 'uppercase' }}>
            FUEL<span style={{ color: C.accent }}>.</span>
          </h1>
        </div>
        {showToggle && (
          <div style={{ display: 'flex', gap: 4, padding: 3, background: C.surf1, borderRadius: 9, border: `1px solid ${C.line}` }}>
            {[{ k: 'today', l: 'TODAY' }, { k: 'week', l: 'WEEK' }, { k: 'ask', l: 'ASK' }].map((t) => (
              <button key={t.k} onClick={() => onView(t.k)} style={{ padding: '6px 11px', borderRadius: 7, border: 0, cursor: 'pointer', background: view === t.k ? C.accent : 'transparent', color: view === t.k ? '#0A0A0C' : C.textMid, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1.2 }}>{t.l}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NutritionToday({ user, onChanged }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  const [qOpen, setQOpen] = React.useState(false);
  const [sheet, setSheet] = React.useState(null); // 'food' | 'drink' — reuses Home's add sheets
  const targets = window.loadTargets ? window.loadTargets() : null;
  const totals = window.dayTotals();
  const foods = window.foodForDay();
  const questions = window.openMealQuestions();

  const refresh = () => { force(); onChanged && onChanged(); };

  const kcalTarget = targets ? targets.calories : 0;
  const kcalLeft = Math.max(0, kcalTarget - totals.kcal);
  // Alcohol kcal are in the ring total (dayTotals) but have no macro bar — show
  // them as their own line so the breakdown reconciles with the total.
  const alcKcal = window.loadAlcoholKcal ? window.loadAlcoholKcal() : 0;
  const showAlcohol = alcoholOn(user) && alcKcal > 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
      {/* Calories remaining ring + macros */}
      <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <CalRing consumed={totals.kcal} target={kcalTarget} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MacroBar label="PROTEIN" value={totals.p} target={targets ? targets.protein : 0} color={C.accent} />
          {targets && targets.carbs ? <MacroBar label="CARBS" value={totals.c} target={targets.carbs} color="#7CA8E0" /> : null}
          {targets && targets.fat ? <MacroBar label="FAT" value={totals.f} target={targets.fat} color="#7BB661" /> : null}
          {showAlcohol && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4, color: '#E5564B' }}>ALCOHOL</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMid }}>{alcKcal} kcal</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick add — opens the same meal/drink sheets as Home's + button */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={() => setSheet('menu')} style={ADD_ACTION_BTN}>+ Add item</button>
      </div>

      {/* Meal Questions launcher with red count */}
      {questions.length > 0 && (
        <button onClick={() => setQOpen(true)} style={{ position: 'relative', width: '100%', marginTop: 14, padding: '14px 16px', background: C.surf2, border: `1px solid ${C.accentDim}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>Meal Questions</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid }}>A few taps to sharpen your macros — no rush.</div>
          </div>
          <span style={{ position: 'absolute', top: 10, right: 12, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: C.danger, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{questions.length}</span>
        </button>
      )}

      {/* Food log */}
      <div style={{ marginTop: 18 }}>
        <SectionLabel meta={`${foods.length} ${foods.length === 1 ? 'MEAL' : 'MEALS'} · ${totals.kcal} KCAL`}>TODAY'S LOG</SectionLabel>
        {foods.length === 0 && !(window.loadNipsToday && window.loadNipsToday() > 0) ? (
          <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
            Nothing logged yet. Tap <span style={{ color: C.accent }}>+ Add item</span> above to log a meal or a drink.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const nips = window.loadNipsToday ? window.loadNipsToday() : 0;
              const akcal = window.loadAlcoholKcal ? window.loadAlcoholKcal() : 0;
              if (!alcoholOn(user) || (nips <= 0 && akcal <= 0)) return null;
              return <AlcoholRow nips={nips} kcal={akcal} onAdd={() => setSheet('drink')} />;
            })()}
            {foods.map((f) => <FoodRow key={f.id} food={f} onChanged={refresh} />)}
          </div>
        )}
      </div>

      {qOpen && <MealQuestionsFlow onClose={() => { setQOpen(false); refresh(); }} onChanged={refresh} />}
      {sheet === 'menu' && (
        <div onClick={() => setSheet(null)} style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>ADD TO TODAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AddRow label="Meal" sub="Photo or describe — AI does the macros" glyph="🍽️" onClick={() => setSheet('food')} />
              <AddRow label="Drink" sub="Log a nip / beer / wine" glyph="🍺" onClick={() => setSheet('drink')} />
            </div>
          </div>
        </div>
      )}
      {sheet === 'food' && <FoodAdd onClose={() => setSheet(null)} onChanged={refresh} />}
      {sheet === 'drink' && <NipQuickAdd onClose={() => setSheet(null)} onChanged={refresh} />}
    </div>
  );
}

function CalRing({ consumed, target }) {
  const size = 96, stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const frac = target > 0 ? Math.min(1, consumed / target) : 0;
  const over = target > 0 && consumed > target;
  const left = target - consumed; // can go negative
  const color = over ? C.danger : C.accent;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circ * frac} ${circ}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 20, color: over ? C.danger : C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{target > 0 ? left : consumed}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: over ? C.danger : C.textLow, letterSpacing: 1.2, marginTop: 2 }}>{target > 0 ? (over ? 'KCAL OVER' : 'KCAL LEFT') : 'KCAL'}</span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, color }) {
  const frac = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.2, marginBottom: 3 }}>
        <span style={{ color: C.textLow }}>{label}</span>
        <span style={{ color: C.textMid }}><span style={{ color }}>{value}</span>{target ? ` / ${target}g` : 'g'}</span>
      </div>
      <div style={{ height: 4, background: C.surf2, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${frac * 100}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

function FoodRow({ food, onChanged }) {
  const [popup, setPopup] = React.useState(null); // 'confidence' | 'health' | 'info'
  const nOpen = (food.questions || []).filter((q) => q.answer == null).length;
  const CONF_TEXT = {
    low: 'Low confidence — the AI is unsure on this estimate. Answer its meal question to sharpen it.',
    medium: 'Medium confidence — a reasonable estimate. A quick meal question would tighten it.',
    high: 'High confidence — the AI is confident in these numbers.',
  };
  const HEALTH_TEXT = {
    unhealthy: 'A heavier choice — worth keeping an eye on how often it shows up.',
    neutral: 'A balanced, everyday choice.',
    healthy: 'A genuinely good choice — well done.',
  };
  return (
    <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px' }}>
        {food.photo
          ? <img src={food.photo} alt="" style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 46, height: 46, borderRadius: 9, background: C.surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🍽️</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 0.5, marginTop: 2 }}>
            {food.kcal} kcal · {food.p}p {food.c}c {food.f}f
          </div>
        </div>
        {/* 3 badges */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Badge title="Estimate confidence" color={CONF_COLOR[food.confidence]} glyph="◎" alert={nOpen > 0} onClick={() => setPopup(popup === 'confidence' ? null : 'confidence')} />
          <Badge title="Food quality" color={HEALTH_COLOR[food.health]} glyph="♥" onClick={() => setPopup(popup === 'health' ? null : 'health')} />
          <Badge title="Info" color={C.textMid} glyph="i" onClick={() => setPopup(popup === 'info' ? null : 'info')} ring />
        </div>
      </div>
      {popup === 'info' && food.info && (
        <div style={{ padding: '0 14px 12px 70px' }}>
          <div style={{ background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8 }}>
            <span style={{ color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, flexShrink: 0 }}>i</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text, lineHeight: 1.45 }}>{food.info}</span>
          </div>
        </div>
      )}
      {(popup === 'confidence' || popup === 'health') && (
        <div style={{ padding: '0 14px 12px 70px' }}>
          <div style={{ background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.5, marginBottom: 4, color: popup === 'confidence' ? CONF_COLOR[food.confidence] : HEALTH_COLOR[food.health] }}>
              {popup === 'confidence' ? `CONFIDENCE · ${food.confidence.toUpperCase()}` : `FOOD QUALITY · ${food.health.toUpperCase()}`}
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text, lineHeight: 1.45 }}>
              {popup === 'confidence' ? CONF_TEXT[food.confidence] : HEALTH_TEXT[food.health]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ title, color, glyph, onClick, ring, alert }) {
  return (
    <button title={title} onClick={onClick} style={{ position: 'relative', width: 26, height: 26, borderRadius: 13, cursor: onClick ? 'pointer' : 'default',
      background: ring ? 'transparent' : color + '22', border: ring ? `1.4px solid ${color}` : `1px solid ${color}66`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>
      {glyph}
      {alert && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: 4, background: C.danger, border: `1px solid ${C.bg}` }} />}
    </button>
  );
}

// ── Meal Questions flow — zero friction: photo + question, tap/custom → next ──
// Small inline spinner (SMIL — no global keyframes needed).
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke={C.line} strokeWidth="2" fill="none" />
      <path d="M8 2 a6 6 0 0 1 6 6" stroke={C.accent} strokeWidth="2" fill="none" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function MealQuestionsFlow({ onClose, onChanged }) {
  const [queue] = React.useState(() => window.openMealQuestions()); // snapshot at open
  const [idx, setIdx] = React.useState(0);
  const [custom, setCustom] = React.useState('');
  const [delta, setDelta] = React.useState(null); // {kcal} last adjustment to flash
  const [chosen, setChosen] = React.useState(null); // the answer just tapped (instant highlight)
  const [status, setStatus] = React.useState('idle'); // 'idle' | 'loading' | 'error'

  if (queue.length === 0 || idx >= queue.length) {
    return <QuestionsDone onClose={onClose} answered={queue.length} />;
  }
  const item = queue[idx];

  const answer = async (ans) => {
    // (a) Register the tap instantly — highlight the chosen chip + show loading —
    // before the (potentially slow) AI re-estimate runs.
    setChosen(ans);
    setStatus('loading');
    setDelta(null);

    // Record the answer on the food entry's question
    const all = window.loadFood();
    const k = window.todayKey();
    const list = all[k] || [];
    const food = list.find((e) => e.id === item.foodId);
    if (food && food.questions[item.qIndex]) {
      food.questions[item.qIndex].answer = ans;
    }
    window.saveFood(all);
    onChanged && onChanged(); // the answer is saved regardless of the re-estimate

    // (b) Re-estimate this meal with the new answer (visible macro update).
    try {
      const answered = (food.questions || []).filter((q) => q.answer != null).map((q) => `${q.q} → ${q.answer}`).join('; ');
      const prompt = `Re-estimate this meal's calories and macros using the extra detail. Meal: "${food.name}". Prior estimate: ${food.kcal}kcal ${food.p}p ${food.c}c ${food.f}f. New detail: ${answered}. Respond ONLY JSON: {"kcal":int,"p":int,"c":int,"f":int,"confidence":"low|medium|high","info":"one warm sentence"}`;
      const raw = await window.claude.complete(prompt);
      const m = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
      if (!m) throw new Error('Unreadable estimate');
      const obj = JSON.parse(m[0]);
      const before = food.kcal;
      window.updateFood(food.id, {
        kcal: Math.round(obj.kcal ?? food.kcal), p: Math.round(obj.p ?? food.p),
        c: Math.round(obj.c ?? food.c), f: Math.round(obj.f ?? food.f),
        confidence: obj.confidence || food.confidence, info: obj.info || food.info,
      });
      setDelta({ kcal: Math.round((obj.kcal ?? before) - before) });
      setStatus('idle');
      onChanged && onChanged();
      setCustom('');
      // Auto-advance to next question after a brief "updated" flash.
      setTimeout(() => { setDelta(null); setChosen(null); setIdx((i) => i + 1); }, 650);
    } catch (e) {
      // Don't silently swallow — the answer stuck, but the estimate didn't.
      setStatus('error');
    }
  };

  const skipCurrent = () => { setDelta(null); setChosen(null); setStatus('idle'); setCustom(''); setIdx((i) => i + 1); };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 240, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2 }}>MEAL QUESTIONS · {idx + 1}/{queue.length}</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div style={{ height: 3, background: C.surf2 }}><div style={{ height: '100%', width: `${(idx / queue.length) * 100}%`, background: C.accent, transition: 'width .3s' }} /></div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        {item.photo && <img src={item.photo} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 14, marginBottom: 16 }} />}
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.6, marginBottom: 6 }}>{item.foodName.toUpperCase()}</div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.05, letterSpacing: 0.3, color: C.text, margin: '0 0 18px' }}>{item.q}</h2>

        {delta != null ? (
          <div style={{ padding: '14px 16px', background: C.accentSoft, border: `1px solid ${C.accentDim}`, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.accent, letterSpacing: 1.5 }}>UPDATED</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: C.text, marginTop: 4 }}>
              {delta.kcal === 0 ? 'No change' : `${delta.kcal > 0 ? '+' : ''}${delta.kcal} kcal`}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(item.options || []).map((opt, i) => {
                const active = chosen === opt;
                const busy = status === 'loading';
                return (
                  <button
                    key={i}
                    onClick={() => answer(opt)}
                    disabled={busy}
                    style={{
                      width: '100%', textAlign: 'left', padding: '14px 16px',
                      background: active ? C.accentDim : C.surf1,
                      border: `1px solid ${active ? C.accent : C.line}`,
                      borderRadius: 12, cursor: busy ? 'default' : 'pointer',
                      fontFamily: 'Outfit, sans-serif', fontSize: 15,
                      color: active ? C.accent : C.text,
                      opacity: busy && !active ? 0.45 : 1,
                      transition: 'background .12s, border-color .12s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    }}
                  >
                    <span>{opt}</span>
                    {active && status === 'loading' && <Spinner />}
                  </button>
                );
              })}
            </div>

            {status === 'loading' ? (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid }}>
                <Spinner /> Updating your macros…
              </div>
            ) : status === 'error' ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.danger, lineHeight: 1.45, marginBottom: 10 }}>
                  Couldn't refresh the estimate just now — your answer is saved. Try again?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => answer(chosen)} style={{ flex: 1, padding: '11px 0', background: C.accent, border: 0, borderRadius: 10, color: '#0A0A0C', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
                    Try again
                  </button>
                  <button onClick={skipCurrent} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 10, color: C.textMid, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>
                    Skip for now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6, marginBottom: 6 }}>OR WRITE YOUR OWN</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) answer(custom.trim()); }} placeholder="Type an answer…" style={{ flex: 1, background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 14, padding: '12px 14px', outline: 'none' }} />
                    <button onClick={() => custom.trim() && answer(custom.trim())} disabled={!custom.trim()} style={{ width: 46, background: custom.trim() ? C.accent : C.surf2, color: custom.trim() ? '#0A0A0C' : C.textLow, border: 0, borderRadius: 10, fontSize: 20, cursor: custom.trim() ? 'pointer' : 'default' }}>→</button>
                  </div>
                </div>
                <button onClick={() => answer('Not sure')} style={{ width: '100%', marginTop: 12, background: 'transparent', border: 0, color: C.textLow, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', padding: 8 }}>
                  SKIP — NOT SURE
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuestionsDone({ onClose, answered }) {
  React.useEffect(() => { const t = setTimeout(onClose, 1400); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 240, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
      <div style={{ width: 80, height: 80, borderRadius: 40, border: `2px solid ${C.accent}`, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40"><path d="M11 20 L17 26 L29 13" stroke={C.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: C.text, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1 }}>
        MACROS<br /><span style={{ color: C.accent }}>SHARPENED.</span>
      </div>
    </div>
  );
}

function NutritionWeek({ user }) {
  const targets = window.loadTargets ? window.loadTargets() : null;
  const dayTarget = targets ? targets.calories : 0;
  const weekTarget = dayTarget * 7;
  const iso = window.isoDate || ((d) => d.toISOString().slice(0, 10));

  // Last 7 days (Mon→Sun of current week)
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today.getTime() - dow * 86400000);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const days = labels.map((lab, i) => {
    const d = new Date(monday.getTime() + i * 86400000);
    const key = iso(d);
    const future = d > today && key !== iso(today);
    const kcal = future ? null : (window.dayTotals ? window.dayTotals(key).kcal : 0);
    return { lab, key, future, kcal, today: key === iso(today) };
  });

  const logged = days.filter((d) => !d.future && d.kcal != null);
  const weekTotal = logged.reduce((s, d) => s + (d.kcal || 0), 0);
  const daysWithData = logged.filter((d) => d.kcal > 0).length;
  const avg = daysWithData ? Math.round(weekTotal / daysWithData) : 0;
  const budgetSoFar = dayTarget * Math.max(1, days.filter((d) => !d.future).length);
  const max = Math.max(dayTarget, ...days.map((d) => d.kcal || 0), 1);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 32px' }}>
      {/* Weekly budget headline */}
      <div style={{ background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)', border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>THIS WEEK · KCAL</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 34, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{weekTotal.toLocaleString()}</span>
          {weekTarget > 0 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: C.textMid }}>/ {weekTarget.toLocaleString()}</span>}
        </div>
        {weekTarget > 0 && (
          <>
            <div style={{ height: 5, background: C.surf2, borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
              <div style={{ height: '100%', width: `${Math.min(100, (weekTotal / weekTarget) * 100)}%`, background: weekTotal > budgetSoFar ? C.danger : C.accent }} />
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '12px 0 0' }}>
              {weekTotal <= budgetSoFar
                ? `You're ${(budgetSoFar - weekTotal).toLocaleString()} under your pace — one big day won't sink the week.`
                : `${(weekTotal - budgetSoFar).toLocaleString()} over pace so far. Plenty of week left to even it out — no single day decides it.`}
            </p>
          </>
        )}
      </div>

      {/* Per-day bars */}
      <SectionLabel meta={avg ? `${avg} AVG/DAY` : ''}>DAILY CALORIES</SectionLabel>
      <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, gap: 6 }}>
          {days.map((d, i) => {
            const h = d.kcal != null ? Math.max(4, (d.kcal / max) * 100) : 0;
            const over = dayTarget > 0 && d.kcal > dayTarget;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: d.future ? C.textLow : (over ? C.danger : C.textMid) }}>{d.future ? '·' : (d.kcal ? Math.round(d.kcal / 100) / 10 + 'k' : '0')}</span>
                <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${h}%`, minHeight: d.kcal ? 4 : 0, background: d.today ? C.accent : over ? 'rgba(229,86,75,.6)' : 'rgba(242,163,15,.4)', borderRadius: '3px 3px 0 0' }} />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: d.today ? C.accent : C.textLow, letterSpacing: 0.5 }}>{d.lab}</span>
              </div>
            );
          })}
        </div>
        {dayTarget > 0 && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1, marginTop: 10, textAlign: 'center' }}>
            DAILY TARGET {dayTarget.toLocaleString()} KCAL
          </div>
        )}
      </div>

      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '16px 4px 0' }}>
        Consistency beats perfection — it's the weekly average that moves the scale, not any single day.
      </p>
    </div>
  );
}

function AlcoholRow({ nips, kcal, onAdd }) {
  return (
    <button
      onClick={onAdd}
      style={{ width: '100%', textAlign: 'left', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', cursor: 'pointer' }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 9, background: C.surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🍺</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.05 }}>Alcohol</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 0.5, marginTop: 2 }}>
          {(+nips).toFixed(nips % 1 ? 1 : 0)} nip{nips === 1 ? '' : 's'} · {kcal} kcal
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.2, background: C.accentSoft, padding: '3px 7px', borderRadius: 6 }}>+ ADD</span>
    </button>
  );
}

Object.assign(window, { NutritionTab, HEALTH_COLOR, CONF_COLOR, MealQuestionsFlow });

export { AlcoholRow, Badge, CONF_COLOR, CalRing, FoodRow, HEALTH_COLOR, MacroBar, MealQuestionsFlow, NutHeader, NutritionTab, NutritionToday, NutritionWeek, QuestionsDone };

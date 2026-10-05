import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';
import { weekStartKey } from './todo-list.jsx';

// week-three.jsx — "The Week's Three": three commitments you write down for
// the week, and (optionally) three your partner commits to, entered on the
// same phone — the partner doesn't need an account. Private to this user
// (own-rows only, no coach read, never on the family ladder). Ticking them
// off is the whole game; the card staring at you all week is the
// accountability. Weeks run Sun → Sat like everything else in the app.
//
// Storage: compound:weekThree = { [weekStart]: { partner, mine:[{t,done}],
// theirs:[{t,done}] } } — mirrored to the week_threes table by cloud-sync.

const KEY = 'compound:weekThree';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
};
const doneCount = (items) => (items || []).filter((i) => i.done).length;
const allDone = (w) => {
  const both = [...(w?.mine || []), ...(w?.theirs || [])];
  return both.length > 0 && both.every((i) => i.done);
};

// Consecutive clean-sweep weeks ending with the week before `wk`.
function sweepStreak(all, wk) {
  let n = 0; let cur = addDays(wk, -7);
  while (all[cur] && allDone(all[cur])) { n += 1; cur = addDays(cur, -7); }
  return n;
}

const mono = { fontFamily: 'JetBrains Mono, monospace' };
const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: C.surf2, color: C.text,
  border: `1px solid ${C.line}`, borderRadius: 9, padding: '9px 11px',
  fontFamily: 'Outfit, sans-serif', fontSize: 13, outline: 'none',
};

function WeekThreeCard() {
  const wk = weekStartKey();
  const [all, setAll] = React.useState(load);
  const save = (next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    setAll(next);
  };
  const cur = all[wk];
  const prev = all[addDays(wk, -7)];
  const lastSet = Object.keys(all).sort().pop();
  const [editing, setEditing] = React.useState(false);
  // Fresh week, editor not opened yet → a quiet one-line prompt, not a form.
  const [opened, setOpened] = React.useState(false);

  const toggle = (col, idx) => {
    const w = { ...cur, [col]: cur[col].map((it, i) => (i === idx ? { ...it, done: !it.done } : it)) };
    save({ ...all, [wk]: w });
  };

  const streak = sweepStreak(all, wk) + (cur && allDone(cur) ? 1 : 0);

  return (
    <div style={{ marginTop: 22 }}>
      <SectionLabel meta={streak >= 2 ? `${streak}-WEEK SWEEP 🔥` : 'YOU + YOURS'}>THE WEEK'S THREE</SectionLabel>
      <div style={{ background: C.surf1, border: `1px solid ${C.lineStrong}`, borderRadius: 16, padding: '14px 14px 16px' }}>
        {!cur && !opened ? (
          <SetPrompt prev={prev} onOpen={() => setOpened(true)} />
        ) : editing || !cur ? (
          <ThreeEditor
            initial={cur || { partner: (prev || (lastSet && all[lastSet]) || {}).partner ?? '', mine: [], theirs: [] }}
            prev={!cur ? prev : null}
            onSave={(w) => { save({ ...all, [wk]: w }); setEditing(false); }}
            onCancel={cur ? () => setEditing(false) : () => setOpened(false)}
          />
        ) : (
          <ThreeLists w={cur} onToggle={toggle} onEdit={() => setEditing(true)} />
        )}
      </div>
    </div>
  );
}

function SetPrompt({ prev, onOpen }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.4, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
          Nothing set this week
        </div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: 1.2, color: C.textMid, marginTop: 4 }}>
          {prev
            ? `LAST WEEK — YOU ${doneCount(prev.mine)}/${(prev.mine || []).length}${(prev.theirs || []).length ? ` · ${(prev.partner || 'PARTNER').toUpperCase()} ${doneCount(prev.theirs)}/${prev.theirs.length}` : ''}`
            : 'THREE COMMITMENTS, TICKED OFF BY SUNDAY'}
        </div>
      </div>
      <button
        onClick={onOpen}
        style={{ background: C.accent, border: 0, color: C.onAccent, padding: '10px 14px', borderRadius: 10, ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.3, cursor: 'pointer', flexShrink: 0 }}
      >
        SET THE THREE
      </button>
    </div>
  );
}

function ThreeLists({ w, onToggle, onEdit }) {
  const cols = [{ name: 'YOU', col: 'mine' }];
  if ((w.theirs || []).length) cols.push({ name: (w.partner || 'Partner').toUpperCase(), col: 'theirs' });
  return (
    <div>
      <div style={{ display: 'flex', gap: 14 }}>
        {cols.map(({ name, col }) => (
          <div key={col} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ ...mono, fontSize: 9, letterSpacing: 1.6, color: C.accent }}>{name}</span>
              <span style={{ ...mono, fontSize: 9, letterSpacing: 1, color: doneCount(w[col]) === w[col].length ? C.success : C.textLow }}>
                {doneCount(w[col])}/{w[col].length}
              </span>
            </div>
            {w[col].map((it, i) => (
              <button
                key={i}
                onClick={() => onToggle(col, i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', textAlign: 'left',
                  background: 'transparent', border: 0, padding: '5px 0', cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${it.done ? C.success : C.line}`,
                    background: it.done ? C.success : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {it.done && (
                    <svg width="9" height="9" viewBox="0 0 10 10"><path d="M1.5 5.5 L4 8 L8.5 2.5" stroke={C.bg} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, lineHeight: 1.35, color: it.done ? C.textLow : C.text }}>
                  {it.t}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ ...mono, fontSize: 8.5, letterSpacing: 1.2, color: C.textLow }}>RESETS SUNDAY</span>
        <button onClick={onEdit} style={{ ...mono, background: 'transparent', border: 0, color: C.textLow, fontSize: 9, letterSpacing: 1.2, cursor: 'pointer', padding: '2px 0' }}>
          EDIT
        </button>
      </div>
    </div>
  );
}

function ThreeEditor({ initial, prev, onSave, onCancel }) {
  const pad3 = (items) => [0, 1, 2].map((i) => (items && items[i] ? items[i].t : ''));
  const [partner, setPartner] = React.useState(initial.partner || '');
  const [mine, setMine] = React.useState(() => pad3(initial.mine));
  const [theirs, setTheirs] = React.useState(() => pad3(initial.theirs));
  const keep = (texts, old) => texts
    .map((t) => t.trim()).filter(Boolean)
    .map((t) => ({ t, done: !!(old || []).find((o) => o.t === t && o.done) }));

  const saveable = mine.some((t) => t.trim());
  const submit = () => {
    if (!saveable) return;
    onSave({ partner: partner.trim(), mine: keep(mine, initial.mine), theirs: partner.trim() ? keep(theirs, initial.theirs) : [] });
  };

  const colEditor = (label, vals, setVals) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 9, letterSpacing: 1.6, color: C.accent, marginBottom: 7 }}>{label}</div>
      {vals.map((v, i) => (
        <input
          key={i}
          value={v}
          onChange={(e) => setVals(vals.map((x, j) => (j === i ? e.target.value : x)))}
          placeholder={`${i + 1}.`}
          style={{ ...inputStyle, marginBottom: 6 }}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.4, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
        Three things each. Done by Sunday.
      </div>
      {prev && (
        <div style={{ ...mono, fontSize: 9, letterSpacing: 1.2, color: C.textMid, marginTop: 6 }}>
          LAST WEEK — YOU {doneCount(prev.mine)}/{(prev.mine || []).length}
          {(prev.theirs || []).length ? ` · ${(prev.partner || 'PARTNER').toUpperCase()} ${doneCount(prev.theirs)}/${prev.theirs.length}` : ''}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginBottom: 7 }}>DOING IT WITH SOMEONE? (THEY DON'T NEED THE APP)</div>
        <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Their name — or leave blank to go solo" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {colEditor('YOU', mine, setMine)}
        {partner.trim() ? colEditor(partner.trim().toUpperCase(), theirs, setTheirs) : null}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={submit}
          disabled={!saveable}
          style={{
            flex: 1, background: saveable ? C.accent : C.surf2, border: 0, color: saveable ? C.onAccent : C.textLow,
            padding: '11px 14px', borderRadius: 10, ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.4,
            cursor: saveable ? 'pointer' : 'default',
          }}
        >
          LOCK THEM IN
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.textMid, padding: '11px 14px', borderRadius: 10, ...mono, fontSize: 10, letterSpacing: 1.2, cursor: 'pointer' }}>
            CANCEL
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { WeekThreeCard });

export { WeekThreeCard };

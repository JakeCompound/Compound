import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';
import { supabase, supabaseConfigured } from './supabase.js';

// ladder.jsx — the family accountability ladder. Four boards, all resetting
// on the 1st of the month (Sydney time): OVERALL (check-ins + workouts + AFDs,
// one point each), CHECK-INS, WORKOUTS, AFDS. Data comes from the
// monthly_ladder() database function, which every signed-in member may call —
// it returns names and counts only, never anyone's actual entries. Members
// with alcohol tracking off don't appear on the AFD board.

const BOARDS = [
  { key: 'overall', label: 'OVERALL', unit: 'PTS', value: (r) => r.checkins + r.workouts + r.afds },
  { key: 'checkins', label: 'CHECK-INS', unit: '', value: (r) => r.checkins },
  { key: 'workouts', label: 'WORKOUTS', unit: '', value: (r) => r.workouts },
  { key: 'afds', label: 'AFDS', unit: '', value: (r) => r.afds },
];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function LadderCard() {
  const [rows, setRows] = React.useState(null); // null = loading / unavailable
  const [board, setBoard] = React.useState('overall');
  const [me, setMe] = React.useState(null);

  React.useEffect(() => {
    let on = true;
    (async () => {
      if (!supabaseConfigured) return;
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u || !u.user) return;
        if (on) setMe(u.user.id);
        const { data, error } = await supabase.rpc('monthly_ladder');
        if (!error && Array.isArray(data) && data.length && on) setRows(data);
      } catch (e) {}
    })();
    return () => { on = false; };
  }, []);

  if (!rows) return null; // signed out, offline, or function not there yet — say nothing

  const def = BOARDS.find((b) => b.key === board) || BOARDS[0];
  const list = rows
    .filter((r) => (board === 'afds' ? r.tracks_alcohol : true))
    .map((r) => ({ ...r, v: def.value(r), name: (r.name || 'Member').trim() }))
    .sort((a, b) => b.v - a.v || a.name.localeCompare(b.name));
  const top = list.length ? list[0].v : 0;

  return (
    <div style={{ marginTop: 22 }}>
      <SectionLabel meta={MONTHS[new Date().getMonth()]}>THE LADDER</SectionLabel>
      <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {BOARDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBoard(b.key)}
              style={{
                padding: '5px 10px', borderRadius: 7, border: 0, cursor: 'pointer',
                background: board === b.key ? C.accent : C.surf2,
                color: board === b.key ? C.onAccent : C.textMid,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: 1.2,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((r, i) => {
            const leader = i === 0 && r.v > 0;
            const mine = r.user_id === me;
            const frac = top > 0 ? r.v / top : 0;
            return (
              <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: leader ? C.accent : C.textLow }}>
                  {leader ? '◆' : i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: mine ? 800 : 600, fontSize: 15, letterSpacing: 0.8, color: leader ? C.text : C.textMid, textTransform: 'uppercase' }}>
                      {r.name}{mine ? ' · YOU' : ''}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: leader ? C.accent : C.textMid, fontVariantNumeric: 'tabular-nums' }}>
                      {r.v}{def.unit ? ` ${def.unit}` : ''}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: C.surf2, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(2, frac * 100)}%`, height: '100%', borderRadius: 2, background: leader ? C.accent : C.surf3 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1.4, color: C.textLow, marginTop: 10, textAlign: 'center' }}>
          RESETS ON THE 1ST · OVERALL = CHECK-INS + WORKOUTS + AFDS
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LadderCard });

export { LadderCard };

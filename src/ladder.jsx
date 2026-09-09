import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';
import { supabase, supabaseConfigured } from './supabase.js';

// ladder.jsx — the family accountability ladder, NRL-standings style: one
// table, one row per member, sorted by PTS (check-ins + workouts + AFDs this
// month, a point each), resetting on the 1st (Sydney time). Data comes from
// the monthly_ladder() database function — names and counts only, never
// anyone's actual entries. Members with alcohol tracking off show "–" under
// AFD. The same table goes out by email every Monday, so app and inbox match.

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function LadderCard() {
  const [rows, setRows] = React.useState(null); // null = loading / unavailable
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

  const list = rows
    .map((r) => ({ ...r, name: (r.name || 'Member').trim(), pts: r.checkins + r.workouts + r.afds }))
    .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));

  const mono = { fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' };
  const th = { ...mono, fontSize: 9, letterSpacing: 1.2, color: C.bg, padding: '9px 6px', textAlign: 'center', fontWeight: 600 };
  const num = { ...mono, fontSize: 13, color: C.text, padding: '11px 6px', textAlign: 'center' };

  return (
    <div style={{ marginTop: 22 }}>
      <SectionLabel meta={MONTHS[new Date().getMonth()]}>THE LADDER</SectionLabel>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.text }}>
              <th style={{ ...th, width: 34 }}>POS</th>
              <th style={{ ...th, textAlign: 'left' }}>MEMBER</th>
              <th style={{ ...th, width: 36 }}>CHK</th>
              <th style={{ ...th, width: 36 }}>WKT</th>
              <th style={{ ...th, width: 36 }}>AFD</th>
              <th style={{ ...th, width: 42 }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => {
              const lead = i === 0 && r.pts > 0;
              const mine = r.user_id === me;
              const rowBg = lead ? C.accentSoft : (i % 2 ? C.surf2 : C.surf1);
              const border = i < list.length - 1 ? `1px solid ${C.line}` : 'none';
              return (
                <tr key={r.user_id} style={{ background: rowBg }}>
                  <td style={{ ...num, width: 34, padding: 0, borderBottom: border, background: lead ? C.accent : 'transparent' }}>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: lead ? C.onAccent : C.textLow, display: 'block', padding: '11px 6px' }}>{i + 1}</span>
                  </td>
                  <td style={{ padding: '11px 8px', borderBottom: border }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: mine ? 800 : 700, fontSize: 15, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>
                      {r.name}
                    </span>
                    {mine && <span style={{ ...mono, fontSize: 8, letterSpacing: 1, color: C.accent, marginLeft: 6 }}>YOU</span>}
                  </td>
                  <td style={{ ...num, borderBottom: border }}>{r.checkins}</td>
                  <td style={{ ...num, borderBottom: border }}>{r.workouts}</td>
                  <td style={{ ...num, borderBottom: border, color: r.tracks_alcohol ? C.text : C.textLow }}>{r.tracks_alcohol ? r.afds : '–'}</td>
                  <td style={{ ...num, fontWeight: 700, fontSize: 14, color: C.accent, borderBottom: border }}>{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: 1.4, color: C.textLow, marginTop: 8, textAlign: 'center' }}>
        PTS = CHECK-INS + WORKOUTS + AFDS · RESETS ON THE 1ST
      </div>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: 1.4, color: C.textLow, marginTop: 4, textAlign: 'center' }}>
        POINTS COME FROM SHOWING UP — A LOGGED BIG DAY STILL SCORES
      </div>
    </div>
  );
}

Object.assign(window, { LadderCard });

export { LadderCard };

import React from 'react';
import { C } from './compound-ui.jsx';
import { supabase, supabaseConfigured } from './supabase.js';
import { computeLifeScore } from './home-data.jsx';

// coach-review.jsx — the sit-down monthly review. A coach account (a row in
// the `coaches` table; RLS gives coaches read-only SELECT on everyone's
// entries) picks a member and a window and gets the trends that matter in a
// review: weight, life score, food, drinks, training, steps. Read-only by
// design — nothing here can edit or delete a member's data.

const DAY_MS = 86400000;
const dkey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

// Is the signed-in user a coach? Resolves once per mount; RLS means the
// select simply returns nothing for non-coaches, so this can't leak.
export function useIsCoach() {
  const [isCoach, setIsCoach] = React.useState(false);
  React.useEffect(() => {
    let on = true;
    (async () => {
      if (!supabaseConfigured) return;
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u || !u.user) return;
        const { data, error } = await supabase.from('coaches').select('user_id').eq('user_id', u.user.id).maybeSingle();
        if (on && !error && data) setIsCoach(true);
      } catch (e) {}
    })();
    return () => { on = false; };
  }, []);
  return isCoach;
}

// ── Data crunching ─────────────────────────────────────────────────────────
function crunch({ weighins, checkins, food, nips, workouts, steps }, days) {
  const weeks = days / 7;

  // Weight — first vs last in window + the series for the sparkline.
  const ws = (weighins || []).map((r) => ({ date: r.date, v: Number(r.value) })).sort((a, b) => (a.date < b.date ? -1 : 1));
  const weight = ws.length
    ? { series: ws, first: ws[0].v, last: ws[ws.length - 1].v, delta: ws[ws.length - 1].v - ws[0].v, count: ws.length }
    : null;

  // Check-ins — life score per night (same formula as the home ring).
  const cs = (checkins || []).map((r) => r.data).filter((d) => d && d.metrics);
  const scores = cs.map((d) => ({ date: d.date, v: computeLifeScore(d.metrics) })).sort((a, b) => (a.date < b.date ? -1 : 1));
  const sleepVals = cs.map((d) => Number(d.answers && d.answers.sleep)).filter((v) => Number.isFinite(v) && v > 0);
  const checkin = {
    count: cs.length,
    rate: Math.round((cs.length / days) * 100),
    avgScore: scores.length ? Math.round(scores.reduce((s, x) => s + x.v, 0) / scores.length) : null,
    series: scores,
    avgSleep: sleepVals.length ? sleepVals.reduce((s, v) => s + v, 0) / sleepVals.length : null,
  };

  // Food — daily totals (kcal × servings) on the days they logged.
  const byDay = {};
  // Big Days are counted for the coach conversation only — never the ladder.
  const bigDays = new Set((food || []).filter((r) => r.kind === 'bigday').map((r) => r.date)).size;
  (food || []).forEach((r) => {
    if (r.kind === 'skipped') return; // a skip is a record, not a meal
    const servings = r.servings || 1;
    const d = (byDay[r.date] = byDay[r.date] || { kcal: 0, protein: 0, entries: 0 });
    d.kcal += (Number(r.kcal) || 0) * servings;
    d.protein += (Number(r.protein) || 0) * servings;
    d.entries += 1;
  });
  const foodDays = Object.keys(byDay).sort();
  const foodStats = {
    bigDays,
    entries: (food || []).length,
    daysLogged: foodDays.length,
    rate: Math.round((foodDays.length / days) * 100),
    avgKcal: foodDays.length ? Math.round(foodDays.reduce((s, d) => s + byDay[d].kcal, 0) / foodDays.length) : null,
    avgProtein: foodDays.length ? Math.round(foodDays.reduce((s, d) => s + byDay[d].protein, 0) / foodDays.length) : null,
    series: foodDays.map((d) => ({ date: d, v: Math.round(byDay[d].kcal) })),
  };

  // Alcohol — a day absent from nip_days counts as zero (nothing recorded).
  const nipRows = (nips || []).filter((r) => Number(r.nips) > 0);
  const totalNips = nipRows.reduce((s, r) => s + Number(r.nips), 0);
  const alcohol = {
    totalNips: Math.round(totalNips * 10) / 10,
    perWeek: Math.round((totalNips / weeks) * 10) / 10,
    drinkingDays: nipRows.length,
    afds: days - nipRows.length,
  };

  // Training — sessions, volume, duration.
  const wo = (workouts || []).map((r) => r.data).filter(Boolean);
  const training = {
    sessions: wo.length,
    perWeek: Math.round((wo.length / weeks) * 10) / 10,
    volume: Math.round(wo.reduce((s, w) => s + (Number(w.volume) || 0), 0)),
    minutes: Math.round(wo.reduce((s, w) => s + (Number(w.durationMin) || 0), 0)),
    muscles: [...new Set(wo.flatMap((w) => w.muscles || []))],
  };

  // Steps — day total = sum of that day's ledger entries (same as the app).
  const stepDays = (steps || [])
    .map((r) => ({ date: r.date, v: (Array.isArray(r.entries) ? r.entries : []).reduce((s, e) => s + (Number(e.steps) || 0), 0) }))
    .filter((d) => d.v > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const stepStats = {
    daysLogged: stepDays.length,
    avg: stepDays.length ? Math.round(stepDays.reduce((s, d) => s + d.v, 0) / stepDays.length) : null,
    series: stepDays,
  };

  return { weight, checkin, food: foodStats, alcohol, training, steps: stepStats };
}

// ── Tiny presentational bits ───────────────────────────────────────────────
function Spark({ series, color, height = 44 }) {
  if (!series || series.length < 2) return null;
  const W = 300;
  const vals = series.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * (W - 6) + 3;
    const y = height - 5 - ((p.v - min) / span) * (height - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height, display: 'block', marginTop: 10 }} preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke={color || C.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, unit, tone }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1.6, color: C.textLow }}>{label}</div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: 1.1, color: tone || C.text, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
        {value ?? '—'}
        {unit && value != null && <span style={{ fontSize: 12, color: C.textMid, marginLeft: 3 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1.4, color: C.text, textTransform: 'uppercase', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const statGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 };

// ── The screen ─────────────────────────────────────────────────────────────
export function CoachReviewScreen({ onBack }) {
  const [members, setMembers] = React.useState(null); // null = loading
  const [memberId, setMemberId] = React.useState(null);
  const [days, setDays] = React.useState(30);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [stats, setStats] = React.useState(null);

  // Everyone with a profile — the coach read policy makes them all visible.
  React.useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id, onboarding');
        if (error) throw error;
        const list = (data || [])
          .map((r) => ({ id: r.id, name: (r.onboarding && r.onboarding.name) || 'Member' }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (on) { setMembers(list); if (list.length && !memberId) setMemberId(list[0].id); }
      } catch (e) { if (on) { setMembers([]); setErr("Couldn't load members — check your connection."); } }
    })();
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!memberId) return;
    let on = true;
    (async () => {
      setLoading(true); setErr('');
      const since = dkey(new Date(Date.now() - days * DAY_MS));
      const q = (table, dateCol) => supabase.from(table).select('*').eq('user_id', memberId).gte(dateCol, since);
      try {
        const [weighins, checkins, food, nips, workouts, steps] = await Promise.all([
          q('weighins', 'date'), q('checkins', 'date'), q('food_entries', 'date'),
          q('nip_days', 'date'), q('workouts', 'date'), q('step_days', 'date'),
        ]);
        const firstErr = [weighins, checkins, food, nips, workouts, steps].find((r) => r.error);
        if (firstErr) throw firstErr.error;
        if (on) setStats(crunch({ weighins: weighins.data, checkins: checkins.data, food: food.data, nips: nips.data, workouts: workouts.data, steps: steps.data }, days));
      } catch (e) {
        if (on) { setStats(null); setErr("Couldn't load this member's data — try again."); }
      }
      if (on) setLoading(false);
    })();
    return () => { on = false; };
  }, [memberId, days]);

  const chip = (active) => ({
    padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
    background: active ? C.accent : C.surf1,
    color: active ? C.onAccent : C.textMid,
    border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase',
  });

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>BACK</span>
        </button>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>MONTHLY REVIEW</div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        {/* Member picker */}
        {members === null && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid }}>Loading members…</div>}
        {members && members.length === 0 && !err && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid }}>No members visible.</div>}
        {members && members.length > 0 && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {members.map((m) => (
                <button key={m.id} onClick={() => setMemberId(m.id)} style={chip(m.id === memberId)}>{m.name}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[30, 60, 90].map((n) => (
                <button key={n} onClick={() => setDays(n)} style={chip(n === days)}>{n} days</button>
              ))}
            </div>
          </>
        )}

        {err && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.danger, marginTop: 14 }}>{err}</div>}
        {loading && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginTop: 16 }}>LOADING…</div>}

        {stats && !loading && (
          <div style={{ marginTop: 16 }}>
            <Card title="Weight">
              {stats.weight ? (
                <>
                  <div style={statGrid}>
                    <Stat label="LATEST" value={stats.weight.last} unit="kg" />
                    <Stat
                      label="CHANGE"
                      value={`${stats.weight.delta > 0 ? '+' : ''}${Math.round(stats.weight.delta * 10) / 10}`}
                      unit="kg"
                      tone={stats.weight.delta <= 0 ? C.accent : C.danger}
                    />
                    <Stat label="WEIGH-INS" value={stats.weight.count} />
                  </div>
                  <Spark series={stats.weight.series} />
                </>
              ) : <Empty what="weigh-ins" />}
            </Card>

            <Card title="Life score">
              {stats.checkin.count ? (
                <>
                  <div style={statGrid}>
                    <Stat label="AVG SCORE" value={stats.checkin.avgScore} />
                    <Stat label="CHECK-IN RATE" value={`${stats.checkin.rate}%`} />
                    <Stat label="AVG SLEEP" value={stats.checkin.avgSleep != null ? Math.round(stats.checkin.avgSleep * 10) / 10 : null} unit="h" />
                  </div>
                  <Spark series={stats.checkin.series} />
                </>
              ) : <Empty what="check-ins" />}
            </Card>

            <Card title="Food">
              {stats.food.daysLogged ? (
                <>
                  <div style={statGrid}>
                    <Stat label="AVG INTAKE" value={stats.food.avgKcal} unit="kcal" />
                    <Stat label="AVG PROTEIN" value={stats.food.avgProtein} unit="g" />
                    <Stat label="DAYS LOGGED" value={`${stats.food.daysLogged} · ${stats.food.rate}%`} />
                  </div>
                  {stats.food.bigDays > 0 && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.2, color: C.textLow, marginTop: 8 }}>
                      {stats.food.bigDays} BIG DAY{stats.food.bigDays === 1 ? '' : 'S'} LOGGED — HONESTY, NOT FAILURE
                    </div>
                  )}
                  <Spark series={stats.food.series} />
                </>
              ) : <Empty what="meals" />}
            </Card>

            <Card title="Drinks">
              <div style={statGrid}>
                <Stat label="NIPS / WEEK" value={stats.alcohol.perWeek} />
                <Stat label="TOTAL NIPS" value={stats.alcohol.totalNips} />
                <Stat label="ALCOHOL-FREE DAYS" value={stats.alcohol.afds} tone={C.accent} />
              </div>
            </Card>

            <Card title="Training">
              {stats.training.sessions ? (
                <>
                  <div style={statGrid}>
                    <Stat label="SESSIONS / WK" value={stats.training.perWeek} />
                    <Stat label="TOTAL VOLUME" value={stats.training.volume.toLocaleString()} unit="kg" />
                    <Stat label="MINUTES" value={stats.training.minutes} />
                  </div>
                  {stats.training.muscles.length > 0 && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.2, color: C.textLow, marginTop: 10 }}>
                      {stats.training.muscles.join(' · ').toUpperCase()}
                    </div>
                  )}
                </>
              ) : <Empty what="workouts" />}
            </Card>

            <Card title="Steps">
              {stats.steps.daysLogged ? (
                <>
                  <div style={statGrid}>
                    <Stat label="AVG / DAY" value={stats.steps.avg != null ? stats.steps.avg.toLocaleString() : null} />
                    <Stat label="DAYS LOGGED" value={stats.steps.daysLogged} />
                    <div />
                  </div>
                  <Spark series={stats.steps.series} />
                </>
              ) : <Empty what="steps" />}
            </Card>

            <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.6, color: C.textLow, marginTop: 14 }}>
              READ-ONLY · LAST {days} DAYS
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ what }) {
  return <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textLow }}>No {what} in this window.</div>;
}

Object.assign(window, { CoachReviewScreen, useIsCoach });

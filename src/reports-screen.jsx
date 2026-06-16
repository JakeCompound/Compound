import React from 'react';
import { BadgesWall } from './badges.jsx';
import { BodyMeasurementsCard, ProgressPhotosCard } from './body-progress.jsx';
import { C } from './compound-ui.jsx';
import { InsightCard, LifeBalanceRadar, SectionLabel, StreakCard } from './home-components.jsx';
import { computeCorrelations, computeMonthCard, computeReports } from './reports-data.jsx';

// reports-screen.jsx — Reports tab, fully derived from real check-in history.

const TIMEFRAMES = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

function ReportsEmpty({ label }) {
  return (
    <div style={{ background: C.surf1, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.6, marginBottom: 6 }}>
        NO DATA YET
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
        {label}
      </div>
    </div>
  );
}

function ReportsScreen({ user = {} }) {
  const [tf, setTf] = React.useState('30d');
  const [openInsight, setOpenInsight] = React.useState(null);
  const days = tf === '7d' ? 7 : tf === '30d' ? 30 : 90;

  const history = window.loadCheckins ? window.loadCheckins() : [];
  const R = computeReports(history, user, days);
  const monthCard = computeMonthCard(history, user);
  const corr = computeCorrelations(history);
  const weighins = (window.loadWeighins ? window.loadWeighins() : []);

  // Streaks + week strip + insight (moved here from Home)
  const streaks = window.computeStreaks ? window.computeStreaks(history) : { checkin:{current:0,best:0,next:3}, workout:{current:0,best:0,next:3}, spirit:{current:0,best:0,next:3}, afd:{current:0,best:0,next:3} };
  const weekDays = window.buildWeek ? window.buildWeek(history) : [];
  const insight = (window.deriveLiveState ? window.deriveLiveState(user, history).insight : null);

  const pillarValue = (p, suffix, k) => {
    if (!p.mean) return '—';
    if (k === 'steps') return `${(p.mean / 1000).toFixed(1)}k`;
    return `${p.mean.toFixed(1)}${suffix === 'h' ? 'h' : ''}`;
  };

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', padding: '14px 22px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2.4, color: C.textLow }}>
            TAB · REPORTS
          </div>
          <h1
            style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30,
              lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: '6px 0 0', textTransform: 'uppercase',
            }}
          >
            THE <span style={{ color: C.accent }}>RECEIPTS.</span>
          </h1>
        </div>
      </div>

      {/* Timeframe toggle */}
      <div style={{ marginTop: 18, display: 'flex', gap: 4, padding: 4, background: C.surf1, borderRadius: 10, border: `1px solid ${C.line}` }}>
        {TIMEFRAMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTf(t.key)}
            style={{
              flex: 1, padding: '8px 0',
              background: tf === t.key ? C.accent : 'transparent',
              border: 0, borderRadius: 8,
              color: tf === t.key ? '#0A0A0C' : C.textMid,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              letterSpacing: 1.5, cursor: 'pointer',
              transition: 'background .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {R.empty ? (
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              padding: '26px 18px', textAlign: 'center',
              background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
              border: `1px solid ${C.line}`, borderRadius: 16,
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.5, marginBottom: 10 }}>
              NOTHING TO SHOW — YET
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: C.text, textTransform: 'uppercase', lineHeight: 1, marginBottom: 10, letterSpacing: 0.5 }}>
              YOUR RECEIPTS<br /><span style={{ color: C.accent }}>BUILD FROM CHECK-INS.</span>
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, lineHeight: 1.5, margin: '0 auto', maxWidth: 280 }}>
              No fabricated charts here. Complete your nightly check-ins and this fills with your real trends, streaks, and correlations.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Streaks (moved from Home) */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta={`${Math.max(streaks.checkin.current, streaks.workout.current, streaks.spirit.current, streaks.afd.current)} BEST`}>
              STREAKS
            </SectionLabel>
            <div
              style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                marginLeft: -22, marginRight: -22, paddingLeft: 22, paddingRight: 22, paddingBottom: 6,
              }}
            >
              <StreakCard glyph="🔥" label="CHECK-INS" {...streaks.checkin} hot={streaks.checkin.current >= 7} />
              <StreakCard glyph="💪" label="WORKOUTS" {...streaks.workout} hot={streaks.workout.current >= 7} />
              <StreakCard glyph="📖" label="SPIRIT" {...streaks.spirit} hot={streaks.spirit.current >= 7} />
              <StreakCard glyph="🚫" label="ALCOHOL FREE" {...streaks.afd} hot={streaks.afd.current >= 7} />
            </div>
          </div>

          {/* This week strip lives on Home now */}

          {/* AI Insight (moved from Home) */}
          {insight && (
            <div style={{ marginTop: 22 }}>
              <InsightCard insight={insight} />
            </div>
          )}

          {/* Radar */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta={`${tf.toUpperCase()} AVG · ${R.logged} LOGGED`}>LIFE BALANCE</SectionLabel>
            <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '18px 10px' }}>
              <LifeBalanceRadar values={R.radar} size={250} />
            </div>
          </div>

          {/* Pillar trends grid */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta={`${days}D`}>PILLAR TRENDS</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <PillarCard label="SLEEP" value={pillarValue(R.pillars.sleep, 'h', 'sleep')} avgLabel="AVG" trend={R.pillars.sleep} color={C.accent} />
              <PillarCard label="CALM" value={pillarValue(R.pillars.calm, '', 'calm')} avgLabel="/5" trend={R.pillars.calm} color="#7CA8E0" />
              <PillarCard label="DIET" value={pillarValue(R.pillars.diet, '', 'diet')} avgLabel="/5" trend={R.pillars.diet} color="#7BB661" />
              <PillarCard label="STEPS" value={pillarValue(R.pillars.steps, '', 'steps')} avgLabel="AVG" trend={R.pillars.steps} color="#F2A30F" />
            </div>
          </div>

          {/* Spirit habit dots */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta={`${R.spirit.days}/${R.spirit.total} DAYS`}>SPIRITUAL READING</SectionLabel>
            <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              <HabitGrid points={R.spirit.points} />
            </div>
          </div>

          {/* AFD chart */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta={`${R.afdWeeks.length} WK`}>ALCOHOL · AFDS + NIPS</SectionLabel>
            {R.afdWeeks.length ? (
              <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
                <AfdChart data={R.afdWeeks} />
              </div>
            ) : <ReportsEmpty label="Log a few check-ins and your alcohol-free days plot here, week by week." />}
          </div>

          {/* Weight trend */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta="FRIDAYS">WEIGHT TREND</SectionLabel>
            {weighins.length >= 2 ? (
              <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
                <WeightChart data={weighins.map((w, i) => ({ week: `W${i + 1}`, value: w.value }))} />
              </div>
            ) : (
              <ReportsEmpty label={`Your Friday weigh-ins build this trend. Starting point: ${user.weight || '—'}kg → goal ${user.weightGoal || '—'}kg.`} />
            )}
          </div>

          {/* Body measurements */}
          <div style={{ marginTop: 22 }}>
            <BodyMeasurementsCard />
          </div>

          {/* Progress photos */}
          <div style={{ marginTop: 22 }}>
            <ProgressPhotosCard />
          </div>

          {/* Monthly Report Card */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta="REPORT CARD">{monthCard.month}</SectionLabel>
            {monthCard.empty ? (
              <ReportsEmpty label="Your monthly report card grades itself once you've logged check-ins this month." />
            ) : <MonthlyCard card={monthCard} />}
          </div>

          {/* Correlation insights */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel meta="FROM YOUR DATA">CORRELATIONS</SectionLabel>
            {!corr.ready ? (
              <ReportsEmpty label={`Correlations unlock once you've logged about two weeks of check-ins — ${corr.need} more to go.`} />
            ) : corr.insights.length === 0 ? (
              <ReportsEmpty label="No strong patterns yet — keep logging and they'll surface as the data grows." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {corr.insights.map((it, i) => (
                  <InsightAccordion key={i} insight={it} open={openInsight === i} onToggle={() => setOpenInsight(openInsight === i ? null : i)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Badges wall — always available (achievement catalogue) */}
      <div style={{ marginTop: 22 }}>
        <BadgesWall />
      </div>
    </div>
  );
}

// ── Pillar trend card ────────────────────────────────────────────────────
function PillarCard({ label, value, avgLabel, trend, color }) {
  return (
    <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 22, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.2 }}>
          {avgLabel}
        </span>
      </div>
      {trend.points && trend.points.length >= 2 ? (
        <Sparkline points={trend.points} lo={trend.lo} hi={trend.hi} color={color} />
      ) : (
        <div style={{ height: 32, marginTop: 8, display: 'flex', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.textLow, letterSpacing: 1 }}>
          {trend.points && trend.points.length === 1 ? '1 ENTRY · NEED MORE' : 'NO DATA YET'}
        </div>
      )}
    </div>
  );
}

function Sparkline({ points, lo, hi, color }) {
  const w = 120, h = 32;
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const range = Math.max(0.01, max - min);
  const xy = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p.value - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = xy.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 32, marginTop: 8, overflow: 'visible' }} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

function HabitGrid({ points }) {
  const cols = 15;
  const rows = Math.ceil(points.length / cols);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 4,
      }}
    >
      {points.map((p, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            background: p.value ? C.accent : 'rgba(255,255,255,.06)',
            borderRadius: 3,
            opacity: p.value ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ── AFD bar chart ───────────────────────────────────────────────────────
function AfdChart({ data }) {
  const maxAfd = 7;
  const maxNips = Math.max(...data.map((d) => d.nips), 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 8, marginBottom: 12 }}>
        {data.map((d) => (
          <div key={d.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent }}>
              {d.afdCount}
            </span>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '70%' }}>
              <div
                style={{
                  height: `${(d.afdCount / maxAfd) * 100}%`,
                  background: C.accent,
                  borderRadius: '3px 3px 0 0',
                  minHeight: 4,
                }}
              />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow }}>
              {d.week}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.4, marginBottom: 6 }}>
        NIPS CONSUMED
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 36, gap: 8 }}>
        {data.map((d) => (
          <div key={d.week + '-n'} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div
              style={{
                height: `${(d.nips / maxNips) * 100}%`,
                background: 'rgba(229,86,75,.65)',
                borderRadius: '0 0 3px 3px',
                minHeight: d.nips ? 4 : 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weight chart ────────────────────────────────────────────────────────
function WeightChart({ data }) {
  const w = 320, h = 100;
  const min = Math.min(...data.map((d) => d.value)) - 0.3;
  const max = Math.max(...data.map((d) => d.value)) + 0.3;
  const range = Math.max(0.5, max - min);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.value - min) / range) * h;
    return [x, y, d];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  const last = data[data.length - 1];
  const first = data[0];
  const delta = (last.value - first.value).toFixed(1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 26, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
            {last.value}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.textMid, marginLeft: 4 }}>KG</span>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1,
            color: delta < 0 ? C.success : delta > 0 ? C.danger : C.textMid,
          }}
        >
          {delta > 0 ? '+' : ''}{delta} KG · 12W
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 100 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(242,163,15,.25)" />
            <stop offset="100%" stopColor="rgba(242,163,15,0)" />
          </linearGradient>
        </defs>
        {/* Subtle gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,.05)" strokeDasharray="2 4" />
        ))}
        <path d={areaPath} fill="url(#weightArea)" />
        <path d={path} fill="none" stroke="#F2A30F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 1.5} fill={i === pts.length - 1 ? '#F2A30F' : 'rgba(242,163,15,.5)'} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.2, marginTop: 4 }}>
        <span>{first.week} · {first.value}KG</span>
        <span>{last.week} · {last.value}KG</span>
      </div>
    </div>
  );
}

// ── Monthly Report Card ─────────────────────────────────────────────────
function MonthlyCard({ card }) {
  const grade = (() => {
    const checkinRate = card.checkinsCompleted / card.checkinsTarget;
    const workoutRate = card.workoutsCompleted / card.workoutsTarget;
    const score = (checkinRate * 0.4 + workoutRate * 0.4 + (card.spiritDays / 30) * 0.2) * 100;
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    return 'D';
  })();

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
        border: `1px solid ${C.line}`, borderRadius: 14,
        padding: 18, position: 'relative', overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -30, top: -30, width: 140, height: 140,
          background: 'radial-gradient(circle, rgba(242,163,15,.22), transparent 65%)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 4 }}>
            REPORT CARD
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase' }}>
            {card.month}
          </div>
        </div>
        <div
          style={{
            width: 60, height: 60, borderRadius: 14,
            background: C.accent, color: '#0A0A0C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(242,163,15,.3)',
          }}
        >
          {grade}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, position: 'relative' }}>
        <CardStat label="CHECK-INS" value={`${card.checkinsCompleted}/${card.checkinsTarget}`} />
        <CardStat label="WORKOUTS" value={`${card.workoutsCompleted}/${card.workoutsTarget}`} />
        <CardStat label="AFDs" value={`${card.afdsCompleted}`} />
        <CardStat label="PB HITS" value={`${card.prsHit}`} highlight />
        <CardStat label="AVG CALM" value={`${card.avgCalm}/5`} />
        <CardStat label="AVG DIET" value={`${card.avgDiet}/5`} />
      </div>

      <button
        style={{
          marginTop: 16, width: '100%', padding: '10px 0',
          background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10,
          color: C.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.5,
          cursor: 'pointer', position: 'relative',
        }}
      >
        SHARE REPORT →
      </button>
    </div>
  );
}

function CardStat({ label, value, highlight }) {
  return (
    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,.25)', borderRadius: 10, border: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.6 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 20,
          color: highlight ? C.accent : C.text, marginTop: 2, fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Insight accordion ───────────────────────────────────────────────────
function InsightAccordion({ insight, open, onToggle }) {
  return (
    <div
      style={{
        background: open ? C.surf2 : C.surf1,
        border: `1px solid ${open ? C.accentDim : C.line}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all .2s',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left',
          background: 'transparent', border: 0, padding: '14px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: C.accent, flexShrink: 0, marginTop: 5 }}>
          <path d="M2 4.5 L5 7.5 L8 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transformOrigin: '5px 5.5px', transition: 'transform .2s' }} />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 1.8, marginBottom: 4 }}>
            {insight.tag}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase' }}>
            {insight.headline}
          </div>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px 38px' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.55, margin: 0 }}>
            {insight.body}
          </p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ReportsScreen });

export { AfdChart, CardStat, HabitGrid, InsightAccordion, MonthlyCard, PillarCard, ReportsEmpty, ReportsScreen, Sparkline, TIMEFRAMES, WeightChart };

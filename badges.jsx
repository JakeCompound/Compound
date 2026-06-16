// badges.jsx — Achievements / badges wall for Reports tab

// Each badge: id, label, desc, category, glyph, earned (bool), earnedDate, progress optional
// Glyphs are inline SVGs — geometric, brand-aligned.

const BADGE_GLYPHS = {
  flame: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 3 C10 7 6 8 6 13 C6 17 9 21 12 21 C15 21 18 17 18 13 C18 11 16.5 10 16 9 C15 11 14 11 14 9 C14 6 13 4 12 3 Z" fill="currentColor" /></svg>,
  dumbbell: <svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" /><rect x="20" y="9" width="3" height="6" rx="1" fill="currentColor" /><rect x="4.5" y="7" width="3.5" height="10" rx="1" fill="currentColor" /><rect x="16" y="7" width="3.5" height="10" rx="1" fill="currentColor" /><rect x="8" y="10.5" width="8" height="3" fill="currentColor" /></svg>,
  mountain: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2 20 L9 8 L13 14 L17 10 L22 20 Z" fill="currentColor" /></svg>,
  star: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L14.7 9 L22 9.5 L16.4 14.3 L18.2 21 L12 17.2 L5.8 21 L7.6 14.3 L2 9.5 L9.3 9 Z" fill="currentColor" /></svg>,
  crown: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3 18 L4 8 L9 12 L12 6 L15 12 L20 8 L21 18 Z" fill="currentColor" /><rect x="3" y="18" width="18" height="3" fill="currentColor" /></svg>,
  shield: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L20 5 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V5 Z" fill="currentColor" /></svg>,
  moon: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M20 14 C19 18 15 21 11 21 C7 21 3 17 3 12 C3 8 6 4 10 3 C9 7 9 11 12 14 C14 16 17 16 20 14 Z" fill="currentColor" /></svg>,
  sun: <svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="5" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="5" y1="5" x2="7" y2="7" /><line x1="17" y1="17" x2="19" y2="19" /><line x1="5" y1="19" x2="7" y2="17" /><line x1="17" y1="7" x2="19" y2="5" /></g></svg>,
  heart: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21 C10 19 3 14 3 9 C3 6 5 4 7.5 4 C9 4 11 5 12 7 C13 5 15 4 16.5 4 C19 4 21 6 21 9 C21 14 14 19 12 21 Z" fill="currentColor" /></svg>,
  book: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 4 L4 20 L11 19 L11 5 Z" fill="currentColor" /><path d="M20 4 L20 20 L13 19 L13 5 Z" fill="currentColor" /></svg>,
  cake: <svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="11" width="18" height="9" rx="2" fill="currentColor" /><path d="M3 14 Q7 12 12 14 Q17 16 21 14" stroke="currentColor" strokeWidth="1.4" fill="none" /><rect x="11" y="5" width="2" height="5" fill="currentColor" /><path d="M12 3 L13 5 L12 6 L11 5 Z" fill="currentColor" /></svg>,
  trophy: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M7 4 H17 V10 C17 13 15 15 12 15 C9 15 7 13 7 10 Z" fill="currentColor" /><rect x="10" y="15" width="4" height="4" fill="currentColor" /><rect x="7" y="19" width="10" height="2" fill="currentColor" /><path d="M7 6 L3 6 L4 11 L7 11" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M17 6 L21 6 L20 11 L17 11" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>,
  bolt: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M13 2 L4 14 L11 14 L9 22 L20 9 L13 9 Z" fill="currentColor" /></svg>,
  calendar: <svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor" /><rect x="3" y="5" width="18" height="5" fill="rgba(0,0,0,.3)" /><rect x="7" y="3" width="2" height="4" rx="1" fill="currentColor" /><rect x="15" y="3" width="2" height="4" rx="1" fill="currentColor" /></svg>,
  noDrink: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M7 3 H17 L15 14 C15 16 14 17 12 17 C10 17 9 16 9 14 Z" fill="currentColor" /><rect x="11" y="17" width="2" height="4" fill="currentColor" /><rect x="7" y="20" width="10" height="2" fill="currentColor" /><line x1="3" y1="3" x2="21" y2="21" stroke="#0A0A0C" strokeWidth="3" strokeLinecap="round" /><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  pulse: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2 12 L7 12 L9 6 L13 18 L15 12 L22 12" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  scales: <svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="6" width="16" height="14" rx="2" fill="currentColor" /><rect x="9" y="9" width="6" height="3" rx="1" fill="#0A0A0C" /><circle cx="12" cy="4" r="1.5" fill="currentColor" /></svg>,
  diamond: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="currentColor" /></svg>,
  hexagon: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" fill="currentColor" /></svg>,
  sparkle: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" fill="currentColor" /></svg>,
  arrowUp: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 4 L20 12 L15 12 L15 20 L9 20 L9 12 L4 12 Z" fill="currentColor" /></svg>,
  target: <svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="10" fill="currentColor" /><circle cx="12" cy="12" r="6" fill="#0A0A0C" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>,
  feather: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 20 L4 21 M5 20 L11 14 M5 20 L17 9 C19 7 19 4 17 3 C13 3 9 7 7 11 L5 20 Z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" strokeLinejoin="round" /></svg>,
  rocket: <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C16 4 18 9 18 14 L18 17 L6 17 L6 14 C6 9 8 4 12 2 Z" fill="currentColor" /><circle cx="12" cy="10" r="2" fill="#0A0A0C" /><path d="M6 17 L4 21 L8 19 M18 17 L20 21 L16 19" fill="currentColor" /></svg>,
};

// Badge catalog — earned/locked status decided per demo state
const BADGES = [
  // CONSISTENCY ────────────────────────────────────
  { id: 'first-checkin',  label: 'FIRST LIGHT',        desc: 'Logged your first check-in.',           cat: 'CONSISTENCY', glyph: 'sparkle',  earned: true,  earnedDate: '12 APR 2026' },
  { id: 'checkin-7',      label: 'WEEK ONE',           desc: '7-day check-in streak.',                cat: 'CONSISTENCY', glyph: 'flame',    earned: true,  earnedDate: '19 APR 2026', tier: '7D' },
  { id: 'checkin-14',     label: 'FORTNIGHT',          desc: '14-day check-in streak.',               cat: 'CONSISTENCY', glyph: 'flame',    earned: true,  earnedDate: '26 APR 2026', tier: '14D' },
  { id: 'checkin-30',     label: 'MONTH IN',           desc: '30 days of check-ins, no gaps.',        cat: 'CONSISTENCY', glyph: 'flame',    earned: false, progress: { current: 27, target: 30 }, tier: '30D' },
  { id: 'checkin-100',    label: 'CENTURION',          desc: '100-day check-in streak.',              cat: 'CONSISTENCY', glyph: 'flame',    earned: false, progress: { current: 27, target: 100 }, tier: '100D' },
  { id: 'checkin-365',    label: 'A FULL YEAR',        desc: '365 days of showing up.',               cat: 'CONSISTENCY', glyph: 'crown',    earned: false, tier: '365D' },
  { id: 'perfect-week',   label: 'PERFECT WEEK',       desc: 'All check-ins, all workouts, all AFDs.', cat: 'CONSISTENCY', glyph: 'hexagon', earned: true,  earnedDate: '20 APR 2026' },
  { id: 'perfect-month',  label: 'PERFECT MONTH',      desc: 'Four perfect weeks in a row.',          cat: 'CONSISTENCY', glyph: 'diamond',  earned: false, progress: { current: 1, target: 4 } },

  // STRENGTH ────────────────────────────────────────
  { id: 'first-workout',  label: 'FIRST REP',          desc: 'Logged your first workout.',            cat: 'STRENGTH',    glyph: 'dumbbell', earned: true,  earnedDate: '13 APR 2026' },
  { id: 'first-pb',       label: 'FIRST PB',           desc: 'Set your first personal record.',       cat: 'STRENGTH',    glyph: 'star',     earned: true,  earnedDate: '17 APR 2026' },
  { id: 'bench-bw',       label: 'BENCH BODYWEIGHT',   desc: 'Bench pressed your bodyweight.',        cat: 'STRENGTH',    glyph: 'arrowUp',  earned: true,  earnedDate: '02 MAY 2026' },
  { id: 'squat-100',      label: '100KG SQUAT',        desc: 'Estimated 1RM squat hit 100kg.',        cat: 'STRENGTH',    glyph: 'mountain', earned: true,  earnedDate: '12 MAY 2026' },
  { id: 'bench-100',      label: '100KG BENCH',        desc: 'Estimated 1RM bench hit 100kg.',        cat: 'STRENGTH',    glyph: 'mountain', earned: false, progress: { current: 87, target: 100, unit: 'kg' } },
  { id: 'pullup-1',       label: 'FIRST PULL-UP',      desc: 'Logged your first bodyweight pull-up.', cat: 'STRENGTH',    glyph: 'arrowUp',  earned: false },
  { id: 'pullup-10',      label: 'TEN PULL-UPS',       desc: 'Unbroken set of 10 pull-ups.',          cat: 'STRENGTH',    glyph: 'pulse',    earned: false },
  { id: 'pb-3lifts',      label: 'TRIPLE THREAT',      desc: 'PBs on 3 different lifts in one month.', cat: 'STRENGTH',   glyph: 'sparkle',  earned: true,  earnedDate: '22 MAY 2026' },
  { id: 'pb-allsix',      label: 'GRAND SLAM',         desc: 'Hit a PB on all six tracked lifts.',    cat: 'STRENGTH',    glyph: 'crown',    earned: false, progress: { current: 4, target: 6 } },

  // DISCIPLINE ─────────────────────────────────────
  { id: 'workout-7',      label: 'SEVEN STRONG',       desc: '7 workouts logged.',                    cat: 'DISCIPLINE',  glyph: 'dumbbell', earned: true,  earnedDate: '24 APR 2026', tier: '7' },
  { id: 'workout-25',     label: 'TWENTY-FIVE',        desc: '25 workouts logged.',                   cat: 'DISCIPLINE',  glyph: 'dumbbell', earned: true,  earnedDate: '15 MAY 2026', tier: '25' },
  { id: 'workout-50',     label: 'HALF A HUNDRED',     desc: '50 workouts logged.',                   cat: 'DISCIPLINE',  glyph: 'dumbbell', earned: false, progress: { current: 32, target: 50 }, tier: '50' },
  { id: 'workout-100',    label: 'CENTURY',            desc: '100 workouts logged.',                  cat: 'DISCIPLINE',  glyph: 'trophy',   earned: false, progress: { current: 32, target: 100 }, tier: '100' },
  { id: 'volume-10t',     label: 'TEN TONNES',         desc: 'Total volume passed 10,000kg.',         cat: 'DISCIPLINE',  glyph: 'rocket',   earned: true,  earnedDate: '08 MAY 2026' },
  { id: 'volume-100t',    label: 'A HUNDRED TONNES',   desc: 'Total volume passed 100,000kg.',        cat: 'DISCIPLINE',  glyph: 'rocket',   earned: false, progress: { current: 38, target: 100, unit: 't' } },
  { id: 'streak-target',  label: 'TARGET HIT',         desc: 'Hit weekly workout target 4 weeks straight.', cat: 'DISCIPLINE', glyph: 'target', earned: true, earnedDate: '17 MAY 2026' },
  { id: 'early-bird',     label: 'EARLY BIRD',         desc: 'Logged a workout before 6 AM.',         cat: 'DISCIPLINE',  glyph: 'sun',      earned: false },
  { id: 'night-owl',      label: 'NIGHT OWL',          desc: 'Logged a workout after 9 PM.',          cat: 'DISCIPLINE',  glyph: 'moon',     earned: true,  earnedDate: '03 MAY 2026' },

  // MIND & BODY ────────────────────────────────────
  { id: 'afd-7',          label: 'DRY WEEK',           desc: '7 alcohol-free days in a row.',         cat: 'MIND',        glyph: 'noDrink',  earned: true,  earnedDate: '21 APR 2026', tier: '7D' },
  { id: 'afd-30',         label: 'DRY MONTH',          desc: '30 alcohol-free days in a row.',        cat: 'MIND',        glyph: 'noDrink',  earned: false, progress: { current: 12, target: 30 }, tier: '30D' },
  { id: 'afd-90',         label: 'DRY QUARTER',        desc: '90 alcohol-free days. Major.',          cat: 'MIND',        glyph: 'shield',   earned: false, tier: '90D' },
  { id: 'calm-4',         label: 'STEADY HAND',        desc: 'Calm rating averaged 4+ for a week.',   cat: 'MIND',        glyph: 'feather',  earned: true,  earnedDate: '10 MAY 2026' },
  { id: 'spirit-7',       label: 'WEEK OF QUIET',      desc: '7 straight days of spiritual reading.', cat: 'MIND',        glyph: 'book',     earned: true,  earnedDate: '15 MAY 2026', tier: '7D' },
  { id: 'spirit-30',      label: 'MONTH OF QUIET',     desc: '30 straight days of spiritual reading.', cat: 'MIND',       glyph: 'book',     earned: false, progress: { current: 9, target: 30 }, tier: '30D' },
  { id: 'sleep-8',        label: 'WELL RESTED',        desc: 'Sleep averaged 8+ hours for a week.',   cat: 'MIND',        glyph: 'moon',     earned: false, progress: { current: 7.2, target: 8, unit: 'h' } },
  { id: 'partner-30',     label: 'PRESENT',            desc: '30 quality time days with partner.',    cat: 'MIND',        glyph: 'heart',    earned: true,  earnedDate: '18 MAY 2026' },

  // SPECIAL ────────────────────────────────────────
  { id: 'gratitude-20',   label: 'DEEP WELL',          desc: 'Built a gratitude library of 20+ items.', cat: 'SPECIAL',   glyph: 'sparkle',  earned: true,  earnedDate: '12 APR 2026' },
  { id: 'comeback',       label: 'COMEBACK',           desc: 'Returned to logging after 3+ missed days.', cat: 'SPECIAL', glyph: 'bolt',     earned: false },
  { id: 'birthday',       label: 'ANOTHER ORBIT',      desc: 'Logged on your birthday.',              cat: 'SPECIAL',     glyph: 'cake',     earned: false },
  { id: 'weigh-12',       label: 'TWELVE FRIDAYS',     desc: '12 consecutive Friday weigh-ins.',      cat: 'SPECIAL',     glyph: 'scales',   earned: false, progress: { current: 8, target: 12 } },
];

const BADGE_CATEGORIES = ['ALL', 'CONSISTENCY', 'STRENGTH', 'DISCIPLINE', 'MIND', 'SPECIAL'];

// Build a real context from the user's actual stores.
function buildBadgeContext() {
  let checkins = [], workouts = [], weighins = [], onboarding = {};
  try { checkins = window.loadCheckins ? window.loadCheckins() : []; } catch (e) {}
  try { workouts = window.loadWorkouts ? window.loadWorkouts() : []; } catch (e) {}
  try { weighins = window.loadWeighins ? window.loadWeighins() : []; } catch (e) {}
  try { onboarding = JSON.parse(localStorage.getItem('compound:onboarding') || '{}'); } catch (e) {}
  const streaks = window.computeStreaks ? window.computeStreaks(checkins) : { checkin:{current:0}, afd:{current:0}, spirit:{current:0} };
  const last7 = checkins.slice(-7);
  const avg = (a) => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
  const calm7 = avg(last7.map(h=>h.answers.calmRating).filter(v=>v>0));
  const sleep7 = avg(last7.map(h=>h.answers.sleep).filter(v=>typeof v==='number'));
  const totalVolume = workouts.reduce((s,w)=>s+(w.volume||0),0);
  const best = window.allTimeBest1RM ? window.allTimeBest1RM(workouts) : {};
  const pbLifts = Object.keys(best).length;
  const partnerDays = checkins.filter(h=>h.answers.partnerTime).length;
  const earlyBird = workouts.some(w => { const h = new Date(w.ts).getHours(); return h < 6; });
  const nightOwl = workouts.some(w => { const h = new Date(w.ts).getHours(); return h >= 21; });
  const pullupLogged = workouts.some(w => w.exercises.some(e => (e.exId==='pullup' || e.exId==='chinup') && e.sets.some(s=>s.complete)));
  return {
    checkins: checkins.length, checkinStreak: streaks.checkin.current,
    afdStreak: streaks.afd.current, spiritStreak: streaks.spirit.current,
    calm7, sleep7, workouts: workouts.length, totalVolume,
    best, pbLifts, partnerDays, weighins: weighins.length,
    gratitude: (onboarding.gratitude||[]).length,
    bodyweight: onboarding.weight || 999,
    earlyBird, nightOwl, pullupLogged,
  };
}

// Returns {earned, progress?} for a badge id given real context. Unknown → locked.
function evaluateBadge(id, c) {
  const done = (cur, tgt, unit) => cur >= tgt ? { earned: true } : { earned: false, progress: { current: +(+cur).toFixed(1), target: tgt, unit } };
  switch (id) {
    case 'first-checkin': return { earned: c.checkins >= 1 };
    case 'checkin-7':   return done(c.checkinStreak, 7);
    case 'checkin-14':  return done(c.checkinStreak, 14);
    case 'checkin-30':  return done(c.checkinStreak, 30);
    case 'checkin-100': return done(c.checkinStreak, 100);
    case 'checkin-365': return done(c.checkinStreak, 365);
    case 'first-workout': return { earned: c.workouts >= 1 };
    case 'first-pb':    return { earned: c.pbLifts >= 1 };
    case 'bench-bw':    return c.best.bench ? { earned: c.best.bench >= c.bodyweight } : { earned: false };
    case 'squat-100':   return done(c.best.squat || 0, 100, 'kg');
    case 'bench-100':   return done(c.best.bench || 0, 100, 'kg');
    case 'pullup-1':    return { earned: c.pullupLogged };
    case 'pb-allsix':   return done(c.pbLifts, 6);
    case 'workout-7':   return done(c.workouts, 7);
    case 'workout-25':  return done(c.workouts, 25);
    case 'workout-50':  return done(c.workouts, 50);
    case 'workout-100': return done(c.workouts, 100);
    case 'volume-10t':  return done(c.totalVolume, 10000);
    case 'volume-100t': return done(+(c.totalVolume/1000).toFixed(0), 100, 't');
    case 'early-bird':  return { earned: c.earlyBird };
    case 'night-owl':   return { earned: c.nightOwl };
    case 'afd-7':       return done(c.afdStreak, 7);
    case 'afd-30':      return done(c.afdStreak, 30);
    case 'afd-90':      return done(c.afdStreak, 90);
    case 'calm-4':      return c.calm7 ? { earned: c.calm7 >= 4 } : { earned: false };
    case 'spirit-7':    return done(c.spiritStreak, 7);
    case 'spirit-30':   return done(c.spiritStreak, 30);
    case 'sleep-8':     return c.sleep7 ? done(c.sleep7, 8, 'h') : { earned: false };
    case 'partner-30':  return done(c.partnerDays, 30);
    case 'gratitude-20': return done(c.gratitude, 20);
    case 'weigh-12':    return done(c.weighins, 12);
    default: return { earned: false }; // perfect-week/month, comeback, birthday, pullup-10, pb-3lifts, streak-target — not yet computed
  }
}

function BadgesWall() {
  const [filter, setFilter] = React.useState('ALL');
  const [showLocked, setShowLocked] = React.useState(true);
  const [selected, setSelected] = React.useState(null);

  // Evaluate every badge against the user's real data.
  const ctx = buildBadgeContext();
  const evaluated = BADGES.map((b) => {
    const r = evaluateBadge(b.id, ctx);
    return { ...b, earned: r.earned, progress: r.earned ? undefined : (r.progress || b.progress && !r.earned ? r.progress : undefined), earnedDate: r.earned ? (b.earnedDate || null) : undefined };
  });

  const filtered = evaluated.filter((b) => {
    if (filter !== 'ALL' && b.cat !== filter) return false;
    if (!showLocked && !b.earned) return false;
    return true;
  });

  const earnedCount = evaluated.filter((b) => b.earned).length;
  const totalCount = evaluated.length;

  return (
    <div>
      <SectionLabel meta={`${earnedCount} / ${totalCount} EARNED`}>BADGES</SectionLabel>

      {/* Header strip — earned count + filter pill */}
      <div
        style={{
          padding: '14px 16px',
          background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', right: -20, top: -20, width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(242,163,15,.2), transparent 65%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.accent, letterSpacing: 2 }}>
            COLLECTION
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4, gap: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 600, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
              {earnedCount}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: C.textMid }}>
              / {totalCount}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${(earnedCount / totalCount) * 100}%`, height: '100%', background: C.accent, transition: 'width .3s' }} />
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45 }}>
            {totalCount - earnedCount} still to earn. Quiet rewards, stacked over time.
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginLeft: -22, marginRight: -22, paddingLeft: 22, paddingRight: 22, marginBottom: 12 }}>
        {BADGE_CATEGORIES.map((c) => {
          const active = filter === c;
          const count = c === 'ALL' ? evaluated.length : evaluated.filter((b) => b.cat === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                flexShrink: 0,
                padding: '8px 12px',
                background: active ? C.accentDim : C.surf1,
                border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                borderRadius: 999,
                color: active ? C.accent : C.text,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600, fontSize: 12.5, letterSpacing: 1.4, textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{c}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: active ? C.accent : C.textLow, letterSpacing: 0.5 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toggle locked */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.5 }}>
        <button
          onClick={() => setShowLocked(!showLocked)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            color: C.textMid,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1.5,
          }}
        >
          <span
            style={{
              width: 30, height: 16, borderRadius: 9,
              background: showLocked ? C.accent : C.surf3,
              position: 'relative',
              transition: 'background .15s',
            }}
          >
            <span
              style={{
                position: 'absolute', top: 2, left: showLocked ? 16 : 2,
                width: 12, height: 12, borderRadius: 6,
                background: '#0A0A0C',
                transition: 'left .15s',
              }}
            />
          </span>
          <span>SHOW LOCKED</span>
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {filtered.map((b) => (
          <BadgeTile key={b.id} badge={b} onClick={() => setSelected(b)} />
        ))}
      </div>

      {/* Detail modal */}
      {selected && <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function BadgeTile({ badge, onClick }) {
  const earned = badge.earned;
  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1 / 1.2',
        padding: '8px 4px 8px',
        background: earned ? C.surf2 : C.surf1,
        border: earned ? `1px solid ${C.accentDim}` : `1px solid ${C.line}`,
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {earned && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 35%, rgba(242,163,15,.15), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Glyph */}
      <div
        style={{
          width: 38, height: 38,
          color: earned ? C.accent : 'rgba(242,241,236,.18)',
          marginTop: 4,
          filter: earned ? 'drop-shadow(0 0 8px rgba(242,163,15,.35))' : 'none',
          position: 'relative',
        }}
      >
        {BADGE_GLYPHS[badge.glyph]}
        {badge.tier && (
          <span
            style={{
              position: 'absolute', bottom: -3, right: -6,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 600,
              color: earned ? '#0A0A0C' : C.textLow,
              background: earned ? C.accent : C.surf3,
              padding: '1px 4px', borderRadius: 4, letterSpacing: 0.5,
              border: earned ? 0 : `1px solid ${C.line}`,
            }}
          >
            {badge.tier}
          </span>
        )}
      </div>
      {/* Label */}
      <div
        style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase',
          color: earned ? C.text : C.textLow,
          textAlign: 'center', lineHeight: 1.05,
          padding: '0 2px', position: 'relative',
        }}
      >
        {badge.label}
      </div>
      {/* Progress strip on locked badges */}
      {!earned && badge.progress && (
        <div style={{ width: '100%', padding: '0 6px', position: 'relative' }}>
          <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                height: '100%',
                background: C.accent,
              }}
            />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.textLow, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>
            {badge.progress.current}/{badge.progress.target}{badge.progress.unit || ''}
          </div>
        </div>
      )}
      {!earned && !badge.progress && (
        <div style={{ height: 14 }} />
      )}
      {/* Lock icon for unearned, no progress */}
      {!earned && !badge.progress && (
        <svg
          width="10" height="10" viewBox="0 0 10 10"
          style={{ position: 'absolute', top: 6, right: 6, color: C.textLow }}
        >
          <rect x="2.5" y="4.5" width="5" height="4" rx="0.6" fill="currentColor" />
          <path d="M3.5 4.5 V3.2 C3.5 2.3 4.2 1.7 5 1.7 C5.8 1.7 6.5 2.3 6.5 3.2 V4.5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      )}
    </button>
  );
}

function BadgeDetailModal({ badge, onClose }) {
  const earned = badge.earned;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 220,
        background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 28,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: C.surf1, border: `1px solid ${earned ? C.accent : C.line}`,
          borderRadius: 18, padding: '26px 22px 22px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        {earned && (
          <div
            aria-hidden
            style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(242,163,15,.3), transparent 65%)',
            }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div
          style={{
            width: 88, height: 88, margin: '0 auto 18px',
            color: earned ? C.accent : 'rgba(242,241,236,.18)',
            filter: earned ? 'drop-shadow(0 0 16px rgba(242,163,15,.45))' : 'none',
            position: 'relative',
          }}
        >
          {BADGE_GLYPHS[badge.glyph]}
          {badge.tier && (
            <span
              style={{
                position: 'absolute', bottom: -6, right: -12,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
                color: earned ? '#0A0A0C' : C.textLow,
                background: earned ? C.accent : C.surf3,
                padding: '3px 7px', borderRadius: 6, letterSpacing: 0.8,
              }}
            >
              {badge.tier}
            </span>
          )}
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: earned ? C.accent : C.textLow, marginBottom: 8 }}>
          {earned ? (badge.earnedDate ? `EARNED · ${badge.earnedDate}` : 'EARNED') : badge.cat}
        </div>
        <h2
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30,
            letterSpacing: 0.5, color: C.text, margin: '0 0 12px', textTransform: 'uppercase', lineHeight: 1,
          }}
        >
          {badge.label}
        </h2>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, margin: '0 0 18px', maxWidth: 280, marginInline: 'auto' }}>
          {badge.desc}
        </p>

        {!earned && badge.progress && (
          <div
            style={{
              padding: '12px 14px',
              background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 1.5 }}>
                PROGRESS
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.accent, fontWeight: 600 }}>
                {badge.progress.current} / {badge.progress.target}{badge.progress.unit || ''}
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                  height: '100%',
                  background: C.accent,
                  transition: 'width .25s',
                }}
              />
            </div>
          </div>
        )}

        {earned && (
          <button
            style={{
              width: '100%', padding: '12px 0',
              background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10,
              color: C.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.5,
              cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            Share badge →
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BadgesWall, BADGES, BADGE_CATEGORIES });

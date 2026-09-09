import React from 'react';
import { C } from './compound-ui.jsx';

// bigday.jsx — the two Home cards that keep one bad day from becoming a bad
// week. Tone rules, non-negotiable: never a verdict, never a count shown as
// a score, never rationing the button. The app adapts what it OFFERS.
//
//   • MorningResetCard — the morning after a Big Day: the actual week maths
//     while it's one-off; on a frequent week the maths would read as spin, so
//     it switches to "the week needs an anchor day" instead.
//   • AdaptCard — 3+ Big Days in a rolling week: offer to move the goal, not
//     judge the person. One button into the calculator, one dismiss (7 days).
//     Frequency is visible only to the member (and the coach review) — never
//     the family ladder or the Monday email.

const dkey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function MorningResetCard() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  const now = new Date();
  if (now.getHours() >= 12) return null; // mornings only
  const yKey = dkey(new Date(Date.now() - 86400000));
  const bd = window.bigDayEntry ? window.bigDayEntry(yKey) : null;
  if (!bd) return null;
  try { if (localStorage.getItem('compound:resetSeen') === yKey) return null; } catch (e) {}
  const over = window.bigDayOver ? window.bigDayOver(bd) : 0;
  const freq = window.bigDaysInLastWeek ? window.bigDaysInLastWeek() : 1;
  const perDay = Math.max(10, Math.round(over / 7 / 10) * 10);
  const body = freq >= 3
    ? "Yesterday's logged and closed. The week just needs one anchor day — normal meals, a walk — and today's a good one for it."
    : `Yesterday's done — about +${over} kcal. Spread across the week that's ~${perDay} a day. One normal day puts you back on trend.`;
  const dismiss = () => { try { localStorage.setItem('compound:resetSeen', yKey); } catch (e) {} force(); };
  return (
    <div style={{ marginTop: 14, padding: '13px 15px', background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 17 }}>🌅</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.8, color: C.text, textTransform: 'uppercase' }}>Reset</div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45, margin: '3px 0 0' }}>{body}</p>
      </div>
      <button onClick={dismiss} aria-label="Dismiss" style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', flexShrink: 0, padding: 2, lineHeight: 1 }}>
        <svg width="12" height="12" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

const ADAPT_SNOOZE_KEY = 'compound:adaptSnooze';

function AdaptCard({ onRecalc }) {
  const [snoozed, setSnoozed] = React.useState(() => {
    try { return Date.now() - (+localStorage.getItem(ADAPT_SNOOZE_KEY) || 0) < 7 * 86400000; } catch (e) { return false; }
  });
  if (snoozed) return null;
  const freq = window.bigDaysInLastWeek ? window.bigDaysInLastWeek() : 0;
  if (freq < 3) return null;
  const snooze = () => { try { localStorage.setItem(ADAPT_SNOOZE_KEY, String(Date.now())); } catch (e) {} setSnoozed(true); };
  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: C.accentSoft, border: `1px solid ${C.accentDim}`, borderRadius: 14 }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
        The target might not fit right now
      </div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '6px 0 0' }}>
        A few big days this week — that's information, not failure. It usually means the target doesn't match this stretch of life. An easier target you actually hit beats a hard one you hide from. Two weeks at maintenance is a fine plan.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => onRecalc && onRecalc()} style={{ background: C.accent, border: 0, color: C.onAccent, padding: '9px 16px', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer' }}>
          Ease the target
        </button>
        <button onClick={snooze} style={{ background: 'transparent', border: `1px solid ${C.line}`, color: C.textMid, padding: '9px 14px', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer' }}>
          I'm right
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MorningResetCard, AdaptCard });

export { AdaptCard, MorningResetCard };

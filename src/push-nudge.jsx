import React from 'react';
import { C } from './compound-ui.jsx';
import { pushSupported, notifPermission, isSubscribed, subscribePush } from './push.js';

// push-nudge.jsx — the missing link in reminders. Onboarding collects a
// check-in time and a weigh-in time, but nothing ever asked the browser for
// notification permission — so no real user had ever received a single
// reminder. This card closes that gap in two places:
//   • the onboarding "complete" screen (new users), and
//   • Home (existing users who onboarded before this existed).
// The Home variant is dismissible but re-surfaces after 7 days while
// reminders still can't be delivered.

const SNOOZE_KEY = 'compound:pushNudgeSnooze';
const SNOOZE_MS = 7 * 86400000;

function ReminderNudge({ variant = 'home', checkInTime }) {
  // 'loading' | 'off' | 'on' | 'denied' | 'unsupported'
  const [status, setStatus] = React.useState('loading');
  const [busy, setBusy] = React.useState(false);
  const [justEnabled, setJustEnabled] = React.useState(false);
  const [snoozed, setSnoozed] = React.useState(() => {
    if (variant !== 'home') return false;
    try { return Date.now() - (+localStorage.getItem(SNOOZE_KEY) || 0) < SNOOZE_MS; } catch (e) { return false; }
  });

  const refresh = React.useCallback(async () => {
    if (!pushSupported) return setStatus('unsupported');
    const perm = notifPermission();
    if (perm === 'denied') return setStatus('denied');
    const sub = await isSubscribed();
    setStatus(perm === 'granted' && sub ? 'on' : 'off');
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const r = await subscribePush();
      if (r.ok) setJustEnabled(true);
    } catch (e) {}
    setBusy(false);
    refresh();
  };
  const snooze = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch (e) {}
    setSnoozed(true);
  };

  if (snoozed || status === 'loading') return null;
  // Silent when there's nothing to fix (or nothing we can do about it here).
  if (status === 'unsupported') return null;
  if (status === 'on' && !justEnabled) return null;

  if (status === 'on' && justEnabled) {
    return (
      <div style={{ marginTop: variant === 'home' ? 14 : 0, marginBottom: variant === 'onboarding' ? 16 : 0, padding: '12px 16px', borderRadius: 12, background: 'rgba(90,197,126,.12)', border: '1px solid rgba(90,197,126,.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.text }}>
          Reminders on — {checkInTime ? `expect the first nudge at ${checkInTime}.` : 'expect the first nudge tonight.'}
        </span>
      </div>
    );
  }

  const blocked = status === 'denied';
  return (
    <div style={{ marginTop: variant === 'home' ? 14 : 0, marginBottom: variant === 'onboarding' ? 16 : 0, padding: '14px 16px', borderRadius: 14, background: C.accentSoft, border: `1px solid ${C.accentDim}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text, textTransform: 'uppercase', lineHeight: 1.1 }}>
          {blocked ? 'Reminders are blocked' : 'Your reminders aren’t on yet'}
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.45, margin: '4px 0 0' }}>
          {blocked
            ? 'Notifications are blocked for Compound on this device. Allow them in your phone’s app/site settings and this goes away.'
            : `The ${checkInTime || '9pm'} check-in and morning weigh-in nudges can’t reach you until notifications are allowed. One tap:`}
        </p>
        {!blocked && (
          <button
            onClick={enable}
            disabled={busy}
            style={{ marginTop: 10, background: C.accent, border: 0, color: C.onAccent, padding: '10px 16px', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'One sec…' : 'Allow notifications'}
          </button>
        )}
      </div>
      {variant === 'home' && (
        <button onClick={snooze} aria-label="Dismiss" style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', flexShrink: 0, padding: 2, lineHeight: 1 }}>
          <svg width="13" height="13" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { ReminderNudge });

export { ReminderNudge };

import React from 'react';
import { SamsungFrame } from './samsung-frame.jsx';

// mobile-shell.jsx — responsive frame + Add-to-Home-Screen install prompt

// Detect a real phone-sized viewport (vs desktop preview)
function useIsMobile(breakpoint = 600) {
  const [mobile, setMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return mobile;
}

// Already launched from the home screen?
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    // iPadOS 13+ reports as Mac with touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Chrome fires `beforeinstallprompt` ONCE, early in the page load — usually
// before React mounts, and always before the signed-in <App/> renders (the
// auth gate + cloud sync run first). Capture and stash it at module load so
// InstallPrompt can adopt it whenever it mounts; otherwise the event is missed
// and the install popup never shows.
let stashedInstall = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    stashedInstall = e;
    try { window.dispatchEvent(new Event('compound:install-ready')); } catch (err) {}
  });
}

// ── Install prompt ────────────────────────────────────────────────────────
// Android/Chrome: captures beforeinstallprompt → native install.
// iOS Safari: shows Share-sheet instructions (no programmatic API exists).
function InstallPrompt() {
  const [deferred, setDeferred] = React.useState(null);
  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState(null); // 'android' | 'ios'
  const [dismissed, setDismissed] = React.useState(
    () => localStorage.getItem('compound:a2hs-dismissed') === '1'
  );

  React.useEffect(() => {
    if (isStandalone() || dismissed) return;

    // Android / desktop Chrome path — the event is captured at module load
    // (see stashedInstall above); adopt it on mount, or when it arrives later.
    let showTimer;
    const adopt = () => {
      if (!stashedInstall) return;
      setDeferred(stashedInstall);
      setMode('android');
      showTimer = setTimeout(() => setVisible(true), 1200);
    };
    adopt();
    window.addEventListener('compound:install-ready', adopt);

    // iOS path — no event, decide by UA
    let iosTimer;
    if (isIOS() && !isStandalone()) {
      setMode('ios');
      iosTimer = setTimeout(() => setVisible(true), 1600);
    }

    return () => {
      window.removeEventListener('compound:install-ready', adopt);
      if (showTimer) clearTimeout(showTimer);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [dismissed]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('compound:a2hs-dismissed', '1');
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.choice || (await deferred.userChoice);
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false);
      setDeferred(null);
      stashedInstall = null; // consumed — a prompt event can only be used once
    }
  };

  if (!visible || !mode) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 9000,
        padding: '0 12px calc(12px + env(safe-area-inset-bottom))',
        display: 'flex', justifyContent: 'center',
        animation: 'a2hsUp .4s cubic-bezier(.2,.7,.2,1)',
        pointerEvents: 'none',
      }}
    >
      <style>{`@keyframes a2hsUp { from { transform: translateY(120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 460,
          background: 'rgba(20,20,26,0.96)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(242,163,15,0.25)',
          borderRadius: 18,
          padding: '14px 14px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <img
          src={window.COMPOUND_ICON_180}
          alt=""
          style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.6, color: '#F2F1EC', textTransform: 'uppercase', lineHeight: 1 }}>
            Add COMPOUND to home
          </div>
          {mode === 'android' ? (
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: 'rgba(242,241,236,0.62)', marginTop: 3, lineHeight: 1.35 }}>
              Launches full-screen, like a real app. No app store needed.
            </div>
          ) : (
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: 'rgba(242,241,236,0.62)', marginTop: 3, lineHeight: 1.4 }}>
              Tap <IosShareGlyph /> <strong style={{ color: '#F2F1EC' }}>Share</strong>, then <strong style={{ color: '#F2F1EC' }}>Add to Home Screen</strong>.
            </div>
          )}
        </div>
        {mode === 'android' ? (
          <button
            onClick={install}
            style={{
              flexShrink: 0,
              background: '#F2A30F', border: 0, color: '#0A0A0C',
              padding: '10px 16px', borderRadius: 10,
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14,
              letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Install
          </button>
        ) : (
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              background: 'transparent', border: 0, color: 'rgba(242,241,236,0.5)',
              padding: 8, cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function IosShareGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" style={{ display: 'inline', verticalAlign: '-2px', margin: '0 1px' }}>
      <path d="M8 1 L8 10 M5 4 L8 1 L11 4" stroke="#F2A30F" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7 H3 C2.4 7 2 7.4 2 8 V13 C2 13.6 2.4 14 3 14 H13 C13.6 14 14 13.6 14 13 V8 C14 7.4 13.6 7 13 7 H12" stroke="#F2A30F" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { useIsMobile, isStandalone, isIOS, InstallPrompt, ResponsiveFrame });

// ── Responsive frame: Samsung bezel on desktop, full-bleed on phone ────────
function ResponsiveFrame({ mobile, children }) {
  if (mobile) {
    return (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '100dvh',
          background: '#070709',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          zIndex: 1,
        }}
      >
        <div
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  return <SamsungFrame>{children}</SamsungFrame>;
}

export { InstallPrompt, IosShareGlyph, ResponsiveFrame, isIOS, isStandalone, useIsMobile };

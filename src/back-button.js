// back-button.js — makes the phone's back button/gesture navigate INSIDE the
// app instead of closing the PWA.
//
// How: one sentinel entry is kept on the history stack ("armed"). Overlays and
// sheets register a close handler while open; a hardware back pops the most
// recently opened one and re-arms. With nothing open, an app-level fallback
// runs (workout sub-view → Home tab → onboarding step back). Only when the
// fallback has nothing left to do (Home, nothing open) does back actually
// leave the app.
import React from 'react';

const stack = []; // most recently opened last
let fallback = null; // () => boolean — true if it consumed the press

const TRAP = '__compoundBack';
function armed() { try { return !!(history.state && history.state[TRAP]); } catch (e) { return false; } }
function arm() { try { if (!armed()) history.pushState({ [TRAP]: true }, ''); } catch (e) {} }

// Register a close handler for an open overlay. Returns an unregister fn —
// call it when the overlay closes by its own UI so the stack stays honest.
export function registerBack(close) {
  const entry = { close };
  stack.push(entry);
  arm();
  return () => { const i = stack.indexOf(entry); if (i >= 0) stack.splice(i, 1); };
}

export function setBackFallback(fn) { fallback = fn; }

let installed = false;
export function initBackButton() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  arm();
  window.addEventListener('popstate', () => {
    const top = stack.pop();
    if (top) { try { top.close(); } catch (e) {} arm(); return; }
    if (fallback) { let used = false; try { used = !!fallback(); } catch (e) {} if (used) { arm(); return; } }
    // Nothing to close and fallback declined → stay unarmed; the NEXT back
    // press exits the app (this press just consumed the sentinel).
  });
}

// Hook: while `open` is true, the phone's back button closes this overlay
// (most recently opened wins). `close` can change identity freely.
export function useBackClose(open, close) {
  const ref = React.useRef(close);
  ref.current = close;
  React.useEffect(() => {
    if (!open) return undefined;
    return registerBack(() => { if (ref.current) ref.current(); });
  }, [open]);
}

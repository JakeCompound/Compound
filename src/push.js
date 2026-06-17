// push.js — client side of Web Push.
//
//   • Registers the service worker (sw.js) on load.
//   • subscribePush()  — ask permission, create a PushManager subscription, and
//     save it (plus the device's timezone) to Supabase so the server can reach it.
//   • unsubscribePush() — tear that down.
//
// The VAPID PUBLIC key is safe to ship in the browser; the matching private key
// lives only in Vercel (used by /api/push-cron to sign sends).
import { supabase, supabaseConfigured } from './supabase.js';

const VAPID_PUBLIC_KEY = 'BGOLrpKztH3ZxR9yNLKbz8HrZFg5iLGJCgG0qFgxoUsk2DQPh3h-wfTZ0Wp3L1P9m5Wcfd-yBbYPsZXbmCUozj4';

export const pushSupported =
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator &&
  typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let swReg = null;
export async function registerSW() {
  if (!pushSupported) return null;
  if (swReg) { try { await swReg.update(); } catch (e) {} return swReg; }
  try {
    // updateViaCache:'none' → the browser never serves sw.js from HTTP cache,
    // so a new version is always picked up. update() forces an immediate check.
    swReg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    try { await swReg.update(); } catch (e) {}
  } catch (e) { console.warn('[push] SW register failed', e); }
  return swReg;
}

// Current state for the UI: 'unsupported' | 'default' | 'denied' | 'granted'
export function notifPermission() {
  if (!pushSupported) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function isSubscribed() {
  if (!pushSupported) return false;
  const reg = await registerSW();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

// Ask permission + subscribe + persist. Returns { ok, reason }.
export async function subscribePush() {
  if (!pushSupported) return { ok: false, reason: 'unsupported' };
  const reg = await registerSW();
  if (!reg) return { ok: false, reason: 'no-sw' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: perm }; // 'denied' | 'default'

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await saveSubscription(sub);
  return { ok: true };
}

export async function unsubscribePush() {
  if (!pushSupported) return;
  const reg = await registerSW();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    try { await removeSubscription(sub.endpoint); } catch (e) {}
    try { await sub.unsubscribe(); } catch (e) {}
  }
}

async function saveSubscription(sub) {
  if (!supabaseConfigured) return;
  const { data: u } = await supabase.auth.getUser();
  if (!u || !u.user) return;
  const json = sub.toJSON(); // { endpoint, keys: { p256dh, auth } }
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })();
  await supabase.from('push_subscriptions').upsert({
    user_id: u.user.id,
    endpoint: json.endpoint,
    p256dh: json.keys && json.keys.p256dh,
    auth: json.keys && json.keys.auth,
    timezone: tz,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
}

async function removeSubscription(endpoint) {
  if (!supabaseConfigured) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

// Register the SW as soon as the module loads (safe no-op where unsupported).
if (pushSupported) registerSW();

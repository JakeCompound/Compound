# COMPOUND — Tier B Production Runbook (for Claude Code)

You are taking a **working single-file prototype** of a personal health/training app
("COMPOUND") to a real, installable, cloud-synced app. The product design is DONE and
should not change visually. Your job is plumbing: cloud data, auth, a secure AI proxy,
deploy, and push notifications.

**Owner:** single user to start (James, Focus Industrial). Build multi-user-ready (every
row keyed by `user_id` + RLS already in the schema) but ship a one-account experience.

---

## 0. The decisions already made (do not re-litigate)
| Choice | Decision |
|---|---|
| Code home | **GitHub** (this repo) |
| Database / auth | **Supabase** (Postgres + Auth + Storage) |
| Hosting + serverless | **Vercel** |
| AI | **Anthropic API** via a Vercel serverless proxy (key server-side only) |
| Sign-in | **Email + password** (Supabase Auth), session persisted — user logs in once per device |
| Notifications | **Build now** — Web Push (VAPID) + service worker, scheduled server-side |
| Extras | none for now |

---

## 1. What the prototype is today
- `index.html` loads ~30 `*.jsx` files via `<script type="text/babel">`; components are
  shared through `window.*` (e.g. `Object.assign(window, {...})` at the bottom of files).
- **Babel compiles in the browser on every load** — fine on desktop, slow on a phone.
- All state is in `localStorage` under `compound:*` keys.
- AI is called through `window.claude.complete(promptOrContentBlocks)` — a helper that only
  exists in the design tool, so it is dead in the real world until you build the proxy.
- `COMPOUND.html` is a pre-bundled single-file build (reference only — don't edit it).

### Recommended target architecture
Migrate to **Vite + React 18** (`npm create vite@latest` → react template):
1. Move each `*.jsx` into `src/`. Replace the `window.*` sharing pattern with real
   `import`/`export`. The component bodies barely change — it's mechanical.
2. Keep fonts, the grain overlay, the Samsung frame, the PWA manifest/icons.
3. Result: pre-compiled JS, instant load on mobile, real env-var handling.
> If you must ship faster, you *can* keep the Babel-in-browser file and host it static on
> Vercel — but the Vite migration is strongly preferred and is the assumed path below.

---

## 2. Data layer — localStorage → Supabase
The schema is in **`BUILD_TIER_B/SUPABASE_SCHEMA.sql`** (run it in Supabase first).
Key → table mapping is documented inline there. Singletons (onboarding, targets, notif
prefs, nip limit, plateau-dismissed) all live in the `profiles` row.

**Strategy — keep the app's data calls familiar.** Introduce one module `src/store.js`
that exposes the same shape the app already expects but reads/writes Supabase, with
localStorage kept as an **offline cache + optimistic layer**:

```js
// src/store.js  (sketch)
import { supabase } from './supabase';

// Collections (weighins, checkins, workouts, food_entries, measurements, …):
export async function list(table)        { /* select * where user_id=auth.uid(); cache to LS */ }
export async function upsertByDate(table, date, row) { /* unique(user_id,date) upsert */ }
export async function insert(table, row) { /* insert returning */ }

// Singletons live in profiles:
export async function getProfile()       { /* select * from profiles single */ }
export async function patchProfile(patch){ /* update profiles set … */ }
```

Migration recipe per existing key:
- `compound:weighins` → `weighins` (upsertByDate)
- `compound:checkins` → `checkins` (upsertByDate)
- `compound:workouts` → `workouts` (insert; list)
- `compound:savedWorkouts` → `saved_workouts`
- `compound:workoutWeek` → `workout_week` (upsert by week_start)
- `compound:food` → `food_entries` (one row per meal; photo → Storage bucket, store URL)
- `compound:nipsToday` + `compound:alcoholKcal` → `nip_days` (upsert by date)
- `compound:measurements` → `measurements`
- `compound:todostate` → `todo_state` (upsert by date)
- `compound:nutrition` → `nutrition_messages`
- `compound:onboarding` / `:targets` / `:notifs` / `:nipLimit` / `:plateauDismissed` → `profiles`
- Local-only (DO NOT sync): `compound:view`, `compound:step`, `compound:schema`,
  `compound:livemigrated`, `compound:cleartoken`, `compound:a2hs-dismissed`.

**One-time import:** on first login, if `compound:*` keys exist in localStorage and the
user's tables are empty, push them up so the prototype's existing data isn't lost. Then
mark imported.

**Offline:** wrap writes so they queue in localStorage and flush when back online
(Supabase has no built-in offline; a simple outbox array is enough for one user).

---

## 3. Auth (email + password)
- Add a gate: unauthenticated users see a Sign in / Create account screen styled in the
  COMPOUND system (near-black `#070709`, amber `#F2A30F`, Barlow Condensed headings).
- Use `supabase.auth.signUp` / `signInWithPassword`; persist session (default). The app
  shell renders only when `session` exists.
- Add "Sign out" to Settings.
- RLS is already enforced by the schema — no per-query filtering needed beyond being
  authenticated.

---

## 4. AI — secure proxy (the smallest possible change)
**Do NOT change the 5 call sites.** They call `window.claude.complete(...)`. Instead, define
that function once to call your proxy. Signature it must keep supporting:
- a **string** prompt, and
- an **array of content blocks**: `[{type:'text',text}, {type:'image',source:{type:'base64',media_type,data}}]`
  (used by `add-button.jsx` food-photo estimate — vision).

```js
// src/ai.js  → sets window.claude.complete
window.claude = { async complete(input) {
  const content = typeof input === 'string'
    ? [{ type:'text', text: input }]
    : input.map(b => b.type === 'image'
        ? { type:'image', source: b.source }
        : { type:'text', text: b.text });
  const r = await fetch('/api/ai', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}` },
    body: JSON.stringify({ content })
  });
  const { text } = await r.json();
  return text;            // call sites then regex JSON out of it, as today
}};
```

```js
// api/ai.js  (Vercel serverless function — key NEVER reaches the browser)
import Anthropic from '@anthropic-ai/sdk';
export default async function handler(req, res) {
  // 1) verify the Supabase JWT from Authorization header (reject anon)
  // 2) (optional) rate-limit per user/day as a spend guard
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',          // pick a current model at build time
    max_tokens: 1024,
    messages: [{ role:'user', content: req.body.content }]
  });
  res.json({ text: msg.content.map(c => c.text || '').join('') });
}
```

Set `ANTHROPIC_API_KEY` in Vercel → Project → Settings → Environment Variables (server
only). **Verify the Supabase JWT** inside the function so only the signed-in owner can
spend the key. Add a simple per-day request cap as a second guard.

The 5 call sites that "just work" once this is in place:
`nutrition-screen.jsx` (Ask chat) · `add-button.jsx` (alcohol est. + food est. **w/ photo**)
· `quick-log.jsx` · `nutrition-tab.jsx` (meal re-estimate).

---

## 5. Deploy (Vercel)
1. Import the GitHub repo in Vercel. Framework preset: **Vite**.
2. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client), `ANTHROPIC_API_KEY`
   (server only), plus VAPID keys (below).
3. Every `git push` auto-deploys. The PWA manifest + icons already exist — keep them so
   "Install app" still works on Android.

---

## 6. Push notifications (build now)
The app already has a notification-prefs screen (`compound:notifs` → `profiles.notif_prefs`)
and reminder times in onboarding (weigh-in 6:30am, check-in 9pm, workout days).
- Add a **service worker** + Web Push (VAPID). Store the push subscription per user.
- Schedule sends server-side: a **Supabase scheduled function / pg_cron** (or Vercel Cron)
  that fires at the user's configured local times and pushes weigh-in / check-in / workout
  reminders. Respect `notif_prefs` toggles.
- Target is **Android/Chrome (Samsung S24 Ultra)** — full Web Push support once the PWA is
  installed. (Note iOS needs an installed PWA too, but that's not the current target.)

---

## 7. Definition of done
- [ ] Sign up / sign in works; refresh keeps you in; Sign out in Settings.
- [ ] Every `compound:*` domain reads/writes Supabase; prototype data imported once.
- [ ] All 5 AI features work through `/api/ai`; key never appears in browser/network.
- [ ] Installs on the S24 as a PWA; loads fast (pre-compiled); works offline; syncs on reconnect.
- [ ] Reminders fire at configured times and honor the notification toggles.
- [ ] Spend guard in place (JWT check + per-day cap) so AI cost stays in pennies/day.

---

## Source map (where the design lives)
Prototype entry: `index.html`. Notable modules:
- Data/state: `app.jsx`, `live-state.jsx`, `home-data.jsx`, `nutrition-data.jsx`,
  `workout-data.jsx`, `workout-history.jsx`, `reports-data.jsx`
- AI call sites: `nutrition-screen.jsx`, `add-button.jsx`, `quick-log.jsx`, `nutrition-tab.jsx`
- Screens: `onboarding-screens.jsx`, `home-screen.jsx`, `workout-*.jsx`, `nutrition-*.jsx`,
  `reports-screen.jsx`, `settings-screen.jsx`, `macro-calc-screen.jsx`, `checkin-modal.jsx`
- Shell/PWA: `mobile-shell.jsx`, `samsung-frame.jsx`, `app-icon.js`, manifest in `index.html`
- Design system notes: `NOTES.md`, `NUTRITION_SPEC.md`

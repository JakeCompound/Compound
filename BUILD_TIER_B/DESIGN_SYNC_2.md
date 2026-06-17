# COMPOUND — Design-tool sync, Round 2 (Phases 2 / 4 / 5 / 6)

> Paste this into the design tab. This covers everything added to the live build
> AFTER `DESIGN_SYNC.md` (Change Round 1 + Fix 1) — namely accounts, the live AI
> features, deployment, and push notifications. Keep ALL existing COMPOUND styling
> (near-black `#070709`, amber `#F2A30F` = `C.accent`, Barlow Condensed headings /
> JetBrains Mono labels / Outfit body). Most of this is backend wiring with no
> prototype UI; the two genuinely NEW screens/controls to add are **(A) the auth
> gate** and **(B) the "Push on this device" card** — both described in full below.

---

## A. NEW — Account / sign-in gate (`auth-gate.jsx`)

The whole app now sits behind an email + password login. The user signs in once
per device; their data syncs to their account. Add these screens.

**Behaviour / flow**
- On launch: show a **Splash** while checking the session.
- If not signed in → **AuthScreen**.
- After sign-in → brief Splash "Syncing your data…" → then the app.
- Session persists (stay logged in). Account switch / sign-out handled in Settings.
- If signup has email-confirmation on: after "Create account", show the message
  "Account created. Check your email to confirm, then sign in." and flip to sign-in.

**Splash** — full-screen `#050507`, centered:
- `◆ COMPOUND` in JetBrains Mono, 11px, letter-spacing 3, color `C.accent`.
- Optional sub-label (Outfit 12px, `C.textMid`), e.g. "Syncing your data…".

**AuthScreen** — full-screen, background
`radial-gradient(circle at 50% 0%, #1a1410 0%, #0a0a0c 55%, #050507 100%)`,
centered column, content max-width 380px:
- `◆ COMPOUND` eyebrow (mono 11px, ls 3, `C.accent`), margin-bottom 18.
- **H1** Barlow Condensed 800, 40px, line-height 0.95, uppercase:
  - Sign-in: "WELCOME" / "BACK." (the second line in `C.accent`).
  - Sign-up: "CREATE YOUR" / "ACCOUNT." (second line `C.accent`).
- Sub-copy (Outfit 14px, `C.textMid`):
  - Sign-in: "Sign in to sync your training, nutrition and check-ins across devices."
  - Sign-up: "One account keeps everything backed up and synced. Consistency over perfection."
- Two **Fields** (Email, then Password):
  - Label: mono 10px, ls 2, `C.textLow`, uppercased.
  - Input: height 50, `C.surf1` bg, 1.5px border (`C.line`, → `C.accent` on focus),
    radius 12, Outfit 16px, padding 0 14. Password placeholder "At least 6 characters".
- Inline **error** line (`C.danger`) / **info** line (`C.accent`), Outfit 13px.
- **Primary button** (full-width, height 54, radius 12, Barlow Condensed 700, 17px,
  ls 2, uppercase): label "Sign in" / "Create account" (→ "One sec…" while pending).
  Disabled state = amber at 28% with dark-translucent text. Enabled only when email
  looks valid AND password ≥ 6 chars.
- **Mode toggle** text button below (Outfit 13px, `C.textMid`, amber link span):
  "New here? Create an account"  ⇄  "Already have an account? Sign in".

## A.2 Settings — Account group additions (`settings-screen.jsx`)
- Add a **Sign out** action in Settings (signs the user out → returns to AuthScreen).
- (Optional, matches build) the account/email can be shown near it.

---

## B. NEW — "Push on this device" card (`settings-screen.jsx` → Notifications)

Settings → **Notification preferences** now has a master device switch ABOVE the
existing per-type toggle list, plus a section label.

**Layout order on the Notifications screen:**
1. Existing intro line: "We send the minimum. Each one earns its place."
2. **PushDeviceCard** (new — see below).
3. **Section label** "WHAT GETS THROUGH" (mono 9.5px, ls 1, `C.textLow`, margin ~20px top).
4. The existing per-type toggle rows (`NotifRow`) unchanged.

**PushDeviceCard** — a rounded card (radius 14, padding 14×16):
- Default look: `C.surf1` bg, 1px `C.line` border. **When ON:** `C.accentSoft` bg,
  1px `C.accentDim` border.
- **Title row:** "PUSH ON THIS DEVICE" (Barlow Condensed 700, 17px, uppercase,
  `C.text`) + a small status **pill** on the right:
  - ON → "ON" pill (amber: text `C.accent`, bg `C.accentSoft`, 1px `C.accent`, radius 20).
  - Blocked → "BLOCKED" pill (warm red `#E0653E` on `rgba(224,101,62,.12)`).
  - Unsupported → "INSTALL FIRST" pill (`C.textLow` on `C.surf2`).
- **Body copy + action** depends on state (sub-copy = Outfit 12.5px, `C.textMid`):
  - **off** → "Get reminders even when COMPOUND is closed. Turning this on will ask
    your phone for permission once." + primary amber button **"Enable notifications"**.
  - **on** → "This device will receive your reminders. Choose which ones below." +
    secondary outline button **"Turn off on this device"**.
  - **blocked** → "Notifications are blocked for COMPOUND. Open your phone's app/site
    settings, allow notifications, then come back and tap Enable." (no button).
  - **unsupported** → "Add COMPOUND to your home screen (install it) — push
    notifications work once it's installed." (no button).
  - **loading** → "Checking…".
- Buttons: mono 11px, ls 1, uppercase, radius 10. Primary = `C.accent` bg / `#0A0A0C`
  text; secondary = transparent with 1px `C.line` border and `C.textMid` text.

> Behaviour note for the prototype: this is a real device-permission control in the
> build (asks for notification permission, registers the device). In the prototype
> it can just be a visual stateful card (off ⇄ on) — the actual push plumbing is
> server-side and out of the prototype's scope.

---

## C. Now LIVE (backend) — no new prototype UI, just FYI

These were wired to real services; the in-app screens you already have are the UI.
- **Accounts + cloud sync** (Supabase): data persists to the account and syncs
  across devices. (UI = the auth gate above + existing app.)
- **AI features are real now** (secure server proxy): the meal/drink **photo
  estimate** and the **nutrition chat** call a live model. No UI change — same
  screens, now functional.
- **Live + installable:** the app is deployed and installable as a PWA (home-screen
  app, app icon = the COMPOUND ring logo).
- **Push reminders** delivered server-side at the user's set times, honouring the
  Notification-preferences toggles: nightly check-in, Friday weigh-in, and a
  workout reminder 30 min before the set workout time. Notification shows the
  COMPOUND logo; the small status-bar icon is the ring mark.

(Event-based reminders — streaks, PRs, missed-workout nudge, comeback, monthly
report, deload — exist as toggles but their automated sending is a later pass.)

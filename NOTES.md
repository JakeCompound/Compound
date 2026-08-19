# COMPOUND — Project Notes

## Purpose
A premium, dark-aesthetic **life-tracking + training app** (mobile-first, Samsung S24-framed on
desktop / full-bleed PWA on phone). Built for an ADHD-friendly daily loop: small, satisfying,
zero-friction actions that compound over time. Mantra: **"Consistency over perfection."**
Audience is the owner first (Coach Luke's client), trains at **Focus Industrial** gym.

## Aesthetic / system
- **Colours:** near-black `#070709`, amber/gold accent `#F2A30F`, danger `#E5564B`, success `#5AC57E`.
- **Type:** Barlow Condensed (headings, ALL CAPS), JetBrains Mono (numbers/data), Outfit (body).
- **Patterns:** 2-line stacked headlines (white + amber), press-scale haptic buttons, grain overlay,
  auto-advance on single-select questions (no Continue), Back always present.
- **Storage:** `localStorage` under `compound:*` keys is the synchronous source of truth; **Supabase is
  live** — email/password auth (`auth-gate.jsx`), and `cloud-sync.js` hydrates on login then mirrors every
  synced `compound:*` write to its mapped table (debounced). Public URL/anon key are hardcoded as fallback
  in `supabase.js` (the Vercel env-var copy is corrupted with a stray em-dash).
- **Build:** now a real **Vite + React 18** project (`src/*.jsx`, `npm run build`), deployed via Vercel —
  production at **compoundhealth.app** (repo `JakeCompound/Compound`, `main` auto-deploys; PR branches get
  preview URLs). `COMPOUND.html` is the legacy single-file bundle from the pre-Vite era.

## Navigation — 4 tabs + onboarding
Home · Workout · Nutrition · Reports. Onboarding is a 14-step flow ending in a "track food?" step.

## What's BUILT
**Onboarding:** welcome, name, DOB (real birthday → streak-freeze gift), weight+goal, training days,
steps/sleep, equipment, check-in time, Friday weigh-in time, gratitude library (7 categories,
spread-gated across 3+ areas), fitness level, optional 1RM, **track-food? → inline calorie calculator**,
completion. Save & exit throughout.

**Home (deliberately minimal):** greeting + mantra; **3 north-star rings** (Weekly Nips w/ red-over-limit,
Workouts /target green-at-target, Life Score /100); plateau nudge card; **Today's To-Do list** in a
bordered card (Weigh-in 6:30am, Workout on scheduled days, Check-in 9pm) with live countdowns, red when
overdue, editable when done, "add unscheduled workout" (swap a future day or add extra), Nutrition-Question
to-do; Friday weigh-in block; **+ Add FAB** (Alcohol always, Food when tracking on).

**Nightly check-in:** 9 questions w/ conditional branches, nips pre-filled from live tally, Sunday adds a
training-days picker. Editable after completion.

**Workout:** Hub → New Workout (location/duration/groups/pre-feel → AI-generated preview with
**swap-for-similar** per exercise) → live session (inline previous-performance, plate calc, RIR, rest timer,
quick-log via Claude, exercise notes) → completion (PBs, session note, **Save as named workout**).
**Saved Workouts** (replaces Routines, empty until saved). Dashboard (1RM trends, volume, heatmap, PB wall),
Past Workouts, Weekly Plan. **Exercise library = real Focus Industrial gear** (65 movements: Reeplex cables,
Smith, rack, barbell, DBs 5–35kg, bodyweight). 6 tracked 1RM lifts.

**Nutrition:** Today / Week / Ask toggle. Today = calories-left ring (goes negative/red when over) + macro
bars + food log (3 interactive badges: confidence ◎ / health ♥ / info i) + alcohol row + Meal Questions
launcher (red count). Week = weekly calorie budget + per-day bars (anti-"one bad day" framing). Ask = AI chat.
Food logging = photo (camera/library, optional) + text → Claude vision estimate → added immediately;
alcohol detected in food routes to nips; drinks add calories. Meal Questions = zero-friction, photo-topped,
multiple-choice + custom, auto-advance, visible macro updates.

**Calculator (rippedbody replica):** gender/age/height/weight/bodyfat → activity → Cut/Maintain/Gain
(slow–medium only) → live preview. Protein fixed 0.6 g/lb (editable), carbs/fat optional within calories.
In onboarding + Settings "Recalculate" (one-tap smart). **Plateau auto-prompt** when weight flat >4wks
while training consistent.

**Reports:** radar, streaks, this-week strip, AI insight, pillar trends, spirit grid, alcohol weeks,
weight trend, body measurements, progress photos, monthly card, correlations, **36-badge wall**.

**Settings:** profile, goals, equipment, reminders, gratitude, notifications, integrations (mock),
nutrition (calories/macros, food tracking, weekly nip limit — limit ONLY editable here), about.

**PWA:** Add-to-Home-Screen prompt (Android install / iOS share-sheet), app icon, manifest, full-bleed on phone.

## Recent changes — Claude Code session, 17–19 Aug 2026
Shipped to production (PRs #1–#4 on `JakeCompound/Compound`, all merged to `main`):
- **Check-in starts on join day** (PR #1): the join-day deferral now applies only to the morning weigh-in;
  the nightly check-in appears on day one, with a soft deadline (shows "OPEN TONIGHT", never red) if the
  user joins after their usual slot. `mid-week-join.js` comments updated to match.
- **Missed to-dos disappear once a reason is given** (PR #2): tapping a "why missed" chip removes the red
  row from the list immediately (reason stays recorded in `compound:todostate`). Workouts keep their own
  Complete/Postpone flow.
- **Weigh-in frequency setting** (PR #2): Settings → Reminders → chip picker, Daily → Weekly
  (`user.weighInEveryDays`, default 1). The weigh-in to-do appears only when due, counted from the last
  *logged* weigh-in; stays due until logged; label adapts. Stale "Friday weigh-in" copy cleaned up.
- **3am check-in grace** (PR #3): a check-in finished before 3am is stamped to the previous evening
  (`checkinEffectiveDate()` in `live-state.jsx`). Reopening in the window edits the same entry, the draft
  survives midnight, the Sunday week-plan step keys off the night being logged, and grace-night check-ins
  don't write nips/steps into the new day's ledgers. Rest of the app's day still rolls at midnight.
- **Settings recovery row** (PR #4): "Move today's check-in to yesterday" under HABITS — appears only when
  today has an entry and yesterday doesn't (post-3am mislog), one tap re-dates it, cloud sync mirrors it.
- **Supabase auth ops** (no code): self-signup is the intended flow for new users (e.g. Coach Luke) —
  dashboard "invite"/"add user" sends no usable credentials email. "Confirm email" is now OFF in Supabase
  auth settings, so signup at compoundhealth.app is instant; re-enable only after wiring custom SMTP.

## What's NEXT / open ideas
- Real wearable integrations (Apple/Samsung Health) — currently honest "not connected" state.
- Progress-photo upload + shareable monthly report card / badge sharing (currently decorative).
- App Store / Play Store packaging (see earlier handoff discussion).
- Possible: split long Reports tab into sub-tabs; achievements tie-ins.

## Gotchas for next session
- localStorage keys are the source of truth; a one-time "clear today" block lives at the bottom of `app.jsx`
  (token-gated) — bump the token to wipe today's data for a clean demo.
- Phone links from `get_public_file_url` are legacy (pre-Vite bundles) — the app now lives at
  compoundhealth.app; PR branches get Vercel preview URLs for testing before merge.
- html-to-image screenshots sometimes show false text-overlap on the to-do rows / wearable area — it's a
  capture artifact; the live DOM is fine.
- Verifier subagent can time out on very long directed checks; prefer focused eval_js probes that don't
  mutate storage keys you didn't create this turn.

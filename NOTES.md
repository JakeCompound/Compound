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
- **Storage:** everything in `localStorage` under `compound:*` keys (to migrate to Supabase later).
- Files are split into many small JSX modules loaded via `<script type="text/babel">` in `index.html`;
  shared components exported to `window`. Bundle to `COMPOUND.html` via super_inline_html for phone links.

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

## What's NEXT / open ideas
- Wire real backend (Supabase): accounts, cloud sync, real push notifications.
- Real wearable integrations (Apple/Samsung Health) — currently honest "not connected" state.
- Progress-photo upload + shareable monthly report card / badge sharing (currently decorative).
- App Store / Play Store packaging (see earlier handoff discussion).
- Possible: split long Reports tab into sub-tabs; achievements tie-ins.

## Gotchas for next session
- localStorage keys are the source of truth; a one-time "clear today" block lives at the bottom of `app.jsx`
  (token-gated) — bump the token to wipe today's data for a clean demo.
- Phone links from `get_public_file_url` expire ~1h; rebundle `COMPOUND.html` then regenerate.
- html-to-image screenshots sometimes show false text-overlap on the to-do rows / wearable area — it's a
  capture artifact; the live DOM is fine.
- Verifier subagent can time out on very long directed checks; prefer focused eval_js probes that don't
  mutate storage keys you didn't create this turn.

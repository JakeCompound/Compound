# COMPOUND — Change Round 3 (alcohol opt-in, spider on Home, bugs, 500-badge library)

> **For Claude Code.** Real-use feedback + a big feature (the 500-badge library). Component/file
> names are from the prototype — search the repo if a path moved. Keep COMPOUND styling
> (near-black `#070709`, amber `#F2A30F`, Barlow Condensed / JetBrains Mono / Outfit). Do **one
> numbered item at a time**, show James, then move on. Ask before anything destructive.
> **Build order suggestion:** 3, 5, 7, 6, 4 (quick bugs) → 1, 2 → 9, 8 → 10 (the big one, last).

---

## 1. Alcohol tracking — opt-in during onboarding, hideable everywhere
**Where:** `onboarding-screens.jsx` (add screens), `settings-screen.jsx` (`SettingsGoals`/profile),
plus every alcohol surface: `add-button.jsx` (`NipQuickAdd`, the "Alcohol" `AddRow`), `nutrition-tab.jsx`,
`checkin-modal.jsx` (nips/AFD step), reports nips ring, and the badge library (item 10, `gate:'alcohol'`).
**Add to onboarding** (after the training questions, before macros):
- **"Do you want to track alcohol intake?"** (Yes / No) → store `user.trackAlcohol` (bool).
- If **Yes**: **"Track by day or by week?"** → `user.alcoholPeriod` ('day'|'week').
- If **Yes**: **"Your target — standard drinks per {period}?"** stepper → `user.alcoholTarget` (number).
- If **No**: set `trackAlcohol=false` and **hide all alcohol UI** app-wide — no nip counter on Home/+,
  no alcohol AddRow, no nips ring in Reports, no AFD/nips step in the nightly check-in, no
  alcohol-gated badges. Clean experience.
**Settings:** add an "Alcohol tracking" control (toggle + period + target) so it can be turned
on/off and retargeted any time. Turning it off later hides everything; turning it on restores it.
**Gate helper:** add one predicate (e.g. `alcoholOn()` reading `user.trackAlcohol`) and guard every
alcohol surface with it, rather than scattering checks.
**Don't break:** existing nip→calorie link and check-in prefill **when tracking is ON**.

---

## 2. Life Spider (radar) on the Home screen
**Where:** `home-components.jsx` → `LifeBalanceRadar` already exists (used in `reports-screen.jsx`
at `size={250}`); Home is `home-screen.jsx`. Live values come from `live-state.jsx` `radar`
(Health / Mental / Relationships / Spiritual / Consistency, 0–1 each).
**Change:** add a **compact radar card** to Home (place it under the three north-star rings).
Render `<LifeBalanceRadar values={radar} size={150} />` inside a `C.surf1` card with a
`SectionLabel` ("LIFE BALANCE"). Make the whole card **tappable → navigates to the Reports tab**
(reuse the existing tab-switch the bottom nav uses). Keep it compact so it doesn't push the to-do
list far down.
**Don't break:** the Reports radar (leave it as the full `size={250}` version).

---

## 3. Check-in resets on landscape rotation (state lost)
**Where:** `checkin-modal.jsx` — `CheckinModal` holds `step`/`answers` in `useState`; the reset
runs in a `useEffect([open])`. A rotation that remounts the modal (or a stray `open` toggle / key
change higher up) wipes progress.
**Fix:** make in-progress check-in state survive re-render/rotation:
- Ensure the reset effect keys on `open` **only** and never re-runs mid-session (it already deps
  `[open]` — verify nothing upstream changes `key`/remounts on resize).
- Add a lightweight **draft persist**: on each `setAnswers`/`setStep`, write
  `{step, answers}` to `sessionStorage['compound:checkinDraft']`; restore it on open if present and
  fresh (same day); clear on complete/cancel.
- Do **not** trigger layout-driven remounts on `orientationchange`/`resize`.
**Verify:** start a check-in at step 3, rotate to landscape and back — same step, same answers.

---

## 4. "This Week" in the workout tracker not recording sessions
**Where:** `workout-dashboard.jsx` (the "0/4 workouts" counter + weekly plan) and the Home
`WeekStrip` both read weekly workout data; `live-state.jsx` `buildWeek` is Sun–Sat. Completed
sessions are saved via the workout-session save path (`workout-data.jsx` / `loadWorkouts`).
**Fix:** the "This Week" tally must count **workouts whose timestamp falls in the current Sun–Sat
window**. Investigate:
- Are saved workouts stamped with a `ts`/date that the weekly filter actually matches? (timezone /
  ISO-date mismatch is the usual culprit.)
- Does weekly **rollover** reset the count at Sunday correctly, and does a freshly-saved session
  immediately increment "This Week" (state refresh after save)?
**Fix the data join, not the display** — confirm one source of truth for "sessions this week" and
have both the dashboard counter and any Home strip read it.
**Verify:** log a workout → "This Week" increments immediately and persists across reload.

---

## 5. Alcohol calories missing from the nutrition/calorie summary
**Where:** `nutrition-data.jsx` `dayTotals()` and the Nutrition tab summary (`nutrition-tab.jsx`).
Alcohol kcal are stored via `setAlcoholKcal`/`loadAlcoholKcal` (and AI-logged drinks add to it).
**Fix:** include today's `loadAlcoholKcal()` in the **daily calorie total** and show it in the
breakdown (a distinct "Alcohol" line, not folded into carbs/fat). Keep macro lines (P/C/F) from
food as-is; add alcohol as its own kcal contributor to the total.
**Gate:** only when `trackAlcohol` is on (item 1) — otherwise omit entirely.
**Verify:** log a beer → daily total rises by its kcal and an "Alcohol" line appears.

---

## 6. Meal questions — selected-answer highlight + loading state
**Where:** `nutrition-tab.jsx` → `MealQuestionsFlow` (and the to-do "No response" copy).
**Fix (a):** when the user taps an option chip, **highlight the chosen chip** immediately (amber
fill / border per the chip's active style) so the tap clearly registered — before/while the
re-estimate call runs.
**Fix (b):** while the answer is processing (the `window.claude.complete` re-estimate), show a
**"Loading…"** indicator on that meal/question instead of "No response". Restore to the updated
value on success; on failure show a retry affordance, not a silent "No response".
**Don't break:** the snapshot-at-open queue and the visible macro update after answering.

---

## 7. Alcohol "+" button in the nutrition section is dead
**Where:** `nutrition-tab.jsx` — the alcohol add affordance should open the existing flow.
**Fix:** wire the alcohol "+" to open the **existing** `NipQuickAdd` (from `add-button.jsx`,
already exported on `window`) — same flow as Home's + → Alcohol. Don't fork the logic.
**Gate:** only render when `trackAlcohol` is on (item 1).
**Verify:** tapping it opens the drink sheet; logging a nip updates the nips ring + calorie total.

---

## 8. Body measurements — AI plausibility check + unit selection
**Where:** `body-progress.jsx` → `LogMeasurementsModal` / `saveMeasurements`. `BODY_METRICS` are
currently all `unit:'cm'`; nothing validates the numbers (a 999cm chest saves silently).
**Fix — validation:** before save, run an AI plausibility pass over the entered fields (reasonable
human ranges, and sanity vs. the user's last entry / height). If a value is implausible (e.g.
chest 999cm, or a 30cm jump overnight), **flag it and ask a clarifying question** ("999 cm seems
off — did you mean 99.9 cm?") and let the user confirm/correct **before** it's written. Don't hard-
block a confirmed value, but never save an obviously-bad one without a prompt. Apply to **all**
fields.
**Fix — units:** add a **cm / inches** unit preference set in onboarding and editable in Settings
(`user.measureUnit`). Store the raw number + unit; display and validate in the chosen unit. Convert
historical entries for display so trends stay consistent.
**Verify:** entering 999 triggers a clarifying prompt; switching to inches relabels and rescales.

---

## 9. Progress photos — camera + library picker
**Where:** `body-progress.jsx` → `ProgressPhotosCard` (the camera icon).
**Fix:** the camera affordance should let the user choose **take a photo (native camera)** OR
**pick from library**. On mobile web the clean path is a file input:
`<input type="file" accept="image/*" capture="environment">` for the camera and a second
`accept="image/*"` (no `capture`) for the library — or one input plus an action sheet ("Take photo"
/ "Choose from library") that sets `capture` accordingly. Persist the chosen image as the app
already stores progress photos.
**Verify on the phone (S24):** tapping offers both; each returns an image that saves to the gallery.
**Note:** true native camera vs. library distinction only works in the installed PWA / real device —
fine to stub the chooser UI in the prototype.

---

## 10. Badges — full expansion to the 500-badge library
**The library is built and in the repo: `badge-library.jsx`** (generated — exports
`BADGE_LIBRARY` [500], `BL_NEW_GLYPHS`, `BADGE_LIB_CATEGORIES`). A visual preview of the whole wall
is in **`Badge Wall Preview.html`**. Integrate it into the real badge system in `badges.jsx`.

**10a. Remove the $150 cash reward flow entirely.** Search for the reward/claim/bank-details flow
on the 365-day AFD badge and delete it — no payment, no bank collection anywhere.

**10b. 365-day AFD badge → celebration screen only.** Badge `b013-365` carries
`special:'celebration'`. Keep the badge; on earning it, show a **genuine landmark celebration
screen** (full-bleed, amber, weighty type, "365 days. One full year alcohol-free.") — purely
ceremonial, no money. `#499` (`special:'ultimate'`) and `#500` (`special:'grandmaster'`) get their
own elevated treatments too.

**10c. Adopt the library as the catalog.** Replace the legacy ~36-entry `BADGES` array in
`badges.jsx` with `BADGE_LIBRARY`. Merge `BL_NEW_GLYPHS` into `BADGE_GLYPHS` (new keys: droplet,
leaf, plate, people, brain, ruler, steps, run, bike, swim, camera, snowflake, medal). Swap
`BADGE_CATEGORIES` for `BADGE_LIB_CATEGORIES` (now 17 categories + ALL). The wall's filter,
show-locked toggle, tile, and detail modal already work — they just render more.

**10d. SHIP THE PROVABLE BADGES ONLY (James's decision).** Each badge's `track` field says what
proves it:
- **WIRE NOW** — `track` is `nips | checkins | food | workouts | measurements` (these stores
  exist). **229 badges.** Extend `buildBadgeContext` + `evaluateBadge` to cover them (counts,
  streaks, cumulative totals — most are simple thresholds).
- **DO NOT SHOW YET** — `track` is `sleep | mind | water | goals | social | app | manual | mixed`.
  **271 badges.** These depend on tracking the app doesn't have. **Filter them out of the wall for
  now** (don't render greyed placeholders, don't fake data). The cleanest approach: a single
  `READY_TRACKS = ['nips','checkins','food','workouts','measurements']` set and render only
  `BADGE_LIBRARY.filter(b => READY_TRACKS.includes(b.track))`. When a future tracker ships, add its
  key to `READY_TRACKS` and those badges appear automatically — no data migration. The full
  500-entry library stays in the file as the roadmap; only the provable subset is live.
- The earned-count header and category counts must reflect the **live (provable) subset**, not 500.

**10e. Alcohol gate.** Badges with `gate:'alcohol'` (43 total — the AFD streaks + Alcohol Tracking
groups) must be hidden when `user.trackAlcohol` is off (item 1). The preview's top toggle
demonstrates the behaviour.

**10f. Performance.** 500 tiles in one grid — virtualise or render per-category sections (the
preview groups by category in the ALL view) so the wall stays smooth. Keep the
earned-count/progress header reading off the full evaluated set.

**Don't break:** the existing `BadgeTile` / `BadgeDetailModal` / progress-bar UI, the share button,
or `buildBadgeContext`'s real-data reads. Extend, don't rewrite.

---

### A note on scale (worth a quick chat with James)
500 is a lot, and ~270 depend on tracking COMPOUND doesn't have yet (sleep, mood, water, goals,
social). Recommendation: ship **10a–10e now** wiring the **229 already-provable** badges, render the
rest as a visible "coming soon" roadmap, and light them up as each new tracker is built. That keeps
the wall honest (no badges that can never trigger) while showing the full ambition.

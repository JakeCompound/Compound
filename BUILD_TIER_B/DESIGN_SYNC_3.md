# COMPOUND — Design-tool sync, Round 3 (COMPLETE)

> Paste into the design tab. Everything below is live in the production build.
> Keep all COMPOUND styling (near-black `#070709`, amber `#F2A30F` = `C.accent`,
> Barlow Condensed / JetBrains Mono / Outfit). File/component names are the
> prototype's own. This supersedes the earlier "in progress" version.

---

## A. Mid-week join (encouragement)
- **Home welcome banner** (`home-screen.jsx`), shown only during the partial week
  a user joins in, dismissible. `C.accentSoft` card, `C.accentDim` border, 👋,
  eyebrow "WELCOME TO COMPOUND", title "You're in — ease into it", body ending in
  "**full weekly tracking kicks in Sunday.**" (accent).
- **Day-one deferral** (`todo-list.jsx`): on the exact join day, the **Daily
  Weigh-in** and **Daily Check-in** to-dos are omitted; a dashed 🌱 note says they
  "start **tomorrow**". Workout to-do unaffected; the done-counter hides when empty.
- Workout **urgency** styling is held back during the grace week.

## B. Nutrition — alcohol surfaces
- **Distinct "ALCOHOL — N kcal" line** below the macro bars in the calorie summary
  (red `#E5564B`, its own contributor — not folded into carbs/fat).
- The **Alcohol row** in Today's Log is tappable ("+ ADD") → opens the drink logger.
- Both gated by `alcoholOn(user)` (see F).

## C. Meal questions — highlight + loading (`nutrition-tab.jsx` MealQuestionsFlow)
- Tapping an option **highlights that chip amber instantly**; chips disable while
  the AI re-estimate runs, with a spinner + "Updating your macros…".
- On failure: "Couldn't refresh… **Try again**" + "**Skip for now**" (no silent
  "no response"). Success still shows the "UPDATED · ±N kcal" flash.

## D. Check-in survives rotation (behaviour) (`checkin-modal.jsx`)
- In-progress check-in persists `{step, answers, gratShuffle}` and restores on
  reopen (clears on complete/cancel). No visual change — just don't rebuild the
  modal in a way that wipes state on resize.

## E. Alcohol tracking — opt-in + gate (`onboarding-screens.jsx`, `settings-screen.jsx`, everywhere)
- **Onboarding** gains a final step **`ScreenAlcohol`**: "Do you want to track
  alcohol?" Yes/No. **Yes** reveals a **weekly nip-limit stepper**; **No** hides it.
- **Settings → You**: an **"Alcohol tracking"** ON/OFF row; the weekly-nip-limit
  row only shows when on.
- One predicate `alcoholOn(user)` (`src/alcohol.js`, default ON) gates every
  alcohol surface. When **off**, hide: the Home **Wk Nips ring** (+ nips half of
  the status line), the Home "+" **Alcohol** option, the Nutrition "+ Add item"
  **Drink** option, the check-in **AFD + nips** questions, and the Reports
  **Alcohol-Free streak** + **AFD/nips chart**.

## F. Life Balance radar on Home (`home-screen.jsx`)
- A compact **`LifeBalanceRadar` (size 160)** in a warm-gradient card under the
  three rings, with a "LIFE BALANCE" label and a "**FULL REPORT →**" cue. The whole
  card is tappable → the Reports tab. Reports radar stays the full size 250.

## G. Progress photos — camera / library (`body-progress.jsx` ProgressPhotosCard)
- Tapping a slot opens an action sheet: **"Take a photo"** (native camera) or
  **"Choose from library"** (+ Remove if one exists). Slots show the **thumbnail**
  with a label overlay; the card header shows **N / 4**. (Stored locally, downscaled.)

## H. Body measurements — units + AI check (`body-progress.jsx`)
- **cm / in toggle** in the log modal (top-right); values + labels convert live.
  A **"Measurement units"** row in Settings sets it globally. Body fat stays %.
- On Save, a plausibility check. If a value looks off, a **"DOES THIS LOOK RIGHT?"**
  step flags it with a per-field "**use 99.9cm**" fix, plus "**Back to edit**" and
  "**Save anyway**" — never hard-blocks a confirmed value.

## I. Badges — the 500-library, provable subset (`badges.jsx`)
- The wall is now backed by the 500-badge library but renders **only the ~229
  provable** badges (tracks that exist today). Grouped into **per-category
  sections**; filter chips are ALL + present categories; earned/total counts
  reflect the live subset. Alcohol-gated badge categories (AFD, Alcohol) hide when
  alcohol tracking is off. Locked badges show greyed with progress where known.

## J. "This Week" workouts (behaviour) (`live-state.jsx`)
- The Home rings/week-strip now count a day as "worked out" if a **session was
  logged** (not only if the check-in said so), and update immediately after a
  session is saved.

## K. Per-day workout times (`onboarding-screens.jsx`, `settings-screen.jsx`, reminders)
- Users can train at different times on different days (e.g. weekdays 5pm, Sat 8am).
- Data: `user.workoutTime` = the **usual** time; `user.workoutTimes` = `{ dayIndex: 'HH:MM' }`
  per-day overrides (empty = usual everywhere).
- **Onboarding "Which days do you train?"**: the TimeWheel is relabelled **"Usual
  workout time"**; below it, a new **`PerDayTimes`** list — one row per selected day
  showing "MON — 5:00pm · usual"; tapping a row expands a TimeWheel for that day
  (sets an override, row turns amber and drops "· usual"); an overridden day gets a
  "BACK TO USUAL TIME" reset.
- **Settings → Workout schedule**: edit mode reuses the same `PerDayTimes` control;
  the read view shows one line per time group; the settings-list hint groups days by
  time — e.g. **"Mon · Wed 5:00pm, Sat 8:00am"**.
- The workout **to-do due-time** and the **30-min-before push reminder** both use
  the day's own time.

## L. Meals are editable / deletable (`nutrition-tab.jsx`)
- Tapping a meal row in Today's Log (the photo/name area — badges keep their own
  taps) opens an **"EDIT MEAL"** bottom sheet: name input, a 2×2 grid of numeric
  fields (KCAL / PROTEIN g / CARBS g / FAT g), an amber **Save changes** button,
  and a red-outline **"Delete this meal"** which flips to a confirm pair
  ("Yes — delete it" / "Keep it"). Deleting a drink-meal also un-counts its nips
  from the weekly ring.

## M. Behaviour changes with no new UI (FYI)
- **Branded foods are label-accurate now**: the AI proxy has real web search, so a
  text-only "Musashi 45g protein bar" comes back with official-label macros and
  confidence "high" (the info line says it's from the label). Macros must also
  reconcile with kcal (p×4 + c×4 + f×9) — no more impossible estimates.
- **The install prompt can appear on the sign-in screen** (not just inside the
  app) and no longer misses Chrome's one-shot install event.
- **Event-based push reminders are live** alongside the scheduled three: streak
  milestones (21:30), missed workout (20:00), comeback after 3+ days (18:00),
  workout urgency (12:30), monthly report (09:00 on the 1st) — all honouring the
  existing Notification-preferences toggles.
- **Multi-user is real**: accounts are fully isolated per login (RLS); new users
  see onboarding → the mid-week welcome + day-one deferral on first landing.

## N. Earned calories — lifestyle base, step ledger, walk/run, flip rings
- **Calculator**: the activity steppers are replaced by a **Lifestyle** picker
  (Sedentary / Lightly active / Active / Very active — "your baseline, not your
  ambitions; when in doubt choose lower"). The daily target is the lifestyle
  floor only; a note explains every workout/walk/run/step-log ADDS to that day's
  allowance. Legacy users see a dashed ⚡ "Earn calories from movement —
  RECALC →" nudge on the Nutrition tab.
- **Workout tab — "MOVEMENT TODAY" card** (under Saved Workouts): progress strip
  toward the daily step goal, meta "9,500 / 10,000 STEPS", a green "EARNED TODAY
  · +N KCAL" line, the day's ledger rows (plain 👣 "+3,000 steps" rows in
  neutral; 🚶/🏃 walk/run rows in accent — "certified efforts" — showing km/min/
  steps/+kcal, each deletable ✕), and two buttons: **+ LOG STEPS** (grey) and
  **+ WALK / RUN** (amber).
- **Log steps sheet**: one-tap +1,000 / +2,500 / +5,000 chips or an exact-number
  input. **Walk/Run sheet**: Walk|Run segment → two pathways: "⌚ From my
  smartwatch" (calories + optional steps) or "📏 Estimate it for me" (distance +
  time + optional HILLY / HOT DAY / COLD DAY / CARRYING WEIGHT chips, live
  "≈ 6,500 STEPS · +235 KCAL" preview).
- **Nutrition summary**: a green **EXERCISE +N kcal** line above the Alcohol
  line; KCAL LEFT includes earned kcal live.
- **Home rings**: **STEPS replaces the Workouts ring**. All three rings flip
  weekly ↔ daily on tap, with a small top label (WEEK / TODAY / WK AVG):
  Nips (week vs limit ↔ today vs remaining÷days-left guide), Steps (week vs
  goal×7 ↔ today vs goal), Life Score (today ↔ week average). Workouts remain
  in the status line ("Workouts 2/3 — 1 to go."), week strip, and their tab.
- **Check-in**: the steps question prefills from the day's ledger; raising it
  tops the ledger up.

---

### Not built yet (roadmap)
365-AFD full-bleed celebration screen; the ~271 non-provable badges (need new
trackers: sleep/water/mind/goals/social); photo cloud backup; event-based
notifications (streaks/PRs/missed).

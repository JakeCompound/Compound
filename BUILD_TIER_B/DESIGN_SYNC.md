# COMPOUND — Design-tool sync (bring the prototype up to the production build)

> Paste this into the design tab. These are the changes made to the live
> Vite/React build since the prototype was exported. Apply them to the prototype
> so both match. Component/file names below are the prototype's own. Keep ALL
> existing COMPOUND styling (near-black `#070709`, amber `#F2A30F`, Barlow
> Condensed / JetBrains Mono / Outfit). Nothing here changes the visual system —
> it's behaviour, copy, and a few new controls.

## Calculator — `macro-calc-screen.jsx` + `nutrition-data.jsx`
1. **Stats page must fit the phone.** Make the calculator a flex column: scroll
   area `flex:1; min-height:0; overflow-y:auto`, header + primary button pinned
   (`flex-shrink:0`). On STATS, stack Age/Height/Weight/Body-fat in ONE column
   (full-width) so the Height +/- aren't clipped at ~390px.
2. **Replace the ACTIVITY multiplier model.** Remove the 5 `ACTIVITY` SelectCards.
   On step 2 collect three steppers instead: **Typical steps/day** (default 7000,
   1000–25000, step 500), **Strength sessions/week** (default = training days,
   0–14), **Avg minutes/session** (default 45, 10–120, step 5).
   New TDEE = `bmr*1.30 (maintenance) + steps*weightKg*0.00045 (NEAT) +
   (sessions*minutes*(6*3.5*weightKg/200))/7 (training)`. Keep these as named,
   tunable constants. Cut/gain rate math, Katch-McArdle, protein 0.6 g/lb, fat
   preference, carb-fill and 10-kcal rounding all unchanged. Default goal pace =
   gentle 0.5%/wk. Saved targets store `steps/sessions/minutes` (not `activity`).
   (Sanity: 88.5kg, 29y, 173cm, 5000 steps, 3×30min → maintenance ≈2690, cut ≈2090.)
3. **Add a 3rd step "Dial in macros"** (before "Lock in targets"): show the
   calorie target + a live "X kcal remaining / over" readout. Protein/Carbs/Fat
   each a gram stepper, seeded from the computed targets. If used > target,
   disable "Lock in targets" and show a quiet amber line ("Over by N kcal — trim
   a macro to fit."). Soft protein-floor warning below the 0.6 g/lb rec (don't
   block). Persist the user-edited macros.

## Steppers — `compound-ui.jsx` → `Stepper`
- Round +/- results to the step's decimal precision (so 0.1 steps give 89.2, not
  89.199999). `decimals = (String(step).split('.')[1]||'').length`.

## Onboarding — `onboarding-screens.jsx`
1. **Training days screen → "Which days do you train?"** Replace the 1–7 count
   grid with a 7-button weekday picker (Sun–Sat) writing `workoutDays` (array of
   day indices, 0=Sun). The count derives from the days picked (`trainingDays =
   workoutDays.length`). Add a **workout time** TimeWheel below it. Copy: "Pick the
   days you'll train, and a time. A gentle reminder lands 30 minutes before."
2. **Gratitude builder** (`ScreenGratitudeBuilder`): keep progress strip +
   category tabs + prompt + input + example chips in a FIXED top block; put only
   the chosen-items list in its own scroll area (`flex:1; min-height:0;
   overflow-y:auto`) so adding items never pushes the pickers down.
3. **Weigh-in window** is now **3:00–8:00 AM** (TimeWheel hourMin 3 / hourMax 8;
   update the caption text too).

## Nightly check-in — `checkin-modal.jsx` (gratitude step)
- Shuffle **6** library items (was 3). User **ticks the ones that apply, minimum
  2** to continue (was "acknowledge all 3"). Add a **Refresh** button that swaps
  only the un-ticked slots, pulling items NOT currently shown and cycling the
  whole library before any repeat (ticked items stay pinned). Keep the optional
  "anything new today?" field and the `DEFAULT_GRATITUDE` fallback.

## Nutrition tab — `nutrition-tab.jsx`
- Add a **"+ Add item"** button (Today view) → a small chooser sheet with **Meal**
  and **Drink**, opening the SAME flows as Home's + button (`FoodAdd` /
  `NipQuickAdd`). Drinks must still feed the Weekly Nips ring and day calories.
- Empty-state copy → "Tap + Add item above to log a meal or a drink."

## Week model — everywhere
- The week now runs **Sunday → Saturday** (was Monday-based). Update the Home week
  strip (labels `S M T W T F S`, "SUN – SAT"), `buildWeek`, the workout-week key,
  `weekPos` (0=Sun), and `sessionsThisWeek`.

## Home — workout to-do (`todo-list.jsx`)
- The workout to-do gets **Complete** and **Postpone** buttons.
- **Postpone** → bottom sheet: pick a free future day THIS week (exclude days
  already scheduled and past days) + a **required reason** chip; move the session
  to that day (week override). A **missed** workout uses the same sheet (button
  reads "Move it").
- After **>4 postpones in a week**, offer to make the new day the **default**
  workout day (updates `workoutDays`).

## Home — plateau prompt (`live-state.jsx` `detectPlateau` + Home card)
- Make it **recomp-aware**. Keep the existing gates (4 weigh-ins, 4 weeks, <0.7%
  drift, 3 sessions/2wk, 21-day re-nudge). When the scale is flat, cross-check:
  **strength up** (a PR in 21 days or rising e1RM) OR **waist down** (≥0.3 cm) →
  show an encouraging "recomposition — hold the course" card, NO cut. Otherwise
  it's a **true stall**: offer the smaller lever — **−120 kcal/day** (hard floor
  ~BMR×1.1) **or +1,500 steps/day** — user-confirmed, paced (sets the 21-day
  guard). If waist data is missing, prompt to log a waist measurement.

## Settings — `settings-screen.jsx`
1. Sub-pages (Profile, Goals, Reminders, Equipment, Nip limit, Workout schedule)
   are **read-only by default** with an **EDIT** button top-right (Done returns).
   Keep one-tap toggle rows (Food tracking) as-is.
2. Row **hint** text → Outfit ~12px, `C.textMid`, normal spacing (was 9.5px mono,
   too small). Keep mono only for numeric/label tags.
3. New **"Workout schedule"** line under the **You** group (days + time; count
   derives). Remove the standalone "Training days / week" stepper from Goals.
4. **Notification preferences:** remove "Sunday warning". Add **Workout reminder**
   ("30 min before your set workout time") and **Missed workout** ("nudge to move
   it to another day"). "Workout urgency" hint → "Midday nudge when 2 days & 2
   workouts remain".

## Not in the prototype's scope (server-side, Phase 6)
- Actual push-notification delivery, cloud sync (Supabase), the AI proxy. The
  prototype only needs the in-app UI/behaviour above.

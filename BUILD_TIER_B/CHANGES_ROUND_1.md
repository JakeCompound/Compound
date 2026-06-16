# COMPOUND — Change Round 1 (real-use feedback from James)

> **For Claude Code.** These are fixes/changes after first-run testing of the migrated app.
> Component names are preserved from the original prototype; file locations may now be under
> `src/`. Where I name a function/component, search the repo for it. Keep all COMPOUND visual
> styling (near-black `#070709`, amber `#F2A30F`, Barlow Condensed / JetBrains Mono / Outfit).
> Do **one numbered item at a time**, show James, then move on. Ask before anything destructive.

---

## 1. Weight stepper shows floating-point garbage (89.1 → 89.19999999)
**Where:** `compound-ui.jsx` → `function Stepper`. The +/- handlers do
`onChange(Math.min(max, value + step))` and `onChange(Math.max(min, value - step))`.
With `step={0.1}` (the Home weigh-in, `home-extras.jsx` → `WeighInModal`) JS float math produces
`89.19999999999999`.
**Change:** round every stepper result to the step's decimal precision. e.g.

```js
const decimals = (String(step).split('.')[1] || '').length;
const round = (n) => +n.toFixed(decimals);
// + button:  onChange(round(Math.min(max, value + step)))
// − button:  onChange(round(Math.max(min, value - step)))
```

**Don't break:** integer steppers (step=1) must stay integers; this handles them (decimals=0).
Applies globally — good, it fixes the same latent bug everywhere `Stepper` is used.

---

## 2. Gratitude builder: chosen items push the picker down (endless scrolling)
**Where:** `onboarding-screens.jsx` → `ScreenGratitudeBuilder`. The category tabs + example
chips + text input sit above the growing list of items the user has added. Each add grows the
list and shoves the pickers down, so you must scroll back up to add more.
**Change:** lock the **pickers in place** and let only the **chosen-items list scroll**:
- Keep category tabs + current-category prompt + example chips + input field in a fixed,
  non-scrolling block at the top.
- Put the "your items" list below it in its own scroll container with a capped height
  (e.g. `flex: 1; overflow-y: auto; min-height: 0`), so adding items never moves the pickers.
**Don't break:** the spread-gating logic (min items across ≥3 areas) and the category progress bar.

---

## 3. Calculator "Your Stats" page overflows the phone frame (height +/- off-screen, wrong ratio)
**Where:** `macro-calc-screen.jsx` → `MacroCalculator`, `step === 0` (the STATS page with
Gender / Age / Height / Weight / Body-fat). On the device it renders taller than the frame, so
the Height stepper's +/- buttons sit off the bottom and the whole screen's proportions look off.
**Change:** constrain the calculator to the device viewport like the other screens: the outer
container is `height:100%; display:flex; flex-direction:column`, the **scroll area** (`flex:1;
overflow-y:auto; min-height:0`) holds the fields, and the primary button stays pinned in a fixed
footer. Verify on a ~390×844 viewport that every control (esp. Height +/-) is reachable.
**Don't break:** STEP 2 (activity & goal) layout, the live target preview card.

---

## 4. Calories are too generous — replace activity level with steps + training inputs
**Where:** `nutrition-data.jsx` (`ACTIVITY`, `calcTargets`) + `macro-calc-screen.jsx` STEP 2.
**Problem:** the 5 flat multipliers (1.25–2.05 ×BMR) overestimate. James wants accuracy driven by
real inputs.
**Change — inputs:** remove the `ACTIVITY` SelectCard list. Replace with three steppers:
- **Typical steps / day** — default 7000, range 1000–25000, step 500.
- **Strength sessions / week** — default `user.trainingDays || 3`, range 0–14.
- **Avg minutes / session** — default 45, range 10–120, step 5.

**Change — formula** (additive model; replaces `bmr * mult`). Use the **MODERATE** dials below —
deliberately mid-range (between a lean estimate and the old generous ×1.65), chosen because the
plateau loop in #12 does the real calibrating, so the start just needs to be sane and sustainable:
```
bmr            = Mifflin-St Jeor (or Katch-McArdle if body-fat known)   // unchanged
maintenanceBase = bmr * 1.30                       // RMR + TEF + daily living (MODERATE)
stepsKcal      = steps * weightKg * 0.00045        // NEAT, bodyweight-scaled (MODERATE)
trainingKcal/d = (sessions * minutes * (6 * 3.5 * weightKg / 200)) / 7   // 6 METs lifting (MODERATE)
tdee           = maintenanceBase + stepsKcal + trainingKcal/d
```
Then apply the existing goal/rate cut/gain math to `tdee`. **Default the goal pace to gentle
(0.5%/wk)** so the first target loads conservatively.

**Sanity check** (James: 88.5 kg → 82 kg, 29 yr, 173 cm male, 5 000 steps, 3 × 30 min):
Maintenance ≈ **2,690 kcal**; gentle 0.5%/wk cut target ≈ **2,090 kcal/day** (the agreed starting
point). For reference the old ×1.65 model gave ~3,015 maintenance — too generous.
Keep `1.30`, `0.00045`, and `6` (MET) as **named constants** so we can tune after real-world use.
**Don't break:** Katch-McArdle path, protein 0.6 g/lb, fat-pref %, carbs-fill, rounding to 10 kcal.
Update any place that reads `targets.activity` (e.g. one-tap recalc seeding) to the new fields
(`steps`, `sessions`, `minutes`).

---

## 5. Let the user adjust macros before continuing — locked to the calorie target
**Where:** `macro-calc-screen.jsx`, after the calculator computes protein/carbs/fat (before
"Lock in targets").
**Change:** add an editable macro step. Show the **calorie target** and a live
**"X kcal remaining / over"** readout. Give protein / carbs / fat each a stepper (g). As the user
edits, recompute `used = P*4 + C*4 + F*9`:
- show `target − used` as remaining (green) or over (red);
- if **over**, disable "Lock in targets" and show a **quiet, unobtrusive inline note** (a small
  amber line under the readout, e.g. "Over by 80 kcal — trim a macro to fit." — NOT a blocking
  modal/alert) until `used ≤ target`. (i.e. raising one macro forces lowering another — exactly
  the requested behaviour.)
- keep a soft **protein floor** at the 0.6 g/lb recommendation (gentle inline warning, don't hard-block).
**Don't break:** the saved `targets` object shape — store the user-edited protein/carbs/fat.

---

## 6. Workouts-per-week: one source of truth + clear edit point
**Where:** `workout-dashboard.jsx` (`WeeklyPlan` → `makeWeeklyPlan(user.trainingDays || 3)`,
`SubHeader sub={`${user.trainingDays||3}-day split`}`) and the dashboard's "0/4 workouts" counter.
**Problem:** the dashboard counter and the plan disagree (saw "0/4" while plan said "3-day split")
— they're reading different numbers/defaults.
**Change:** make **both** derive from a single `user.trainingDays`. Confirm onboarding
(`ScreenTrainingDays`) reliably sets it, and that **Settings → Goals → "Training days / week"**
(already exists in `SettingsGoals`) edits the same value. If `trainingDays` is ever unset, pick
ONE default everywhere (3). Surface "Workouts / week" prominently so James can change it.
**Don't break:** the weekly-plan split generator for each day-count.

---

## 7. Settings text is hard to read
**Where:** `settings-screen.jsx` → `SettingsRow` `hint` (and similar): JetBrains Mono at
**9.5px**, color `C.textLow`, wide letter-spacing — too small/low-contrast for body text.
**Change:** make hints legible — Outfit (not mono) ~12px, color `C.textMid`, normal spacing.
Keep mono only for genuinely numeric/label tags. Apply the same bump to other cramped mono hint
text across the settings sub-pages.
**Don't break:** the uppercase Barlow section labels and overall layout rhythm.

---

## 8. Settings: show fixed values with an "Edit" button (stop accidental edits)
**Where:** `settings-screen.jsx` sub-pages (`SettingsGoals`, `SettingsProfileEdit`,
`SettingsReminders`, etc.) currently render editable steppers/inputs immediately, so values change
on an accidental tap.
**Change:** make each sub-page **read-only by default** — show current values as fixed text. Add an
**EDIT** button top-right (pass as the `right` prop already supported by `SettingsHeader`). Tapping
EDIT reveals the steppers/inputs; a **Done** action returns to read-only. Apply to Goals, Profile,
Reminders, Equipment, Weekly nip limit.
**Don't break:** the values still persist via `set(...)`; the direct ON/OFF toggle rows
(Food tracking) can stay as-is (intentional one-tap).

---

## 9. Add a meal directly from the Nutrition tab
**Where:** `nutrition-tab.jsx`. Empty state currently says *"Hit the + on Home to add a meal."*
The meal-logging flow already exists in `add-button.jsx` (photo/text → AI estimate).
**Change:** add an **"+ Add meal"** action in the Nutrition tab (button in the header or a FAB)
that opens the **same** meal-logging flow used by Home's + button. Reuse it — don't fork the logic.
**Don't break:** `addFood`, the meal-questions queue, day totals.

---

## 10. Add a drink directly from the Nutrition tab
**Where:** `nutrition-tab.jsx` + the alcohol/drink flow in `add-button.jsx`
(`setNipsToday` / `setAlcoholKcal`, ~65 kcal per nip; drinks count toward the day's calories).
**Change:** add an **"+ Add drink"** action in the Nutrition tab that opens the existing
alcohol/drink logging flow. Reuse the existing path so the Weekly Nips ring and calorie totals
stay in sync.
**Don't break:** nip tally ↔ check-in prefill sync, the alcohol-kcal → `dayTotals` link.

---

## 11. Nightly gratitude: pick from 6, tick what applies (min 2), refresh the rest
**Where:** `checkin-modal.jsx` → the `'gratitude'` step. Today it shuffles **3** items and forces
the user to acknowledge **all 3** (`gratitudeAcked.every(Boolean)` gate). On an off day, an item
may not feel true — forcing all 3 is wrong.
**Change:**
- Show **6** items from the library (shuffle at open).
- Let the user **tick the ones that apply**; require a **minimum of 2** selected to continue
  (update the step-complete check to `selectedCount >= 2`).
- Add a **Refresh** button that re-rolls **only the un-ticked** slots with other library items
  (keep ticked ones in place). If the library has ≤6 items, refresh just reshuffles the unticked.
- Keep the optional "anything new today?" field that grows the library.
**Why:** matches the ADHD-friendly "consistency over perfection" intent — never force a false
gratitude, always give an easy path to 2 true ones.
**Don't break:** `DEFAULT_GRATITUDE` fallback when the library is empty; editing-an-existing-checkin
prefill; the badge that counts library size.

---

## 12. Recomp-aware adaptive plateau engine (don't just cut on a flat scale)
**Where:** `live-state.jsx` → `detectPlateau` / `dismissPlateau`; surfaces via the existing plateau
prompt; ties to the one-tap recalc in `macro-calc-screen.jsx`.
**Problem:** today `detectPlateau` is **scale-only** — it fires when weight is flat (<0.7%
bodyweight drift over 4+ weeks) with 3+ recent workouts, then just suggests "recalculate" (which
barely changes the number because it only re-reads current weight). A flat scale can mean a true
stall **or** body recomposition (losing fat + gaining muscle at once). Cutting calories during
recomp is the wrong move.
**Change — make it multi-signal.** When the scale is flat, cross-check before suggesting anything:
- **Strength trend** — from logged workouts / PBs / volume (`loadWorkouts`, `workout-history.jsx`).
  Lifts trending **up** = muscle being gained.
- **Waist / measurements** — from body measurements (`measurements`/`body-progress.jsx`).
  Waist trending **down** = fat being lost.
- (Optional) progress photos as a soft visual signal.

**Decision logic:**
- **Flat scale + (lifts up OR waist down)** → *recomposition.* **Do NOT cut.** Show an encouraging
  message instead, e.g. *“Scale’s flat, but your lifts are up and your waist is down — you’re trading
  fat for muscle. Hold the course.”*
- **Flat scale + lifts flat/declining + waist flat** → *true stall.* Offer a gentle, one-tap
  adjustment (see guardrails).

**Adjustment guardrails (true-stall case only):**
- Offer the smallest effective change: **−100–150 kcal/day (~5%)**, OR an equal-value
  **“+1,500 steps/day”** alternative (often better than eating less) — let the user pick.
- **Always user-confirmed** (one tap to accept; never a silent change).
- **Hard calorie floor** so it can never spiral (e.g. never below ~1,600 kcal for James; in general
  don’t go under BMR × 1.1).
- **Paced:** at most one adjustment per ~2–3 weeks (reuse the 21-day dismissal guard).
- If waist data is missing, **prompt for a waist measurement** as part of the check — it’s the
  cleanest fat-loss signal when bodyweight is flat.
**Don't break:** the existing 4-weigh-in / 4-week / 0.7% thresholds and the 21-day re-nudge guard;
the `compound:plateauDismissed` key.

---

### Suggested order
Quick wins first: **1, 7, 8, 2, 3** → then **6, 9, 10, 11** → then the calc work **4, 5** (do 4
before 5). Save **12** for last — it leans on real logged history (weigh-ins, workouts,
measurements) so it's best built once the rest is solid. Test each on a ~390×844 phone viewport.

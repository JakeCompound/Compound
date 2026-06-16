# COMPOUND — Add Button + Nutrition Tracker Build Spec (DISCOVERY COMPLETE)

## + Add button on Home (Option D) — single "log anything" entry
- **Alcohol (nip)** — quick add nips. Today's running tally per date; feeds Weekly Nips ring + PREFILLS nightly check-in nip question (sync both ways). Pour chips: +Nip, +Beer (1.5), +Wine (2).
- **Food** — only in the + menu when diet-tracking is ON. Photo (optional) + description.
- **Mood: DROPPED** (permission-slip risk for ADHD). Emotion stays retrospective via nightly calm rating; Reports already does AFD × calm.

## Onboarding change
- Ask: "Will you be tracking calories & food?"
  - YES → run the calculator, set calorie + macro targets, diet-tracking ON.
  - NO → diet-tracking OFF; Nutrition tab = just the AI search/chat bar. Still record body data (weight etc.) BUT do NOT advise calories/macros, and SKIP the gain/lose goal + activity-level questions.
- Toggle also in Settings (turn food tracking on/off any time).
- Rename "Sex" → "Gender" in the calculator.

## Targets / calculator
- Replicate rippedbody.com macro calculator IN-APP. Inputs: gender, age, height, weight, body-fat % (optional), activity, goal. Fetch real formula at build.
- Goal: simplified **Cut / Maintain / Gain**, slow-to-medium rates only (no aggressive).
- Protein fixed **0.6 g/lb bodyweight/day** (editable). Carbs & fats OPTIONAL, user-entered, can't push total over calories.
- Lives in onboarding; re-runnable in Settings via "Recalculate calories" — ONE-TAP SMART (prefills current logged weight, just confirm activity/goal).
- PLATEAU auto-prompt: weight flat >~1mo while workouts consistent + sleep/steps steady → suggest recalculate.

## Food logging + AI (Option A: add immediately)
- Optional photo (camera OR library) + text → AI uses BOTH (vision) or text-only → best estimate added to the day IMMEDIATELY, never blocks.
- 3 interactive badges per meal (tappable): (1) Confidence red/orange/green, (2) Health red=unhealthy/orange=neutral/green=healthy LENIENT, (3) Info (i) — encouraging/informative, never scolding. Always present.
- Photo doubles as the visual diary image.

## Meal Questions (the follow-up loop) — NON-urgent
- AI asks max 1–2 high-value questions per meal. Never urgent (answer any time).
- Surfaced as ONE button with a little RED notification number (top-right) = open-question count. Tapping launches STRAIGHT into the questions.
- Each question screen: the meal PHOTO (when available) with the question underneath. Multiple-choice tap-chips + a custom write-your-own field. NO continue button — each answer jumps straight to the next (zero friction) → returns to Nutrition screen when done.
- Answering VISIBLY updates the meal's cals/macros (e.g. "+90 cal from the oil").
- Each open question also spawns a "Nutrition Question" to-do on Home.

## Nutrition tab (food tracker) — when diet-tracking ON
- Top toggle: Today / Ask.
- Today: daily rings/bars (calories remaining + protein primary; carbs/fats if set) → today's food log (rows: photo thumb, name, calories, 3 badges) → Meal Questions button (with red count).
- Ask: existing AI nutrition Q&A chat (always available).
- When diet-tracking OFF: tab = just Ask COMPOUND chat + a "Turn on food tracking" prompt.

## Suggested build phases
1. Onboarding question + diet-tracking flag + Gender rename + skip goal/activity when OFF.
2. Calculator (rippedbody replica) in onboarding + Settings recalculate (one-tap smart).
3. + Add button on Home → Alcohol quick-add (nip tally per day) + check-in prefill sync + Weekly Nips ring from live tally.
4. Food logging (photo+text → AI estimate via window.claude) + day store + targets.
5. Nutrition tab redesign (Today/Ask, rings, food log w/ 3 badges).
6. Meal Questions flow + red-count button + Home "Nutrition Question" to-do.
7. Plateau auto-prompt.

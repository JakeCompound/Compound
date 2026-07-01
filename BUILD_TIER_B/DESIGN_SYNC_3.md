# COMPOUND — Design-tool sync, Round 3 (encouragement + Change Round 3 in progress)

> Paste into the design tab. Covers changes made in the live build AFTER
> `DESIGN_SYNC_2.md`. Keep all COMPOUND styling (near-black `#070709`, amber
> `#F2A30F` = `C.accent`, Barlow Condensed / JetBrains Mono / Outfit). File/
> component names are the prototype's own. Change Round 3 is partway through —
> this reflects what's shipped so far (more items to follow).

---

## A. Mid-week join — gentle onboarding for people who join partway through a week

Someone who joins on, say, Wednesday shouldn't feel "behind" for a week they
only caught the tail of. Model: record the join date; treat everything up to the
first **Sunday** after joining as a grace period (week runs Sun→Sat).

**A.1 Home welcome banner** (`home-screen.jsx`) — shown only during that partial
first week, **dismissible**. Place it near the top of Home (above the rings).
- Card: `C.accentSoft` bg, 1px `C.accentDim` border, radius 14, padding 14×16,
  a 👋 on the left, an ✕ dismiss on the right.
- Eyebrow (mono 9px, ls 1.6, `C.accent`): "WELCOME TO COMPOUND".
- Title (Barlow Condensed 700, 17px, uppercase): "You're in — ease into it".
- Body (Outfit 12.5px, `C.textMid`): "You joined mid-week, so there's nothing to
  catch up on. Log what you can, build the habit — **full weekly tracking kicks
  in Sunday.**" (the last clause in `C.accent`).
- Dismiss persists (won't reappear after the user closes it).

**A.2 Urgency held back during the grace week** — the workout "tight margin" /
"X workouts in Y days" urgency styling (`home-components.jsx` `WorkoutBanner`) is
suppressed while the user is still in their first partial week (no "you're
behind" pressure on day one).

---

## B. Day-one deferral of the daily weigh-in & check-in (`todo-list.jsx`)

On the **exact calendar day the user joins**, the **Daily Weigh-in** and **Daily
Check-in** to-dos are **omitted from Today's To-Do list** (so a brand-new user
never sees a "MISSED" or "DUE" nag on day one). In their place, a gentle note:
- Dashed `C.accentDim` card, 🌱 icon, Outfit 12.5px `C.textMid`:
  "Day one — nothing to catch up on. Your daily **weigh-in** and **check-in**
  start **tomorrow**. Settle in tonight." (emphasis words in `C.text` / the
  "tomorrow" in `C.accent`).
- The **workout** to-do is unaffected (it's tied to the days the user picked).
- The "X/Y DONE" counter is **hidden when the list is empty** that day.
- From the next day on, both dailies appear and behave exactly as before.

---

## C. Nutrition — distinct "Alcohol" line in the calorie summary (`nutrition-tab.jsx`)

Alcohol kcal already count toward the daily total (the ring), but the macro
breakdown showed only P/C/F, so the alcohol portion was invisible. Add a distinct
line beneath the macro bars in the summary card, shown when there's alcohol kcal
**and** alcohol tracking is on:
- A top divider (1px `C.line`), then a row: label "ALCOHOL" (mono 9px, ls 1.4,
  in the alcohol red `#E5564B`) on the left, "N kcal" (mono 11px, `C.textMid`) on
  the right.
- It is its **own** contributor — never folded into carbs/fat. The ring total
  continues to include it.

**New gate concept — `alcoholOn(user)`:** a single predicate (reads
`user.trackAlcohol`, defaults **on**) that every alcohol surface will guard on.
The full alcohol opt-in (onboarding Yes/No + period + target, Settings toggle,
and hiding every alcohol surface when off) is a **later Round 3 item** — for now
just know the Alcohol line respects this gate.

---

## D. Check-in survives rotation (behaviour only — no visual change) (`checkin-modal.jsx`)

An in-progress nightly check-in used to reset if the modal remounted (e.g. a
landscape rotation). It now persists a draft (`{step, answers, gratShuffle}`) and
restores it on reopen, clearing on complete/cancel. No UI change — just don't
rebuild the modal in a way that wipes `step`/`answers` on resize.

---

### Still to come in Change Round 3 (not yet shipped)
Alcohol opt-in onboarding + Settings toggle & full surface gating; Life Spider
radar card on Home; workout "This Week" tally fix; meal-question chip highlight +
loading state; wire the Nutrition alcohol "+"; measurements AI plausibility check
+ cm/inch units; progress-photo camera/library picker; and the 500-badge library
(provable subset only). I'll sync these as they land.

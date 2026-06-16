# Your Setup Guide — Getting COMPOUND Live

Plain-English, no coding. This is the ~30–45 minutes of clicking that's **yours** to do.
Everything in here happens **on your computer**; your phone only comes in at the very end.

Work through it with **Claude Code** open on this repo — when a step says "Claude Code does
X," just ask it and point it at `BUILD_TIER_B/RUNBOOK.md`.

---

## Order of play

### 1 · GitHub  ·  ~2 min  ·  *you*
This code is already (or about to be) in your GitHub repo. That's the home base everything
else connects to. Nothing to do here but have the repo open.

### 2 · Supabase — your data vault  ·  ~10 min  ·  *you + Claude Code*
1. Go to **supabase.com** → sign up (use your Focus Industrial email) → **New project**.
   Pick a name, a strong database password (save it), and the closest region (Sydney).
2. When it's ready: **SQL Editor → New query** → paste the entire contents of
   `BUILD_TIER_B/SUPABASE_SCHEMA.sql` → **Run**. That builds all your tables + security in
   one go.
3. **Settings → API**: copy your **Project URL** and **anon public key**. Hand both to
   Claude Code (they're safe for the app to hold).
> Free tier is plenty for one person.

### 3 · Anthropic key — the AI brain  ·  ~5 min  ·  *you*
1. Go to **console.anthropic.com** → sign in with your **Focus Industrial business
   account** (create the org if needed).
2. **Billing** → add the business card → **set a low monthly limit** (e.g. $5). This is your
   hard cap — it can't overspend.
3. **API Keys → Create key** → copy it. This is secret — it goes into Vercel only (step 4),
   never into the app or GitHub.

### 4 · Vercel — hosting + auto-deploy  ·  ~10 min  ·  *you + Claude Code*
1. Go to **vercel.com** → sign up **with GitHub** → **Add New → Project** → import this repo.
2. Framework preset: **Vite** (Claude Code will have set the project up for this).
3. **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL (step 2)
   - `VITE_SUPABASE_ANON_KEY` = your anon key (step 2)
   - `ANTHROPIC_API_KEY` = your secret key (step 3)  ← server-side, stays hidden
   - (Claude Code will tell you if push-notification VAPID keys are needed here too)
4. **Deploy.** In a minute or two you get a permanent web address. From now on, every change
   pushed to GitHub re-publishes automatically — your installed app just updates itself.

### 5 · Your phone — activate  ·  ~2 min  ·  *you*
1. Open the Vercel web address in **Chrome** on your S24 Ultra.
2. **Create your account** (email + password) and sign in.
3. **⋮ menu → Add to Home screen → Install.** It lands in your app drawer as a real app.
4. Allow notifications when asked, so reminders can reach you.
Done — it's live, synced, AI working, and reminders on.

---

## What each piece is doing (so the names aren't a mystery)
- **GitHub** = the master copy of the code.
- **Supabase** = where your weigh-ins, workouts, food logs etc. live safely in the cloud.
- **Vercel** = serves the app to your phone and quietly runs the bit that talks to the AI.
- **Anthropic** = the AI that estimates food, answers questions, builds workouts.

## Good to know
- **Cost:** GitHub, Supabase, Vercel = $0 on free tiers. Only AI usage costs money —
  pennies a day for one person, hard-capped by you in step 3.
- **Your data is private:** the sign-in locks it to you; the AI key lives server-side and is
  verified on every call, so only you can ever spend it.
- **Updates:** want a change later? I edit the code → push → your phone updates itself. No
  reinstalling.

-- COMPOUND — step ledger table (earned-calories feature).
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Until this is run, step logs stay device-local (the app still works;
-- sync just warns quietly in the console).

create table if not exists public.step_days (
  user_id  uuid not null references auth.users(id) on delete cascade,
  date     date not null,
  entries  jsonb not null default '[]',
  primary key (user_id, date)
);

alter table public.step_days enable row level security;
drop policy if exists "step days select own" on public.step_days;
drop policy if exists "step days insert own" on public.step_days;
drop policy if exists "step days update own" on public.step_days;
drop policy if exists "step days delete own" on public.step_days;
create policy "step days select own" on public.step_days for select using (auth.uid() = user_id);
create policy "step days insert own" on public.step_days for insert with check (auth.uid() = user_id);
create policy "step days update own" on public.step_days for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "step days delete own" on public.step_days for delete using (auth.uid() = user_id);

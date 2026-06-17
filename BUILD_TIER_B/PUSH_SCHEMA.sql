-- COMPOUND — Phase 6 Web Push schema.
-- Paste this whole block into Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

-- 1) Devices we can push to. One row per browser/device subscription.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,                 -- the unique push URL for this device
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,                     -- subscription crypto keys
  auth       text not null,
  timezone   text,                              -- e.g. 'Australia/Brisbane' (for "is it 9pm there?")
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push subs select own" on public.push_subscriptions;
drop policy if exists "push subs insert own" on public.push_subscriptions;
drop policy if exists "push subs update own" on public.push_subscriptions;
drop policy if exists "push subs delete own" on public.push_subscriptions;
create policy "push subs select own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push subs insert own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push subs update own" on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push subs delete own" on public.push_subscriptions for delete using (auth.uid() = user_id);

-- 2) Dedup log so a reminder is sent at most once per day per kind.
--    Only the server (service role) touches this; RLS on + no policy = clients can't read it.
create table if not exists public.push_sent (
  endpoint  text not null,
  kind      text not null,            -- 'nightly' | 'weighin' | 'workout'
  sent_on   date not null,            -- the local date it was sent for
  sent_at   timestamptz not null default now(),
  primary key (endpoint, kind, sent_on)
);
alter table public.push_sent enable row level security;

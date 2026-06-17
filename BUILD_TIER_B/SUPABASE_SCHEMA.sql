-- ============================================================================
-- COMPOUND · Tier B · Supabase schema
-- Single-user today, but every table is keyed by user_id + protected by
-- Row Level Security, so adding more users later is zero schema change.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- ============================================================================

-- ---- 1. PROFILE (all the "singleton" objects for one user) -----------------
-- Replaces: compound:onboarding, compound:targets, compound:notifs,
--           compound:nipLimit, compound:plateauDismissed
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  onboarding          jsonb   not null default '{}'::jsonb,   -- compound:onboarding
  targets             jsonb,                                   -- compound:targets (null until calculator run)
  notif_prefs         jsonb   not null default '{}'::jsonb,   -- compound:notifs
  nip_limit           int     not null default 55,            -- compound:nipLimit
  plateau_dismissed   timestamptz,                             -- compound:plateauDismissed
  food_tracking_on    boolean not null default false,
  updated_at          timestamptz not null default now()
);

-- ---- 2. WEIGH-INS (one row per day) ----------------------------------------
-- Replaces: compound:weighins  [{date, value}]
create table if not exists weighins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  value      numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---- 3. NIGHTLY CHECK-INS (one row per day) --------------------------------
-- Replaces: compound:checkins  [{date, ...answers}]
create table if not exists checkins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  data       jsonb not null,            -- the full answer object
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---- 4. WORKOUT HISTORY (one row per completed session) --------------------
-- Replaces: compound:workouts  [session]
create table if not exists workouts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  data       jsonb not null,            -- exercises, sets, PBs, notes, etc.
  created_at timestamptz not null default now()
);

-- ---- 5. SAVED WORKOUTS (reusable templates) --------------------------------
-- Replaces: compound:savedWorkouts  [template]
create table if not exists saved_workouts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- ---- 6. WEEKLY PLAN --------------------------------------------------------
-- Replaces: compound:workoutWeek  (keyed by Monday)
create table if not exists workout_week (
  user_id    uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- ---- 7. FOOD LOG (one row per meal) ----------------------------------------
-- Replaces: compound:food  { [date]: [meals] }
-- photo: store the image in Supabase Storage (bucket 'meal-photos') and keep
--        the public/signed URL here, NOT the base64 string.
create table if not exists food_entries (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  name        text,
  photo_url   text,
  kcal        int,
  protein     numeric,
  carbs       numeric,
  fat         numeric,
  confidence  text,                     -- red | orange | green
  health      text,                     -- red | orange | green
  info        text,
  questions   jsonb default '[]'::jsonb, -- [{q, options, answer}]
  ts          timestamptz not null default now()
);

-- ---- 8. NIP / ALCOHOL TALLY (one row per day) ------------------------------
-- Replaces: compound:nipsToday + compound:alcoholKcal
create table if not exists nip_days (
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  nips         numeric not null default 0,
  alcohol_kcal int     not null default 0,
  primary key (user_id, date)
);

-- ---- 9. BODY MEASUREMENTS --------------------------------------------------
-- Replaces: compound:measurements  [entry]
create table if not exists measurements (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- ---- 10. TO-DO STATE (per day: reasons / completion) -----------------------
-- Replaces: compound:todostate  { [date]: { [todoId]: {reason} } }
create table if not exists todo_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  data       jsonb not null default '{}'::jsonb,
  primary key (user_id, date)
);

-- ---- 11. AI CHAT HISTORY (nutrition "Ask") ---------------------------------
-- Replaces: compound:nutrition  [{role, content, ts}]
create table if not exists nutrition_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null,            -- user | assistant
  content    text not null,
  ts         timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY — every user sees ONLY their own rows.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','weighins','checkins','workouts','saved_workouts',
    'workout_week','food_entries','nip_days','measurements',
    'todo_state','nutrition_messages'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    -- profiles keys on id; everything else keys on user_id
    if t = 'profiles' then
      execute format($f$
        create policy "own_rows" on %I
        for all using (id = auth.uid()) with check (id = auth.uid());
      $f$, t);
    else
      execute format($f$
        create policy "own_rows" on %I
        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
      $f$, t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- Auto-create a profile row the moment a user signs up.
-- ============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Storage bucket for meal photos (also create in Dashboard → Storage if preferred)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

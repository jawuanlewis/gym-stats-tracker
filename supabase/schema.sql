-- Gym Stats Tracker — Postgres schema for Supabase.
-- Not applied automatically; run this in the Supabase SQL editor.
create type exercise_category as enum('upper', 'lower');

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category exercise_category not null,
  weight numeric(6, 2) not null default 0 check (weight >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforces the case-insensitive duplicate rule at the database level, so the
-- friendly check in the service layer is a better error message rather than
-- the only thing standing between a user and duplicate rows.
create unique index exercises_name_unique on exercises (lower(name));

create table exercise_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises (id) on delete cascade,
  position int not null check (position >= 0),
  reps int not null check (reps >= 1),
  -- Null means "use the parent exercise's weight". Unused today; this is the
  -- seam for per-set weight (drop sets) without a migration.
  weight numeric(6, 2) check (weight >= 0),
  unique (exercise_id, position)
  deferrable initially deferred
);

-- Append-only history. Nothing reads this yet — it exists so that when
-- progression charts land, there is already data behind them.
create table exercise_events (
  id bigint generated always as identity primary key,
  exercise_id uuid not null,
  name text not null,
  category exercise_category not null,
  weight numeric(6, 2) not null,
  sets int[] not null,
  recorded_at timestamptz not null default now()
);

create index exercise_events_exercise_idx on exercise_events (exercise_id, recorded_at desc);

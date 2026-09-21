-- Gym Stats Tracker — Postgres schema for Supabase.
-- Not applied automatically; run this in the Supabase SQL editor.
create type exercise_category as enum('upper', 'lower');

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category exercise_category not null,
  weight numeric(6, 2) not null default 0 check (weight >= 0),
  -- [{ "reps": 10, "weight": null }, ...] in set order.
  -- A null set weight means "inherit the exercise weight". Nothing writes a
  -- non-null value yet; this is the seam for per-set weight (drop sets),
  -- which needs no migration because the shape already allows it.
  sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_sets_is_array check (jsonb_typeof(sets) = 'array')
);

-- Enforces the case-insensitive duplicate rule at the database level, so the
-- friendly check in the service layer is a better error message rather than
-- the only thing standing between a user and duplicate rows.
create unique index exercises_name_unique on exercises (lower(name));

-- Append-only history. Nothing reads this yet — it exists so that when
-- progression charts land, there is already data behind them.
create table exercise_events (
  id bigint generated always as identity primary key,
  exercise_id uuid not null,
  name text not null,
  category exercise_category not null,
  weight numeric(6, 2) not null,
  sets jsonb not null,
  recorded_at timestamptz not null default now()
);

create index exercise_events_exercise_idx on exercise_events (exercise_id, recorded_at desc);

-- RLS with no policies: every table denies all access except through the
-- service-role key, which bypasses RLS and is used only by the server.
-- Without this, anyone holding the anon key could read and write these tables.
alter table exercises enable row level security;

alter table exercise_events enable row level security;

-- RLS bypass and table privileges are SEPARATE mechanisms. service_role skips
-- RLS, but still needs a GRANT or every query fails with 42501
-- ("permission denied for table ..."). Supabase's default privileges usually
-- cover this; they did not on this project, so grant explicitly.
--
-- Deliberately NOT granted to anon or authenticated: no browser-side role
-- should be able to touch these tables.
grant usage on schema public to service_role;

grant all privileges on table public.exercises to service_role;

grant all privileges on table public.exercise_events to service_role;

-- Same grant for any table added to this schema later.
alter default privileges in schema public
grant all on tables to service_role;

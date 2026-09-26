-- Gym Stats Tracker — Postgres schema for Supabase.
-- Not applied automatically; run this in the Supabase SQL editor on a fresh
-- project. An existing single-user database upgrades with
-- migrations/002_per_user.sql instead.
create type exercise_category as enum('upper', 'lower');

create table exercises (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the signed-in user, so the app never sends it. The insert
  -- policy below re-checks it, so a client cannot claim another user's id.
  user_id uuid not null default auth.uid () references auth.users (id) on delete cascade,
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

-- Enforces the case-insensitive duplicate rule per user, so the friendly check
-- in the service layer is a better error message rather than the only thing
-- standing between a user and duplicate rows. Leading with user_id also makes
-- this the index behind every RLS-filtered read.
create unique index exercises_user_name_unique on exercises (user_id, lower(name));

-- Append-only history. Nothing reads this yet — it exists so that when
-- progression charts land, there is already data behind them.
create table exercise_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid () references auth.users (id) on delete cascade,
  exercise_id uuid not null,
  name text not null,
  category exercise_category not null,
  weight numeric(6, 2) not null,
  sets jsonb not null,
  recorded_at timestamptz not null default now()
);

create index exercise_events_exercise_idx on exercise_events (exercise_id, recorded_at desc);

create index exercise_events_user_idx on exercise_events (user_id);

-- Row-level security is the per-user boundary. The app queries as the
-- signed-in user (the `authenticated` role, carrying their JWT), so Postgres
-- itself refuses to return or modify another user's rows — a missing filter in
-- application code cannot leak data.
--
-- `(select auth.uid())` rather than bare `auth.uid()` lets Postgres evaluate it
-- once per statement instead of once per row.
alter table exercises enable row level security;

alter table exercise_events enable row level security;

create policy exercises_select_own on exercises for
select
  to authenticated using (
    user_id = (
      select
        auth.uid ()
    )
  );

create policy exercises_insert_own on exercises for insert to authenticated
with
  check (
    user_id = (
      select
        auth.uid ()
    )
  );

-- `with check` as well as `using`: without it, an update could move a row to
-- another user by rewriting user_id.
create policy exercises_update_own on exercises
for update
  to authenticated using (
    user_id = (
      select
        auth.uid ()
    )
  )
with
  check (
    user_id = (
      select
        auth.uid ()
    )
  );

create policy exercises_delete_own on exercises for delete to authenticated using (
  user_id = (
    select
      auth.uid ()
  )
);

-- History is append-only: no update or delete policy, so neither is possible.
create policy exercise_events_select_own on exercise_events for
select
  to authenticated using (
    user_id = (
      select
        auth.uid ()
    )
  );

create policy exercise_events_insert_own on exercise_events for insert to authenticated
with
  check (
    user_id = (
      select
        auth.uid ()
    )
  );

-- RLS and table privileges are SEPARATE mechanisms. A policy only narrows
-- which rows a role may touch; the role still needs a GRANT or every query
-- fails with 42501 ("permission denied for table ...").
--
-- `authenticated` gets exactly what the policies above allow. `anon` (a
-- visitor with no session) gets nothing — revoked explicitly because
-- Supabase's default privileges may have granted it.
grant usage on schema public to authenticated;

grant
select
,
  insert,
update,
delete on table public.exercises to authenticated;

grant
select
,
  insert on table public.exercise_events to authenticated;

revoke all on table public.exercises
from
  anon;

revoke all on table public.exercise_events
from
  anon;

-- service_role is no longer used by the app, but keeps full access for the
-- dashboard and any future admin tooling. It bypasses RLS.
grant usage on schema public to service_role;

grant all privileges on table public.exercises to service_role;

grant all privileges on table public.exercise_events to service_role;

alter default privileges in schema public
grant all on tables to service_role;

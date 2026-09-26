-- Upgrades the original single-user database to per-user data.
-- Run once in the Supabase SQL editor. A fresh project runs schema.sql instead.
--
-- BEFORE RUNNING:
--   1. Create your account: Supabase dashboard → Authentication → Users →
--      Add user → Create new user (email only; tick "Auto Confirm User").
--   2. Replace owner@example.com below with that email.
--
-- Existing rows are assigned to that account before user_id becomes required,
-- so nothing is ever orphaned or hidden behind RLS.
begin;

-- Stash the owner's id for the backfill. Fails loudly (null into a not-null
-- temp column) if the account does not exist yet.
create temporary table migration_owner (id uuid not null) on
commit
drop;

insert into
  migration_owner (id)
select
  (
    select
      id
    from
      auth.users
    where
      email = 'owner@example.com'
  );

alter table exercises
add column user_id uuid references auth.users (id) on delete cascade;

alter table exercise_events
add column user_id uuid references auth.users (id) on delete cascade;

update exercises
set
  user_id = (
    select
      id
    from
      migration_owner
  );

update exercise_events
set
  user_id = (
    select
      id
    from
      migration_owner
  );

alter table exercises
alter column user_id
set not null,
alter column user_id
set default auth.uid ();

alter table exercise_events
alter column user_id
set not null,
alter column user_id
set default auth.uid ();

-- The duplicate-name rule becomes per user.
drop index exercises_name_unique;

create unique index exercises_user_name_unique on exercises (user_id, lower(name));

create index exercise_events_user_idx on exercise_events (user_id);

-- Policies and grants: identical to schema.sql, which explains each one.
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

commit;

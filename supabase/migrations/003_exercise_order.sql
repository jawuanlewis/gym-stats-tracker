-- Adds user-defined ordering of exercises (drag to reorder).
-- Run once in the Supabase SQL editor. A fresh project runs schema.sql instead.
--
-- No backfill: every existing row starts at 0, and the app breaks ties by
-- created_at, so the list keeps its current order until something is dragged.
begin;

alter table exercises
add column sort_order integer not null default 0;

create function reorder_exercises (ordered_ids uuid[]) returns void language sql security invoker
set
  search_path = '' as $$
  update public.exercises as e
  set sort_order = o.ordinality
  from unnest(ordered_ids) with ordinality as o (id, ordinality)
  where e.id = o.id;
$$;

revoke
execute on function reorder_exercises (uuid[])
from
  public,
  anon;

grant
execute on function reorder_exercises (uuid[]) to authenticated;

commit;

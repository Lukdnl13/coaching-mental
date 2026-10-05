-- One last saved state per Paris calendar day, beginning at installation.
create table public.cm_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 notes_count integer not null check(notes_count>=0),
 decisions_count integer not null check(decisions_count>=0),
 tables_count integer not null check(tables_count>=0),
 skills_count integer not null check(skills_count>=0),
 actions_done integer not null check(actions_done>=0),
 actions_total integer not null check(actions_total>=actions_done),
 value_scores jsonb not null default '[]' check(jsonb_typeof(value_scores)='array'),
 primary key(user_id,day)
);
alter table public.cm_progress enable row level security;
revoke all on public.cm_progress from anon,authenticated;
grant select,insert,update on public.cm_progress to authenticated;
create policy cm_progress_read on public.cm_progress for select to authenticated using((select auth.uid())=user_id);
create policy cm_progress_insert on public.cm_progress for insert to authenticated with check((select auth.uid())=user_id);
create policy cm_progress_update on public.cm_progress for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

create function public.cm_capture_progress(owner_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 -- Serialize saves for the same owner before reading the latest committed state.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,0));
 insert into public.cm_progress(user_id,day,notes_count,decisions_count,tables_count,skills_count,actions_done,actions_total,value_scores)
 values(owner_id,(clock_timestamp() at time zone 'Europe/Paris')::date,
  (select count(*) from public.cm_notes where user_id=owner_id),
  (select count(*) from public.cm_decisions where user_id=owner_id),
  (select count(*) from public.cm_tables where user_id=owner_id),
  coalesce((select jsonb_array_length(skills) from public.cm_career where user_id=owner_id),0),
  (select count(*) from public.cm_career c cross join lateral jsonb_array_elements(coalesce(c.plan->'actions','[]')) a where c.user_id=owner_id and a->>'done'='true'),
  coalesce((select jsonb_array_length(coalesce(plan->'actions','[]')) from public.cm_career where user_id=owner_id),0),
  coalesce((select jsonb_agg(jsonb_build_object('id',v->>'id','name',v->>'name','score',v->'score','color',v->>'color')) from public.cm_wheels w cross join lateral jsonb_array_elements(w.items) v where w.user_id=owner_id),'[]'))
 on conflict(user_id,day) do update set notes_count=excluded.notes_count,decisions_count=excluded.decisions_count,tables_count=excluded.tables_count,skills_count=excluded.skills_count,actions_done=excluded.actions_done,actions_total=excluded.actions_total,value_scores=excluded.value_scores;
end$$;
revoke all on function public.cm_capture_progress(uuid) from public,anon;
grant execute on function public.cm_capture_progress(uuid) to authenticated;

create function public.cm_track_progress() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform public.cm_capture_progress(case when TG_OP='DELETE' then OLD.user_id else NEW.user_id end);
 return null;
exception when foreign_key_violation then
 -- Account deletion cascades remove the owner too; never recreate their history.
 if TG_OP='DELETE' then return null; else raise; end if;
end$$;
revoke all on function public.cm_track_progress() from public,anon;
grant execute on function public.cm_track_progress() to authenticated;
create trigger cm_notes_progress after insert or update or delete on public.cm_notes for each row execute function public.cm_track_progress();
create trigger cm_decisions_progress after insert or update or delete on public.cm_decisions for each row execute function public.cm_track_progress();
create trigger cm_tables_progress after insert or update or delete on public.cm_tables for each row execute function public.cm_track_progress();
create trigger cm_wheels_progress after insert or update or delete on public.cm_wheels for each row execute function public.cm_track_progress();
create trigger cm_career_progress after insert or update or delete on public.cm_career for each row execute function public.cm_track_progress();

-- Seed today's baseline from existing records; never invent earlier dates.
select public.cm_capture_progress(user_id) from (
 select user_id from public.cm_notes union select user_id from public.cm_decisions
 union select user_id from public.cm_tables union select user_id from public.cm_wheels union select user_id from public.cm_career
) owners;

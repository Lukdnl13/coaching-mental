create function public.cm_valid_goal_steps(steps jsonb) returns boolean
language sql immutable security invoker set search_path = '' as $$
 select case when jsonb_typeof(steps) is distinct from 'array' then false
 else jsonb_array_length(steps) between 1 and 20 and (
  select coalesce(bool_and(jsonb_typeof(s)='object' and jsonb_typeof(s->'id')='string' and length(s->>'id') between 1 and 80 and jsonb_typeof(s->'title')='string' and length(btrim(s->>'title')) between 1 and 150 and jsonb_typeof(s->'done')='boolean'),false)
  and count(distinct s->>'id')=count(*) from jsonb_array_elements(steps) s
 ) and not exists(select 1 from jsonb_array_elements(steps) s where not (s ?& array['id','title','done'])) end;
$$;
revoke all on function public.cm_valid_goal_steps(jsonb) from public,anon;
grant execute on function public.cm_valid_goal_steps(jsonb) to authenticated;
create table public.cm_goals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check(length(btrim(title)) between 1 and 150),
 details text not null default '' check(length(details)<=2000),
 steps jsonb not null check(public.cm_valid_goal_steps(steps)),
 updated_at timestamptz not null default now(),
 constraint cm_goals_payload_limit check(octet_length(steps::text)<=50000)
);
create index cm_goals_owner on public.cm_goals(user_id);
alter table public.cm_goals enable row level security;
revoke all on public.cm_goals from anon,authenticated;
grant select,insert,update,delete on public.cm_goals to authenticated;
create policy cm_goals_owner on public.cm_goals for all to authenticated
 using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create trigger cm_goals_touch before update on public.cm_goals for each row execute function public.cm_touch_updated_at();

create table public.cm_career (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade default auth.uid(),
 categories jsonb not null default '[]' check(jsonb_typeof(categories)='array' and jsonb_array_length(categories)<=30),
 skills jsonb not null default '[]' check(jsonb_typeof(skills)='array' and jsonb_array_length(skills)<=300),
 plan jsonb not null default '{"goal":"","skill_ids":[],"actions":[]}' check(jsonb_typeof(plan)='object'),
 updated_at timestamptz not null default now(),
 constraint cm_career_payload_limit check(octet_length(categories::text)+octet_length(skills::text)+octet_length(plan::text)<=1000000)
);
alter table public.cm_career enable row level security;
revoke all on public.cm_career from anon, authenticated;
grant select,insert,update,delete on public.cm_career to authenticated;
create policy cm_career_owner on public.cm_career for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create trigger cm_career_touch before update on public.cm_career
 for each row execute function public.cm_touch_updated_at();

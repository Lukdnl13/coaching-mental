-- Independent tables preserve all existing decision data and scoring rules.
create table public.cm_tables (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check(length(btrim(title)) between 1 and 200),
 criteria jsonb not null default '[]' check(jsonb_typeof(criteria)='array' and jsonb_array_length(criteria)<=100 and octet_length(criteria::text)<=2000000),
 updated_at timestamptz not null default now()
);
create index cm_tables_owner on public.cm_tables(user_id);
alter table public.cm_tables enable row level security;
revoke all on public.cm_tables from anon, authenticated;
grant select,insert,update,delete on public.cm_tables to authenticated;
create policy cm_tables_owner on public.cm_tables for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create trigger cm_tables_touch before update on public.cm_tables
 for each row execute function public.cm_touch_updated_at();

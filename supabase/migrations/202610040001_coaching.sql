-- Personal data remains private even when application source is public.
create table if not exists public.cm_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check(length(title) between 1 and 150),
 content text not null default '' check(length(content)<=50000),
 category text not null default 'Personnel' check(category in ('Personnel','Projets','Idées')),
 updated_at timestamptz not null default now()
);
create table if not exists public.cm_decisions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check(length(title) between 1 and 200),
 options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 4),
 criteria jsonb not null default '[]' check(jsonb_typeof(criteria)='array' and jsonb_array_length(criteria)<=30),
 updated_at timestamptz not null default now()
);
create table if not exists public.cm_wheels (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade default auth.uid(),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 3 and 12),
 updated_at timestamptz not null default now()
);
create index if not exists cm_notes_owner on public.cm_notes(user_id);
create index if not exists cm_decisions_owner on public.cm_decisions(user_id);
alter table public.cm_notes enable row level security;
alter table public.cm_decisions enable row level security;
alter table public.cm_wheels enable row level security;
revoke all on public.cm_notes, public.cm_decisions, public.cm_wheels from anon;
grant select,insert,update,delete on public.cm_notes, public.cm_decisions, public.cm_wheels to authenticated;
create policy cm_notes_owner on public.cm_notes for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy cm_decisions_owner on public.cm_decisions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy cm_wheels_owner on public.cm_wheels for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.cm_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$begin new.updated_at=now(); return new; end$$;
create trigger cm_notes_touch before update on public.cm_notes for each row execute function public.cm_touch_updated_at();
create trigger cm_decisions_touch before update on public.cm_decisions for each row execute function public.cm_touch_updated_at();
create trigger cm_wheels_touch before update on public.cm_wheels for each row execute function public.cm_touch_updated_at();

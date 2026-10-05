create table public.cm_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check(length(btrim(title)) between 1 and 150),
 details text not null default '' check(length(details)<=2000),
 icon text not null default 'target' check(icon in ('target','idea','book','phone','mail','work','health','sport','rest','people','calendar','home')),
 done boolean not null default false,
 updated_at timestamptz not null default now()
);
create index cm_tasks_owner on public.cm_tasks(user_id);
alter table public.cm_tasks enable row level security;
revoke all on public.cm_tasks from anon,authenticated;
grant select,insert,update,delete on public.cm_tasks to authenticated;
create policy cm_tasks_owner on public.cm_tasks for all to authenticated
 using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create trigger cm_tasks_touch before update on public.cm_tasks for each row execute function public.cm_touch_updated_at();

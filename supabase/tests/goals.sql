-- Run with execute_sql / SQL Editor as postgres. All test data is rolled back.
begin;
select set_config('test.owner',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true),set_config('test.table',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.owner')::uuid),(current_setting('test.other')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
insert into public.cm_goals(id,title,details,steps) values(current_setting('test.table')::uuid,'Test objectif','Ma motivation','[{"id":"s1","title":"Première étape","done":false}]');
do $$begin
 if (select count(*) from public.cm_goals where id=current_setting('test.table')::uuid)<>1 then raise exception 'Own read failed'; end if;
 update public.cm_goals set title='Test modifié',steps='[{"id":"s1","title":"Première étape","done":true}]',updated_at='2000-01-01' where id=current_setting('test.table')::uuid;
 if not found then raise exception 'Own update failed'; end if;
 if (select updated_at from public.cm_goals where id=current_setting('test.table')::uuid)='2000-01-01' then raise exception 'Timestamp trigger failed'; end if;
 begin
  update public.cm_goals set user_id=current_setting('test.other')::uuid where id=current_setting('test.table')::uuid;
  raise exception 'Owner reassignment allowed';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
do $$begin
 if exists(select 1 from public.cm_goals where id=current_setting('test.table')::uuid) then raise exception 'Other read allowed'; end if;
 update public.cm_goals set title='Forbidden' where id=current_setting('test.table')::uuid;
 if found then raise exception 'Other update allowed'; end if;
 delete from public.cm_goals where id=current_setting('test.table')::uuid;
 if found then raise exception 'Other delete allowed'; end if;
 begin
  insert into public.cm_goals(title,user_id,steps) values('Forbidden',current_setting('test.owner')::uuid,'[{"id":"s1","title":"Étape","done":false}]');
  raise exception 'Forged insert allowed';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$begin
 if not exists(select 1 from public.cm_goals where id=current_setting('test.table')::uuid and steps->0->>'done'='true' and details='Ma motivation') then raise exception 'Goal steps did not persist'; end if;
 begin
  insert into public.cm_goals(title,steps) values('Bad steps','[{"id":"s1","title":"","done":false}]');
  raise exception 'Invalid steps allowed';
 exception when check_violation then null; end;
 delete from public.cm_goals where id=current_setting('test.table')::uuid;
 if not found then raise exception 'Own delete failed'; end if;
end$$;
reset role;
do $$begin
 if has_table_privilege('anon','public.cm_goals','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous access allowed'; end if;
end$$;
select 'goals RLS, CRUD, validation, timestamp and persistence passed' as result;
rollback;

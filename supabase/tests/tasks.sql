-- Run with execute_sql / SQL Editor as postgres. All test data is rolled back.
begin;
select set_config('test.owner',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true),set_config('test.table',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.owner')::uuid),(current_setting('test.other')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
insert into public.cm_tasks(id,title,details,icon) values(current_setting('test.table')::uuid,'Test action','Préparer mes questions','phone');
do $$begin
 if (select count(*) from public.cm_tasks where id=current_setting('test.table')::uuid)<>1 then raise exception 'Own read failed'; end if;
 update public.cm_tasks set title='Test modifié',done=true,updated_at='2000-01-01' where id=current_setting('test.table')::uuid;
 if not found then raise exception 'Own update failed'; end if;
 if (select updated_at from public.cm_tasks where id=current_setting('test.table')::uuid)='2000-01-01' then raise exception 'Timestamp trigger failed'; end if;
 begin
  update public.cm_tasks set user_id=current_setting('test.other')::uuid where id=current_setting('test.table')::uuid;
  raise exception 'Owner reassignment allowed';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
do $$begin
 if exists(select 1 from public.cm_tasks where id=current_setting('test.table')::uuid) then raise exception 'Other read allowed'; end if;
 update public.cm_tasks set title='Forbidden' where id=current_setting('test.table')::uuid;
 if found then raise exception 'Other update allowed'; end if;
 delete from public.cm_tasks where id=current_setting('test.table')::uuid;
 if found then raise exception 'Other delete allowed'; end if;
 begin
  insert into public.cm_tasks(title,user_id) values('Forbidden',current_setting('test.owner')::uuid);
  raise exception 'Forged insert allowed';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$begin
 if not exists(select 1 from public.cm_tasks where id=current_setting('test.table')::uuid and done=true and icon='phone' and details='Préparer mes questions') then raise exception 'Task state/icon did not persist'; end if;
 begin
  insert into public.cm_tasks(title,icon) values('Bad icon','unknown');
  raise exception 'Invalid icon allowed';
 exception when check_violation then null; end;
 delete from public.cm_tasks where id=current_setting('test.table')::uuid;
 if not found then raise exception 'Own delete failed'; end if;
end$$;
reset role;
do $$begin
 if has_table_privilege('anon','public.cm_tasks','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous access allowed'; end if;
end$$;
rollback;

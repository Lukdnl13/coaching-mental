-- Transactional test: source writes, daily upsert, isolation, and account cascade.
begin;
select set_config('test.owner',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.owner')::uuid),(current_setting('test.other')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
insert into public.cm_notes(title) values('Progress test');
insert into public.cm_career(skills,plan) values('[{"id":"s1","name":"Organisation","category_id":null}]','{"goal":"Test","skill_ids":["s1"],"actions":[{"id":"a1","title":"Agir","done":true},{"id":"a2","title":"Continuer","done":false}]}');
insert into public.cm_wheels(items) values('[{"id":"v1","name":"Santé","score":6,"color":"#123456"},{"id":"v2","name":"Famille","score":8,"color":"#234567"},{"id":"v3","name":"Projet","score":7,"color":"#345678"}]');
do $$declare snapshot public.cm_progress;begin
 select * into snapshot from public.cm_progress where user_id=current_setting('test.owner')::uuid;
 if snapshot.notes_count<>1 or snapshot.skills_count<>1 or snapshot.actions_done<>1 or snapshot.actions_total<>2 or jsonb_array_length(snapshot.value_scores)<>3 then raise exception 'Saved counts did not match source records'; end if;
 if snapshot.day<>(clock_timestamp() at time zone 'Europe/Paris')::date then raise exception 'Wrong date';end if;
 if (select count(*) from public.cm_progress where user_id=current_setting('test.owner')::uuid)<>1 then raise exception 'More than one daily snapshot'; end if;
end$$;
update public.cm_career set plan=jsonb_set(plan,'{actions,1,done}','true') where user_id=current_setting('test.owner')::uuid;
delete from public.cm_notes where user_id=current_setting('test.owner')::uuid;
do $$begin
 if not exists(select 1 from public.cm_progress where user_id=current_setting('test.owner')::uuid and notes_count=0 and actions_done=2) then raise exception 'Daily update/delete snapshot failed'; end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
do $$begin
 if exists(select 1 from public.cm_progress where user_id=current_setting('test.owner')::uuid) then raise exception 'Other owner history exposed';end if;
 update public.cm_progress set notes_count=999 where user_id=current_setting('test.owner')::uuid;
 if found then raise exception 'Other owner update allowed';end if;
 begin
  perform public.cm_capture_progress(current_setting('test.owner')::uuid);
  raise exception 'Cross-owner checkpoint allowed';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
do $$begin
 if has_table_privilege('anon','public.cm_progress','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous access';end if;
end$$;
delete from auth.users where id=current_setting('test.owner')::uuid;
do $$begin
 if exists(select 1 from public.cm_progress where user_id=current_setting('test.owner')::uuid) then raise exception 'History was not deleted with account';end if;
end$$;
rollback;

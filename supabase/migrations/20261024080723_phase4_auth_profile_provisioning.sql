-- Phase 4: account and profile creation must commit or fail together.
begin;

create function private.provision_auth_user_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  profile_name text;
begin
  -- auth.uid() is not available during email signup. Identity comes exclusively
  -- from NEW.id on auth.users, never a caller-supplied target UUID or role.
  if tg_op <> 'INSERT' or tg_table_schema <> 'auth' or tg_table_name <> 'users' then
    raise exception 'Only auth user insertion is supported';
  end if;
  if pg_catalog.jsonb_typeof(new.raw_user_meta_data -> 'full_name') = 'string' then
    profile_name := pg_catalog.left(
      pg_catalog.regexp_replace(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), '[[:cntrl:]]', '', 'g'), 200);
    profile_name := nullif(pg_catalog.btrim(profile_name), '');
  end if;
  insert into public.user_profiles (id, full_name) values (new.id, profile_name);
  -- Do not catch failures: a missing profile must roll back the auth user too.
  return new;
end;
$$;
revoke all on function private.provision_auth_user_profile() from public, anon, authenticated, service_role;

create trigger on_auth_user_created_provision_profile
after insert on auth.users
for each row execute function private.provision_auth_user_profile();

-- Repair older accounts without overwriting a name already chosen in-app.
insert into public.user_profiles (id, full_name)
select u.id, case when pg_catalog.jsonb_typeof(u.raw_user_meta_data -> 'full_name') = 'string'
  then nullif(pg_catalog.btrim(pg_catalog.left(pg_catalog.regexp_replace(
    pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), '[[:cntrl:]]', '', 'g'), 200)), '')
  else null end
from auth.users u
on conflict (id) do nothing;

-- Profiles now have a single provisioning path. Retain self SELECT/name UPDATE
-- policies and column grants from Phase 2; all health authorization stays in RLS.
revoke insert (id, full_name) on public.user_profiles from authenticated;
drop policy user_profiles_insert_self on public.user_profiles;
commit;

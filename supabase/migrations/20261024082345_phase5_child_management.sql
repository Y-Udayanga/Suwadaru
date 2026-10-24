-- Phase 5. Preserve existing membership RLS and narrow demographic grants.
begin;

alter table public.children add column clinic_name text;
alter table public.children add constraint children_name_valid
  check (char_length(btrim(name)) between 1 and 200 and name !~ '[[:cntrl:]]' and name ~ '[^[:space:]]');
alter table public.children add constraint children_clinic_name_valid
  check (clinic_name is null or (char_length(btrim(clinic_name)) between 1 and 200
    and clinic_name !~ '[[:cntrl:]]' and clinic_name ~ '[^[:space:]]'));
-- Keep dates representable by the frontend's four-digit ISO date contract.
alter table public.children add constraint children_date_of_birth_iso_range
  check (date_of_birth between date '0001-01-01' and date '9999-12-31');
grant update (clinic_name) on public.children to authenticated;

-- Replace the signature rather than leave ambiguous defaulted RPC overloads.
-- Existing five-argument calls remain supported by the new trailing default.
drop function public.create_child(text, date, text, numeric, text);
drop function private.create_child_with_owner(text, date, text, numeric, text);

create function private.create_child_with_owner(
  p_name text, p_date_of_birth date, p_sex text,
  p_birth_weight_kg numeric default null,
  p_relationship text default 'parent', p_clinic_name text default null
)
returns public.children
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_child public.children;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  -- Phase 4 provisions this profile atomically with the auth account.
  if not exists (select 1 from public.user_profiles where id = v_user_id) then
    raise exception 'Account profile required' using errcode = '42501';
  end if;
  insert into public.children (name, date_of_birth, sex, birth_weight_kg, clinic_name, created_by)
  values (pg_catalog.btrim(p_name), p_date_of_birth, p_sex, p_birth_weight_kg,
          pg_catalog.btrim(p_clinic_name), v_user_id)
  returning * into v_child;
  insert into public.child_caregivers (child_id, user_id, relationship, access_level)
  values (v_child.id, v_user_id, p_relationship, 'owner');
  return v_child;
end;
$$;
revoke all on function private.create_child_with_owner(text, date, text, numeric, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.create_child_with_owner(text, date, text, numeric, text, text) to authenticated;

create function public.create_child(
  p_name text, p_date_of_birth date, p_sex text,
  p_birth_weight_kg numeric default null,
  p_relationship text default 'parent', p_clinic_name text default null
)
returns public.children
language sql security invoker set search_path = ''
as $$
  select private.create_child_with_owner(p_name, p_date_of_birth, p_sex,
    p_birth_weight_kg, p_relationship, p_clinic_name);
$$;
revoke all on function public.create_child(text, date, text, numeric, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.create_child(text, date, text, numeric, text, text) to authenticated;
comment on function public.create_child(text, date, text, numeric, text, text) is
  'Atomic child and current-user owner creation. No invitation or ownership reassignment.';
commit;

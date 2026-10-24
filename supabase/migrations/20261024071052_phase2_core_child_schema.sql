-- Phase 2 only. Apply as the trusted Supabase migration role (postgres).
begin;

-- Never add this schema to PostgREST's exposed schemas.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text constraint user_profiles_full_name_nonblank
    check (full_name is null or length(btrim(full_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint children_name_nonblank check (length(btrim(name)) > 0),
  date_of_birth date not null constraint children_date_of_birth_finite check (isfinite(date_of_birth)),
  sex text not null constraint children_sex_valid check (sex in ('male', 'female')),
  birth_weight_kg numeric constraint children_birth_weight_positive_finite
    check (birth_weight_kg > 0 and birth_weight_kg < 'Infinity'::numeric),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.children enable row level security;

create table public.child_caregivers (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  relationship text not null constraint child_caregivers_relationship_nonblank
    check (length(btrim(relationship)) > 0),
  access_level text not null constraint child_caregivers_access_level_valid
    check (access_level in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  constraint child_caregivers_child_user_unique unique (child_id, user_id)
);
alter table public.child_caregivers enable row level security;

create index children_created_by_idx on public.children (created_by);
-- The unique index already covers child_id; this covers user lookup and its FK.
create index child_caregivers_user_child_idx on public.child_caregivers (user_id, child_id);

-- Invoker triggers need no elevated privileges. Client column grants below
-- prevent assigning timestamps, IDs or provenance in the first place.
create function private.touch_updated_at()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;

create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute function private.touch_updated_at();
create trigger children_touch_updated_at
before update on public.children
for each row execute function private.touch_updated_at();

-- A time-dependent rule belongs in a trigger, not an immutable CHECK.
-- Calendar dates follow the product timezone, independent of session TimeZone.
create function private.validate_child_date_of_birth()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.date_of_birth > (pg_catalog.statement_timestamp() at time zone 'Asia/Colombo')::date then
    raise exception 'date_of_birth must not be in the future' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_child_date_of_birth() from public, anon, authenticated, service_role;
create trigger children_validate_date_of_birth
before insert or update of date_of_birth on public.children
for each row execute function private.validate_child_date_of_birth();

-- Remove inherited Supabase default grants before granting the narrow API.
revoke all on table public.user_profiles, public.children, public.child_caregivers
  from public, anon, authenticated;
grant select on public.user_profiles, public.children, public.child_caregivers to authenticated;
grant insert (id, full_name) on public.user_profiles to authenticated;
grant update (full_name) on public.user_profiles to authenticated;
grant update (name, date_of_birth, sex, birth_weight_kg) on public.children to authenticated;

create policy user_profiles_select_self on public.user_profiles
for select to authenticated using (id = (select auth.uid()));
create policy user_profiles_insert_self on public.user_profiles
for insert to authenticated with check (id = (select auth.uid()));
create policy user_profiles_update_self on public.user_profiles
for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Membership policies never read children: the dependency graph is acyclic.
create policy child_caregivers_select_self on public.child_caregivers
for select to authenticated using (user_id = (select auth.uid()));

create policy children_select_caregiver on public.children
for select to authenticated using (
  id in (select cc.child_id from public.child_caregivers cc
         where cc.user_id = (select auth.uid()))
);
create policy children_update_caregiver on public.children
for update to authenticated
using (
  id in (select cc.child_id from public.child_caregivers cc
         where cc.user_id = (select auth.uid()) and cc.access_level in ('owner', 'editor'))
)
with check (
  id in (select cc.child_id from public.child_caregivers cc
         where cc.user_id = (select auth.uid()) and cc.access_level in ('owner', 'editor'))
);

-- This is the sole client-authorized insertion path. Both inserts are in the
-- calling statement's transaction; any failure rolls back both. No caller can
-- choose an existing child ID, creator, target user or access level.
create function private.create_child_with_owner(
  p_name text,
  p_date_of_birth date,
  p_sex text,
  p_birth_weight_kg numeric default null,
  p_relationship text default 'parent'
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

  insert into public.children (name, date_of_birth, sex, birth_weight_kg, created_by)
  values (p_name, p_date_of_birth, p_sex, p_birth_weight_kg, v_user_id)
  returning * into v_child;

  insert into public.child_caregivers (child_id, user_id, relationship, access_level)
  values (v_child.id, v_user_id, p_relationship, 'owner');

  return v_child;
end;
$$;
revoke all on function private.create_child_with_owner(text, date, text, numeric, text)
  from public, anon, authenticated, service_role;
grant execute on function private.create_child_with_owner(text, date, text, numeric, text)
  to authenticated;

-- Exposed RPC is SECURITY INVOKER; privileged implementation stays private.
create function public.create_child(
  p_name text,
  p_date_of_birth date,
  p_sex text,
  p_birth_weight_kg numeric default null,
  p_relationship text default 'parent'
)
returns public.children
language sql security invoker set search_path = ''
as $$
  select private.create_child_with_owner(p_name, p_date_of_birth, p_sex, p_birth_weight_kg, p_relationship);
$$;
revoke all on function public.create_child(text, date, text, numeric, text)
  from public, anon, authenticated, service_role;
grant execute on function public.create_child(text, date, text, numeric, text) to authenticated;

comment on function public.create_child(text, date, text, numeric, text) is
  'Authenticated atomic child + initial owner creation. No invitations or existing-child attachment.';
comment on column public.children.created_by is
  'Immutable creator provenance, not an authorization shortcut. Access uses child_caregivers.';
comment on schema private is
  'Internal functions. Must not be added to Data API exposed schemas.';

commit;

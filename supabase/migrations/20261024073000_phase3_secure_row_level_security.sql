-- Phase 3: Secure Row Level Security (RLS) policies and least-privilege verification.
-- Apply as the trusted Supabase migration role (postgres).
begin;

-- =============================================================================
-- 1. LEAST-PRIVILEGE GRANTS AUDIT & HARDENING
-- =============================================================================
-- Revoke all permissions from public and anon roles to guarantee no anonymous access.
revoke all on table public.user_profiles, public.children, public.child_caregivers
  from public, anon;
revoke all on table public.user_profiles, public.children, public.child_caregivers
  from authenticated;

-- Grant selective read access subject to table RLS policies
grant select on public.user_profiles, public.children, public.child_caregivers to authenticated;

-- User Profiles: Users can insert their own record and update ONLY full_name
grant insert (id, full_name) on public.user_profiles to authenticated;
grant update (full_name) on public.user_profiles to authenticated;

-- Children: Authorized caregivers can update ONLY non-provenance demographic fields
grant update (name, date_of_birth, sex, birth_weight_kg) on public.children to authenticated;

-- Note on Child Creation & Memberships:
-- Direct INSERT on public.children is intentionally NOT granted to authenticated.
-- Direct INSERT/UPDATE/DELETE on public.child_caregivers is intentionally NOT granted.
-- Direct DELETE on public.children is intentionally NOT granted.
-- Child creation is strictly performed through the atomic RPC public.create_child().

-- =============================================================================
-- 2. ROW LEVEL SECURITY ENFORCEMENT
-- =============================================================================
alter table public.user_profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_caregivers enable row level security;

-- =============================================================================
-- 3. USER PROFILES POLICIES
-- =============================================================================
drop policy if exists user_profiles_select_self on public.user_profiles;
create policy user_profiles_select_self on public.user_profiles
for select to authenticated
using (id = (select auth.uid()));

drop policy if exists user_profiles_insert_self on public.user_profiles;
create policy user_profiles_insert_self on public.user_profiles
for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists user_profiles_update_self on public.user_profiles;
create policy user_profiles_update_self on public.user_profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- =============================================================================
-- 4. CHILD CAREGIVERS POLICIES
-- =============================================================================
-- Membership lookup is strictly self-scoped (user_id = auth.uid()).
-- It does not query public.children, maintaining an acyclic dependency graph
-- and completely preventing recursive RLS policy evaluation.
drop policy if exists child_caregivers_select_self on public.child_caregivers;
create policy child_caregivers_select_self on public.child_caregivers
for select to authenticated
using (user_id = (select auth.uid()));

-- =============================================================================
-- 5. CHILDREN POLICIES
-- =============================================================================
-- View Policy: Authenticated users can view only children for whom they have
-- an authorized caregiver association in child_caregivers.
drop policy if exists children_select_caregiver on public.children;
create policy children_select_caregiver on public.children
for select to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = public.children.id
      and cc.user_id = (select auth.uid())
  )
);

-- Update Policy: Only caregivers with 'owner' or 'editor' access level may update.
-- Viewers and unrelated users cannot update.
drop policy if exists children_update_caregiver on public.children;
create policy children_update_caregiver on public.children
for update to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = public.children.id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = public.children.id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

-- =============================================================================
-- 6. POLICY METADATA AND COMMENTS
-- =============================================================================
comment on policy user_profiles_select_self on public.user_profiles is
  'Users may retrieve only their own user profile.';
comment on policy user_profiles_insert_self on public.user_profiles is
  'Users may insert only their own user profile matching authenticated UID.';
comment on policy user_profiles_update_self on public.user_profiles is
  'Users may update only their own profile full_name.';
comment on policy child_caregivers_select_self on public.child_caregivers is
  'Users can view only their own caregiver memberships. Acyclic by design.';
comment on policy children_select_caregiver on public.children is
  'Caregivers can view only children to which they are explicitly linked.';
comment on policy children_update_caregiver on public.children is
  'Only owner or editor caregivers can update permitted child demographics.';

commit;

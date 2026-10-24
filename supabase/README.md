# Phase 2: core child schema

Migration: `migrations/20261024071052_phase2_core_child_schema.sql`.
Scope: `user_profiles`, `children`, `child_caregivers`, their constraints,
indexes, RLS, timestamp/date triggers and atomic child creation. No health
tables, invitations, frontend adapter, or hosted database changes.

## Relationships and access

- `user_profiles.id` references existing `auth.users.id` (one-to-one,
  cascade on auth-user deletion). Users may select/insert/update their own
  profile; only `full_name` can be updated. After Phase 4, a private Auth INSERT
  trigger provisions profiles atomically; browser INSERT is removed. See the
  [Phase 4 integration guide](../docs/Phase4_Auth_Integration.md).
- `children.created_by` references `auth.users.id` with `ON DELETE RESTRICT`.
  It records immutable creator provenance; it does not confer access.
- `child_caregivers.child_id` references `children.id` with `ON DELETE CASCADE`.
  `user_id` references `auth.users.id` with `ON DELETE RESTRICT`.
  Each `(child_id, user_id)` pair is unique.
- All three tables enable RLS in the migration transaction. Anonymous access
  and default public/client table grants are revoked. Only authenticated,
  authorized operations receive explicit grants and policies.
- Caregivers can read assigned children. Owners/editors can update `name`,
  `date_of_birth`, `sex`, `birth_weight_kg`. Viewers cannot update.
- Users can read only their own membership rows, including their access level.
  Even owners cannot list other caregivers yet. Memberships have no client
  insert/update/delete grants or policies. Child deletion is also unavailable.
- Child policies read memberships; membership policies only compare `user_id`
  to `auth.uid()`. There is no circular policy dependency or RLS lookup helper.
- Trusted database administrators and Supabase's service role can bypass RLS;
  never expose privileged credentials to browser code.

## Atomic creation API

```ts
const { data, error } = await supabase.rpc('create_child', {
  p_name: input.name,
  p_date_of_birth: input.dateOfBirth,
  p_sex: input.sex,
  p_birth_weight_kg: input.birthWeightKg ?? null,
  p_relationship: 'parent', // optional descriptive label, defaults to parent
})
```

`public.create_child` is an authenticated-only SECURITY INVOKER wrapper.
`private.create_child_with_owner` is the only SECURITY DEFINER function. It
requires `auth.uid()`, generates a new child UUID with `gen_random_uuid()`, and
inserts that caller's `owner` membership in the same statement/transaction.
An invalid membership rolls back the child too. There is no child-ID, target-user
or access-level argument, so this API cannot attach callers to existing children.

The private function requires `authenticated` execution and schema USAGE because
the invoker wrapper calls it under the caller's privileges. A SQL client with
that role could call it directly, but the same identity checks and atomic
creation-only restrictions apply. `anon`, `PUBLIC` and `service_role` execution
are revoked. Every function has `search_path = ''` and qualified relation names;
the invoker-only trigger functions have no client execute grants.

**Keep `private` out of Data API exposed schemas.** Apply migrations as the
trusted Supabase migration role (`postgres`), which owns the privileged function
and tables. RLS deliberately is not forced on that owner: atomic bootstrap needs
to insert a membership before the caller has child access.

## Validation and indexes

- Required child name, DOB, sex, creator; required membership references,
  relationship and access level. Names/relationships cannot be blank.
- Sex is `male` or `female`, matching `src/types/common.ts`.
- DOB uses native `date`, must be finite, and cannot exceed today's calendar
  date in `Asia/Colombo`. Future-date validation uses a trigger rather than a
  time-dependent CHECK. There is no age-five cutoff: existing records must
  remain valid as children age.
- Optional birth weight uses exact, unconstrained `numeric`, must be positive
  and finite (including rejection of NaN). No unsupported clinical weight
  thresholds or silent fixed-scale rounding are introduced.
- All timestamps are non-null `timestamptz` with database defaults. UPDATE
  triggers preserve `created_at` and set `updated_at` from `clock_timestamp()`.
  Client column grants prevent timestamp and provenance forgery.
- Primary keys and the unique membership constraint create B-tree indexes.
  `children(created_by)` covers its auth FK;
  `child_caregivers(user_id, child_id)` covers user membership lookups and FK.
  The unique `(child_id, user_id)` index covers the child FK without a redundant
  single-column child index.

## Local tests

Install isolated test tooling without changing application dependencies:

```powershell
npm install --prefix node_modules/.phase2-tools --no-audit --no-fund --save-exact supabase@2.122.0 @electric-sql/pglite@0.5.11
node supabase/tests/phase2-core.test.mjs
node supabase/tests/phase3-rls.test.mjs
```

The runner uses ephemeral PGlite (PostgreSQL 18.6) with test-only auth objects,
roles, JWT-subject context and Supabase-style default grants. It applies the
actual migrations, then exercises authorization, constraints, atomic rollback,
UUIDs, timestamp protection, foreign keys and private function permissions.
It never reads `.env` or connects to a remote database. The local auth fixture
is not a migration and must never be applied to Supabase.

## Phase 3: secure row level security (RLS)

Migration: `migrations/20261024073000_phase3_secure_row_level_security.sql`.
Test Suite: `supabase/tests/phase3-rls.test.mjs`.

### Security Invariants

- **Multi-Tenant Isolation**: Two independent accounts (Account A and Account B)
  cannot access or modify each other's children. Knowing a child UUID does not
  permit an unauthorized caller to view or update it (IDOR protection).
- **Acyclic Membership Policies**: `child_caregivers` SELECT policy compares only
  `user_id = (select auth.uid())` without querying `public.children`. This prevents
  circular policy recursion.
- **Role-Based Update Granularity**:
  - `owner` and `editor` caregivers may update permitted demographics.
  - `viewer` caregivers receive 0 rows on update attempts.
- **Atomic Creation Provenance**: Direct `INSERT` on `public.children` is denied;
  all creations go through `public.create_child` / `private.create_child_with_owner`.
- **Privilege Escalation Prevention**: `public.child_caregivers` has no client
  INSERT or UPDATE grants. Users cannot assign themselves owner access or attach
  themselves to arbitrary children.
- **No Client Deletion**: Direct DELETE is disabled on `children` and
  `child_caregivers` for the MVP.

## Member 4 integration

- Add new, later versioned migrations; reference `public.children(id)` using
  native UUID foreign keys and index health-table `child_id` columns.
- Enable RLS on each health table immediately. Reads must check the caller's
  caregiver membership. Writes must additionally require `owner` or `editor`;
  child visibility alone would incorrectly allow viewer writes.
- Reuse `child_caregivers` as the authorization source, never `created_by`.
  Its SELECT policy already limits callers to their own memberships. Avoid
  adding reverse policy dependencies from memberships to children/health tables.
- Define health-record delete/retention semantics explicitly. Child deletion,
  auth-user deletion with linked records, owner transfer and invitations need
  separate reviewed workflows. There is no client delete path in Phase 2.
- Database rows use snake_case; existing service contracts use camelCase.
  Map `date_of_birth`, `birth_weight_kg`, and nullable weight at the adapter
  boundary. PostgreSQL NUMERIC may need conversion to a JavaScript number in
  the chosen client. Birthdays remain `YYYY-MM-DD`, without timezone conversion.
- `clinicName` exists in the TypeScript contract but is intentionally not
  persisted by this requested schema. Resolve this before implementing the
  connected adapter; do not silently promise to save it.
- Use `create_child` for child creation. Two separate client inserts will fail
  and cannot replace the atomic API.

Suggested commit message: `feat(db): implement and verify phase 3 secure row level security policies`


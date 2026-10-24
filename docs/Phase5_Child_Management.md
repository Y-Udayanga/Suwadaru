# Phase 5: child management integration

Implements FR-010–012 and BR-01/08 using the existing Supabase client, Phase 2
schema, Phase 3 RLS and Phase 4 account-profile provisioning. No React screens,
caregiver invitations, staff access or other feature backends are added.

## Database dependencies

Apply migrations in filename order through
`20261024082345_phase5_child_management.sql` using the trusted migration role.
This repository change does not deploy to a hosted project.

- `public.children`: adds nullable `clinic_name`, name/clinic validation and
  four-digit ISO date bounds; permits authorized demographic updates only.
- `public.child_caregivers`: existing membership RLS remains authoritative.
  Owners/editors can update; viewers can read. Unlinked accounts cannot read or
  update. Direct child insertion, deletion, ownership changes and membership
  writes remain unavailable to clients.
- `public.user_profiles`: Phase 4 must provision the signed-in user's profile.
- `public.create_child`: authenticated invoker RPC delegates to a private,
  fixed-search-path definer function. Both inserts commit together or roll back.
  It derives owner identity from `auth.uid()` and requires the account profile.
  The new trailing optional `p_clinic_name` retains existing five-argument calls.
  The old signature is removed to prevent ambiguous RPC overloads.

Keep `private` outside the Data API exposed schemas. Use only the existing
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. No service-role key is
needed. Existing rows that violate the new constraints will stop the migration;
review those rows before deployment instead of silently rewriting child data.

## Member 1 integration

```ts
import { childService } from '@/services/children'
import { AppError } from '@/services/contracts/errors'

// All methods return promises; no Supabase imports belong in presentation code.
const children = await childService.list()
const child = await childService.create({
  name: 'Fictional Child', dateOfBirth: '2024-02-29', sex: 'female',
  birthWeightKg: 3.125, clinicName: 'Fictional Clinic',
})
await childService.get(child.id)
await childService.update(child.id, { clinicName: null })
```

Named exports are also available: `createChild(input)`, `getMyChildren()`,
`getChildById(childId)` and `updateChild(childId, input)`. They are aliases of
`childService.create/list/get/update`, preserving the existing `ChildService`
interface. `createChildService(client, now?)` supports dependency-injected tests.

The service maps snake_case database rows to the existing camelCase `Child`
contract, omitting null optional response fields. Update inputs omit a field to
preserve it, or use `null` to clear `birthWeightKg`/`clinicName`. Form number
strings must be converted to numbers; do not convert a blank weight to zero.
Names/clinic names use 1–200 trimmed characters without control characters;
birth weight must be positive and finite. No clinical weight cutoff is invented.

Keep birthdates as `YYYY-MM-DD` strings from the date input through rendering and
submission. Do not use `new Date(dateOfBirth)` or `toISOString()` for birthdays.
Calendar validation handles leap years and compares against today in
Asia/Colombo, matching the database trigger. No age-five cutoff is enforced.

Wait for AuthProvider to settle before fetching. Set loading before each request
and clear it in `finally`; disable save while pending. Replace UI state only
after success. An empty array is the Add Child state, not an error. After create,
select the returned ID and refresh the child list. Ignore stale fetch responses
when the account or selected child changes; clear child data on logout. Keep
connected records out of demo state and persistent browser caches.

Catch `AppError` and show its safe `message`:

| Code | UI behavior |
|---|---|
| `validation` | Keep entered values and show form feedback. |
| `unauthenticated` | Clear child state and route to sign-in. |
| `not_found` | Show unavailable child; return to selector. Hidden/nonexistent IDs and denied updates share this response. |
| `unavailable` | Show retry; retain unsaved input. Do not display raw database errors. |

Do not automatically retry creation after an uncertain network failure: first
refresh the list to avoid accidentally creating duplicate profiles.

## Verification

```powershell
# One-time isolated SQL test dependency (same setup as prior phases):
npm install --prefix node_modules/.phase2-tools --no-audit --no-fund --save-exact @electric-sql/pglite@0.5.11
npm run test:children
npm run test:auth
npm run typecheck
npm run lint
npm run build
```

Child tests use the actual installed Supabase SDK with synthetic HTTP for adapter
serialization and PGlite PostgreSQL with all migrations for database behavior.
They cover single/multiple children, owner association, authorized reads,
owner/editor updates, viewer/unrelated denial, invalid dates/weights/names,
unauthenticated creation, forbidden provenance/membership writes, transaction
rollback and timezone stability. All accounts and children are fictional.
They do not verify hosted Auth, deployed PostgREST, or hosted database advisors.
Run the same create/list/get/update smoke flow with fictional accounts after
deployment before connecting real frontend flows.

Suggested commit: `feat(children): add secure typed child management services`

# Phase 6 — Member 1 integration handoff

Branch: `feature/backend-auth`. Scope: BRD B1 auth and child profiles, FR-010–014;
no clinical features or broad UI changes. See [Phase 7 audit](Phase7_Backend_Audit.md)
for executed tests, hosted blockers and deployment steps.

## Current UI and proposed coordination

All six target pages currently render `FeaturePlaceholder`; there are no form
values or dashboard collections to wire in this checkout. Types align with the
services, but complete browser journeys cannot pass before Member 1 implements
those pages. No Member 1/2 files were modified in this phase.

| Member 1 file | Proposed separate integration patch |
|---|---|
| `src/features/auth/LoginPage.tsx` | Email/password form; await `service.signIn`, navigate to `/dashboard` only on success. |
| `src/features/auth/RegisterPage.tsx` | Collect `fullName`; show pending email verification instead of claiming login. |
| `src/features/auth/ForgotPasswordPage.tsx` | Call `sendPasswordReset`; replace preview-only copy with a neutral check-inbox result. |
| `src/components/layout/AppShell.tsx` | Mount `useChildProfiles()` once, distribute via Outlet context, add logout, replace connected navigation's demo IDs with authorized returned UUIDs. Preserve demo navigation in its demo mode. |
| `src/features/dashboard/DashboardPage.tsx` | Consume the shared child collection/selection; loading, retry and Add Child empty states. |
| `src/features/children/AddChildPage.tsx` | Use the shared context's `createChild`; select returned child and navigate after success. |
| `src/features/children/ChildOverviewPage.tsx` | Honor the `childId` prop, retrieve with `getChildById`, update with `updateChild`, refresh the shared list after success. |
| `src/app/router.tsx`, `src/app/providers.tsx` | Retain existing sole AuthProvider, guard and callback routes; merge their prior Phase 4 changes with Member 1 instead of replacing the files. |
| root `vercel.json` | Coordinate the SPA rewrite proposed in the audit before deployment. No hosting configuration was changed here. |

Member 2's vaccine/growth/nutrition/appointment pages keep the existing
`ChildFeaturePageProps = { childId: string }` interface. Do not switch them to
ambient selection or feed real children into unfinished demo health services.
Keep `src/data/mock` and demo service contracts intact. A connected dashboard
must not display mock measurements as if they belong to a new database UUID.

## Exact API contracts

```ts
import { useAuth } from '@/hooks/useAuth'
import { authService, toAuthError, AuthServiceError } from '@/services/auth'
import type { SignUpInput, SignInInput, SignUpResult, ConnectedAuthService } from '@/services/auth'
import { createChild, getMyChildren, getChildById, updateChild, childService } from '@/services/children'
import type { Child, CreateChildInput, UpdateChildInput } from '@/types'
import { AppError } from '@/services/contracts/errors'
import { useChildProfiles } from '@/hooks/useChildProfiles'
import type { ChildProfilesContext } from '@/hooks/useChildProfiles'
```

| API | Result |
|---|---|
| `authService.signUp({ email, password, fullName })` | `Promise<SignUpResult>`: `{ status: 'verification_pending', session: null }` or `{ status: 'authenticated', session: Session }` |
| `signIn({ email, password })` | `Promise<Session>` |
| `signOut()`, `sendPasswordReset(email)` | `Promise<void>` |
| `updatePassword(password)` | `Promise<User>` after Auth verifies the current user |
| `getCurrentUser()`, `getSession()` | `Promise<User \| null>`, `Promise<Session \| null>` |
| `onAuthStateChange(listener)` | Unsubscribe function; listener receives `(AuthChangeEvent, Session \| null)` and must remain synchronous |
| `completeCallback(url)` | `Promise<Session>`; callback component already calls this |
| `createChild(input)`, `updateChild(id, patch)`, `getChildById(id)` | `Promise<Child>` |
| `getMyChildren()` | `Promise<Child[]>`, RLS-authorized owned **or linked** children |
| `childService.create/list/get/update` | Same methods/results as named child exports |

`User`, `Session`, and `AuthChangeEvent` are Supabase types. `User` is the Auth
identity, not a typed `user_profiles` row or `DemoSession`. Do not use the old
demo `AuthService` contract for real sign-in. No account-profile editing service
is provided; user profiles are provisioned server-side. Child deletion is
intentionally unavailable: child management provides create/read/update only.

`Child` has `id`, `name`, date-only `dateOfBirth`, `sex: 'male' | 'female'`, optional
numeric `birthWeightKg` and optional `clinicName`. All fields are camelCase;
database snake_case stays inside services. Missing optional response fields are
omitted. Create accepts those fields except `id`; update omits preserved fields
and accepts `null` to clear optional weight/clinic. Convert nonblank form weights
to numbers; omit blanks on create. Keep birthdays as `YYYY-MM-DD`, never convert
them through `Date`. Never submit creator, timestamps, caregiver role or user ID.

## Auth usage in Member 1's components

These handler excerpts assume component-local `setError`, `setPending`,
`setSuccess` and React Router's `navigate`. All hooks run at component top level.
Use `finally` to release pending state and disable duplicate form submissions.

```tsx
const { service, loading, isAuthenticated, user, error: restorationError } = useAuth()

async function register(input: SignUpInput) {
  setPending(true)
  try {
    const result = await service.signUp(input)
    if (result.status === 'verification_pending') {
      setSuccess('Check your email to confirm your account, then sign in.')
    } else navigate('/dashboard', { replace: true })
  } catch (error) { setError(toAuthError(error).message) }
  finally { setPending(false) }
}

async function login(input: SignInInput) {
  setPending(true)
  try {
    await service.signIn(input)
    navigate('/dashboard', { replace: true })
  } catch (error) { setError(toAuthError(error).message) }
  finally { setPending(false) }
}

async function logout() {
  try {
    await service.signOut()
    navigate('/login', { replace: true })
  } catch (error) { setError(toAuthError(error).message) }
}

async function reset(email: string) {
  try {
    await service.sendPasswordReset(email)
    setSuccess('If an account exists for this email, you will receive a reset link.')
  } catch (error) { setError(toAuthError(error).message) }
}
```

Do not navigate during `loading`. The sole provider observes SDK events and
restores persisted sessions. Logout clears it and unmounts the protected shell.
Do not add another provider, auth listener, client, token log or token storage.
Use `restorationError` for a reload/retry affordance rather than an infinite
spinner. `signOut` is local-browser scope; it is not global-device revocation.

Auth errors use `AuthServiceError`/`toAuthError`: `validation`,
`invalid_credentials`, `email_unconfirmed`, `rate_limited`, `invalid_link`,
`unauthenticated`, `unavailable`. Display only safe messages. Child errors use
`AppError`: `validation` → keep form inputs; `unauthenticated` → clear data and
sign in; `not_found` → unavailable child (hidden and nonexistent IDs look alike);
`unavailable` → retry. Never display arbitrary exception messages.

## Shared child selection and creation

New backend-owned `useChildProfiles()` is opt-in; it has not been mounted in
Member 1's shell. Call it **once per connected AppShell**, then pass its value
through `<Outlet context={profiles} />`. Pages consume that same context instead
of calling the hook independently. Its service can be injected for tests.

```tsx
// Proposed AppShell addition; retain Member 1's existing layout and nav markup:
const profiles = useChildProfiles()
// ... <Outlet context={profiles} />

// Dashboard/AddChildPage:
const profiles = useOutletContext<ChildProfilesContext>() // from react-router
// profiles.children, selectedChild, selectedChildId, loading, saving, error,
// selectChild(id), refresh(), createChild(input)

async function saveChild(input: CreateChildInput) {
  try {
    const child = await profiles.createChild(input)
    // On success the shared collection includes this persisted child and selects it.
    navigate(`/children/${encodeURIComponent(child.id)}`)
  } catch (error) {
    setError(error instanceof AppError ? error.message : 'Unable to save child profile.')
  }
}

function chooseChild(id: string) {
  profiles.selectChild(id)
  navigate(`/children/${encodeURIComponent(id)}`)
}

// Standalone service use, outside the shared selection controller:
const children: Child[] = await getMyChildren()
const child: Child = await createChild(input)
// If used in a page, explicitly refresh shared state after create/update:
await profiles.refresh()
profiles.selectChild(child.id)
```

The adapter returns `refresh(): Promise<readonly Child[]>` and
`createChild(): Promise<Child>`; consume the snapshot for rendering. It blocks
duplicate creation, ignores old list results, rejects late creation after account
change and clears data on teardown. It never persists child records in browser
storage. Errors are stored and rejected for handlers; initial load errors are
stored for rendering. An empty successful list is the Add Child state.

After an uncertain create network failure, refresh the list before offering
another create; automatic retries can duplicate a committed child. Render an
explicit retry action using `profiles.refresh().catch(...)`.

For deep links, the URL's `:childId` is authoritative. Resolve it from the loaded
authorized collection or call `getChildById`; synchronize the selection only if
accessible. Never silently show the first child's data under another child's
URL. If membership is revoked, clear selection/show unavailable and refresh.
Build health-feature links from the chosen real UUID while continuing to pass
that UUID as the existing page prop. RLS still decides access independently.

## Route/callback contract and acceptance checklist

`AppProviders` already mounts one AuthProvider. `RequireAuth` waits for restoration
and guards the shell and all child routes. Public login/register/forgot-password,
`/auth/callback`, and `/reset-password` must remain outside that guard. Callback
exchanges use PKCE in the requesting browser; error/missing/expired links cannot
fall back to a preexisting session. Fixed destinations prevent open redirects.
Completed callback refresh requires a new link; ordinary session refresh works.

Pending browser/inbox tests after the coordinated frontend patch and deployment:

- Signup → pending state and one atomic profile; open email → dashboard.
- Valid login → dashboard; invalid password → safe error without a session.
- Logout → session and child state clear; protected deep link → login.
- Refresh signed-in dashboard → restored session then authorized children.
- Create fictional child → persisted child and owner membership → dashboard list.
- Select two children → correct URL/selection/feature prop; repeat after refresh.
- Another account cannot retrieve the first family's UUID, even through the API.
- Reset email → valid callback → new password; expired/reused link → safe error.

Local adapter/service/RLS tests are recorded in the audit, not substituted for
these browser/inbox checks. No messages or PRs were sent to other members.

Suggested commit: `feat(integration): add account-scoped child selection and backend audit handoff`

# Phase 4: connected authentication (Member 3 → Member 1)

Implemented on `feature/backend-auth`. The BRD's B1 connected MVP permits real
Supabase authentication; its F0 demo contract remains unchanged. No existing
login, registration, or forgot-password page was edited. Those pages still show
placeholders until Member 1 connects their forms. Protected app routes now wait
for auth restoration and redirect unauthenticated users to `/login`.

## Exports and ownership

- `src/services/auth`: `authService`, `createAuthService`, `AuthServiceError`,
  `toAuthError`, and types `ConnectedAuthService`, `SignInInput`, `SignUpInput`,
  `SignUpResult`, `AuthErrorCode`.
- `authService`: `signUp`, `signIn`, `signOut`, `sendPasswordReset`,
  `updatePassword`, `getCurrentUser`, `getSession`, `onAuthStateChange`,
  `completeCallback`. Expected failures reject with a safe `AuthServiceError`.
- `src/auth/AuthProvider.tsx`: `AuthProvider`, already mounted exactly once in
  `AppProviders`. Do not add another provider or create another Supabase client.
- `src/hooks/useAuth.ts`: `useAuth()`, returning `service`, `loading`,
  `isAuthenticated`, `status`, `user`, `session`, and restoration `error`.
  `status` is `loading | authenticated | unauthenticated`.
- `src/auth/RequireAuth.tsx`: outlet guard already wraps the app shell.
- Existing `src/services/contracts/auth-service.ts` remains the **demo-only**
  interface. Use `ConnectedAuthService` for connected pages, never treat a
  `DemoSession` as a real identity.

## Supabase configuration and deployment order

1. Apply committed Phase 2, Phase 3, then
   `supabase/migrations/20261024080723_phase4_auth_profile_provisioning.sql`
   using the trusted migration role (`postgres`). The Phase 4 migration is
   prepared and locally tested; **it has not been applied to the hosted project**.
   Do this before enabling registration in a deployed frontend.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in untracked `.env`.
   Restart Vite after changes. Only public client credentials belong in `VITE_`.
3. Enable Email provider and Confirm email in Authentication → Providers.
   Configure the server's password policy to require at least 8 characters;
   stricter server requirements still apply. Production email needs working
   SMTP configuration; check Supabase delivery limits before testing.
4. In Authentication → URL Configuration set Site URL to the deployment's
   canonical origin and add exact Redirect URLs, for example:

   ```text
   http://localhost:5173/auth/callback
   http://localhost:5173/reset-password
   https://YOUR-APP.example/auth/callback
   https://YOUR-APP.example/reset-password
   ```

   Use your actual Vite port/origin and deployed domain, with no trailing slash
   on callback paths. Every preview origin needs its own approved URLs.
5. Email templates must preserve Supabase's `{{ .ConfirmationURL }}` link so
   verification returns to the supplied redirect. Do not replace it with a
   bare Site URL, token fragment, or custom `token_hash` flow: this implementation
   explicitly exchanges the PKCE `?code=` response. Hosting must serve the SPA
   `index.html` for direct requests to both callback paths.

The browser client uses PKCE, SDK-managed persistent sessions and auto refresh.
The email link must open in the **same browser/device/storage context** where
signup or reset was requested because that browser holds the PKCE verifier.
Starting another PKCE email operation may replace that verifier; use the newest
email. Cross-device links require a separately designed token-hash/OTP flow.

## Member 1: connect the forms

Use component-local pending/error/success state for each form, disable duplicate
submits, and clear password fields on success. Do not log form values, SDK errors,
users, or sessions. Show `toAuthError(error).message`, never raw SDK messages.

```tsx
import { useAuth } from '@/hooks/useAuth'
import { toAuthError } from '@/services/auth'
import { useNavigate } from 'react-router'

// Inside your page component:
const { service, loading, isAuthenticated, user, error: restorationError } = useAuth()
const navigate = useNavigate()

// Registration submit handler, inside try/catch/finally for local pending state:
try {
  const result = await service.signUp({ email, password, fullName })
  if (result.status === 'verification_pending') {
    setSuccess('Check your email to confirm your account, then sign in.')
    // Stay on the page. Do not navigate or manufacture an authenticated state.
  } else {
    navigate('/dashboard', { replace: true })
  }
} catch (error) {
  setError(toAuthError(error).message)
}

// Login submit handler:
try {
  await service.signIn({ email, password })
  navigate('/dashboard', { replace: true })
} catch (error) {
  setError(toAuthError(error).message)
}

// Forgot-password handler:
try {
  await service.sendPasswordReset(email)
  setSuccess('If an account exists for this email, you will receive a reset link.')
} catch (error) {
  setError(toAuthError(error).message)
}

// Logout handler:
try {
  await service.signOut()
  navigate('/login', { replace: true })
} catch (error) {
  setError(toAuthError(error).message)
}
```

These are handler snippets, not a complete page. Keep existing page design.
Use `loading` to avoid redirect flicker while refreshing; display
`restorationError?.message` with a reload action when restoration fails.
The provider gets state from SDK events; pages must not maintain a separate
authenticated user or write tokens to storage. The SDK handles localStorage.
`signOut` ends this browser's session and propagates SDK state changes to other
tabs; it does not promise revocation of all other devices' sessions.

Supabase may deliberately obscure duplicate-email signup results. Treat pending
as a neutral check-your-inbox state, never proof that a new account was created.
Invalid login credentials use one generic message. Email-unconfirmed and rate
limit failures provide separate safe guidance.

## Callback and password contract

- `/auth/callback?code=...`: exchanges the code once per in-flight operation,
  lets SDK events update the provider, then navigates to `/dashboard`.
- `/reset-password?code=...`: exchanges the code before rendering the password
  form. Password confirmation is checked locally; `updatePassword` verifies the
  current user with Auth before calling `updateUser`. Success clears passwords
  and offers the dashboard; it retains the authenticated recovery session.
- Invalid/expired/reused/missing codes and Supabase `error` redirects show a safe
  message and links to request another reset email or sign in. A preexisting
  session cannot turn a failed callback into success. Codes/error payloads are
  removed from browser history after completion. No untrusted `next` redirect.
- Refreshing a completed callback URL deliberately requires a new email link
  (the single-use code was removed). The ordinary signed-in session still
  restores on refresh. A signed-in account settings page can call
  `updatePassword` directly; it does not need an email callback.

## Profile and security guarantees

The private `SECURITY DEFINER` trigger runs on `auth.users` INSERT, with a fixed
empty search path, fully qualified relations, and no client execute privilege.
Signup has no authenticated `auth.uid()` yet: the trusted trigger derives the
profile ID only from the inserted auth row. No public RPC accepts a target ID.
The trigger creates the profile in the **same transaction** as account creation;
failure rolls back both. Backfill creates missing profiles for older accounts
and preserves existing names. Future Auth metadata edits do not overwrite names.

Only string `full_name` metadata is used; names are trimmed, control characters
removed and capped at 200 characters in the trigger. Missing/malformed names
produce a nullable name, never a missing profile. Metadata is untrusted display
data: render it as React text, never HTML, and never use it to grant access.
Client name validation is stricter and returns an actionable error.

Phase 4 removes browser profile INSERT and retains self-only SELECT and
`full_name` UPDATE through RLS. Profiles, child memberships and health data
authorization stay in PostgreSQL RLS, independent of route guards. No passwords
are manually stored; no service-role/secret credentials or session logs are used.

## Tests and results

```powershell
npm run test:auth
node supabase/tests/phase2-core.test.mjs
node supabase/tests/phase3-rls.test.mjs
npm run typecheck
npm run build
npm run lint
```

The database test uses existing isolated tooling at
`node_modules/.phase2-tools/node_modules/@electric-sql/pglite`. Setup instructions
are in `supabase/README.md` if this ignored tooling is missing on a new checkout.
No new application dependency is required.

Verified locally:

- 12 auth service/state tests: signup pending/immediate, metadata/validation,
  confirmation and recovery exchanges, invalid password, safe errors, logout,
  session restoration, stale restore races, listener cleanup, reset-email
  contract, password update and missing configuration. Includes the installed
  Supabase SDK with a stubbed HTTP transport to verify PKCE recovery events,
  storage restoration in a new client instance, password update and logout.
- Six database groups (seven Node tests including the parent): backfill,
  profile provisioning, malformed metadata, atomic rollback, profile RLS/grants,
  and private-function permissions/search path, using real PostgreSQL in PGlite.
- Existing Phase 2: 15 groups pass. Existing Phase 3: 14 groups pass. Those suites
  test their own historical migrations; Phase 4 tests verify the changed profile
  provisioning behavior after all three migrations.
- TypeScript and production build pass. Lint has only the preexisting
  `src/components/ui/button.tsx` Fast Refresh warning. Vite reports a bundle-size
  warning above 500 kB.

These are isolated tests, not proof of hosted SMTP delivery or live Supabase Auth.
Hosted migration, Auth settings and real inbox confirmation/reset tests remain
deployment/integration checks. No hosted accounts or schema were changed.

### Live acceptance checklist after deployment and Member 1 integration

Use fictional test accounts and a controlled inbox. Never record passwords or
tokens in screenshots or test reports.

1. Register: verify pending UI, no dashboard access before confirmation, and one
   profile already present in the database for the Auth user.
2. Open the confirmation email in the requesting browser: verify callback,
   authenticated provider state, own profile readable, dashboard available.
3. Sign out, enter an invalid password: verify generic error and no session.
4. Sign in with the correct password; refresh: session restores without a login
   flash. Sign out: user/session clear and protected routes redirect.
5. Request reset: neutral response. Follow the email; save a new password;
   sign out and verify old password fails, new password works.
6. Test expired/reused links and error redirects, including with an existing
   session: safe error, no password form. Request and use a fresh link.
7. Two accounts cannot read/update each other's profile or children. Verify
   through the API as well as UI; route guards alone do not prove isolation.

Suggested Git commit message:
`feat(auth): add Phase 4 Supabase authentication and atomic profile provisioning`

## Exact file manifest

Created:

- `src/auth/AuthProvider.tsx`
- `src/auth/auth-context.ts`
- `src/auth/AuthCallbackPage.tsx`
- `src/auth/RequireAuth.tsx`
- `src/hooks/useAuth.ts`
- `src/services/auth/auth-service.ts`
- `src/services/auth/auth-state.ts`
- `src/services/auth/index.ts`
- `src/services/auth/auth.test.mjs`
- `supabase/migrations/20261024080723_phase4_auth_profile_provisioning.sql`
- `supabase/tests/phase4-auth.test.mjs`
- `docs/Phase4_Auth_Integration.md`

Modified:

- `.env.example`: align public auth environment variable names.
- `package.json`: add `test:auth`; no dependency changes.
- `src/utils/supabase.ts`: one configured PKCE client; safe missing configuration.
- `src/app/providers.tsx`: mount the sole provider.
- `src/app/router.tsx`: callback/reset routes and authenticated outlet.
- `src/app/routes.ts`: callback/reset route constants.
- `src/features/todos/TodosPage.tsx`: handle missing shared-client configuration.
- `supabase/README.md`: document Phase 4 profile provisioning behavior.

## Official references

- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [User/profile management](https://supabase.com/docs/guides/auth/managing-user-data)
- [Redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [PKCE code exchange](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

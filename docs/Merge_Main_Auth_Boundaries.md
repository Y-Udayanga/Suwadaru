# Main merge: demo and connected auth boundaries

The merge preserves main's completed fictional frontend and Member 3's backend
services. These are separate release modes until Member 1 connects the pages.

- `AppProviders` owns the browser router and tooltip provider.
- `DemoAppProviders` scopes the frontend's mock AuthProvider and ChildProvider
  to demo routes. The existing `ProtectedRoute` guards their AppShell. Demo login
  does not grant Supabase access and is never checked by `RequireAuth`.
- `ConnectedAuthRoutes` scopes the real AuthProvider to `/auth/callback` and
  `/reset-password`, outside demo guards. Neither scope nests the other provider.
- The Phase 6/7 guides describe the pre-merge placeholder frontend. Main now
  supplies completed demo screens; their connected integration patches must be
  adapted to these screens instead of replacing them.
- A successful confirmation still targets `/dashboard`; that route currently
  belongs to the demo UI and can redirect to demo login. It is not yet a connected
  dashboard. Member 1 must migrate the shell/pages to the real provider and
  child service together, remove the demo guard in that connected scope, and
  use `RequireAuth`. Never satisfy a real-data guard with a mock session.
- Backend hooks/services, SQL/RLS, existing demo health services, and Member 2's
  pages remain intact. Database authorization is still enforced by RLS.

Both frontend (`npm test`) and backend (`test:auth`, `test:children`) scripts
remain available. The duplicate conflicting `test` key was consolidated to
`npx tsx --test tests/*.test.ts`, matching the current test directory.

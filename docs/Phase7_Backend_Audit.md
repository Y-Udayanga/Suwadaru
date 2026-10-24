# Phase 7 — backend auth/database audit

Audit date: 2026-10-24 (Asia/Colombo). Branch `feature/backend-auth`, starting
commit `ccf5843`. Read the BRD and Member 3's client, auth/context/hooks, child
services/types, migrations, tests, environment examples, Git ignore rules and
Phase 4/5 documentation. Reviewed the app provider/router integration, Todos
client caller, frontend placeholders and demo fixtures. No frontend screens,
mock data, hosted schema, Auth users, environment settings or deployments were
changed. [Phase 6 handoff](Phase6_Frontend_Integration.md) describes the proposed
Member 1 integration patches and exact imports/results.

## Result

Local backend and migration tests pass. **Not ready for connected deployment**:
the configured hosted database is behind the code and its migration history
is empty; Member 1's pages are placeholders. No live signup, inbox confirmation,
password reset, browser redirects or hosted child CRUD success is claimed.

| Requested check | Evidence and status |
|---|---|
| 1. Client configuration | PASS locally: single SDK 2.118.0 client, publishable variables, PKCE/manual callback exchange, persist/refresh enabled, debug disabled. Missing config does not crash public routes. Local `.env` has expected URL/key formats; no values printed. Vercel values not inspected. |
| 2. Committed secrets | PASS heuristic: 223 reachable local Git blobs scanned for secret keys, privileged JWTs, private keys, provider/GitHub tokens, credentialed DB URLs; no matches. No tracked real `.env`. Not a comprehensive secret-scanner certification or a scan of unavailable remote history. |
| 3. Signup/login | PASS isolated service/SDK tests. Hosted flow UNVERIFIED and currently blocked by missing profile provisioning; UI forms absent. |
| 4. Confirmation/reset | PASS isolated pending-state, code-exchange, expired-link and SDK recovery-event tests. Live delivery/templates/provider settings UNVERIFIED. |
| 5. Refresh restoration | PASS SDK-storage recreation and listener/stale-response tests. Browser refresh journey pending frontend integration. |
| 6. Logout | PASS isolated session clear/state transitions; local-browser scope documented. Selection cleanup/account-change races tested. |
| 7. RLS | PASS local real PostgreSQL tests; hosted catalog reports RLS on all three app tables with membership/self policies. Actual hosted API isolation not exercised with accounts. |
| 8. Atomic owner creation | PASS real SQL: RPC creates child and caller owner together; failed membership rolls back child. Current hosted RPC is an older five-argument version. |
| 9. Cross-family isolation | PASS local direct SQL reads/updates under distinct JWT-subject roles. RLS applies independently of UI. |
| 10. Escalation prevention | PASS local no direct membership writes, arbitrary attachment, provenance updates or client deletion. Metadata is never an authorization source. |
| 11. Contracts | PASS TypeScript and SDK serialization: `ConnectedChildService` extends existing `ChildService`; camelCase mapping, date-only strings and optional/null semantics agree. Auth's real and demo types intentionally differ. No account-profile edit/delete service and no child delete API is claimed. |
| 12. Migration chain | PASS clean PGlite replay of all four migrations. Phase 4 test now preserves chronological order around backfill fixtures; Phase 5 also replays full chain. Native Supabase/Docker/PG17 replay not executed. |
| 13. Frontend instructions | PASS handoff documents exact integration points, imports, results, safe errors, selection propagation, ownership boundaries and pending UI checklist. |
| 14. Deployment configuration | DOCUMENTED below; NOT applied or verified on Vercel. |
| 15. Fixtures | PASS review: synthetic parents/children, example.test inboxes, fictional clinics and generated UUIDs; no identified production/medical records. |
| 16. Member 4 FK readiness | PASS local UUID PK/FK integrity and access model; guidance below. Hosted Phase 4/5 must be reconciled before connected work. |

## Commands actually executed

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS; Vite warns about a 526.65 kB JS chunk |
| `npm run lint` | PASS exit status; preexisting `button.tsx` Fast Refresh warning |
| `npm run test:auth` | 19 Node tests pass (includes parent database test) |
| `npm run test:children` | 13 Node tests pass (includes parent database test) |
| `node supabase/tests/phase2-core.test.mjs` | 15 groups pass |
| `node supabase/tests/phase3-rls.test.mjs` | 14 groups pass |
| `node --test src/services/integration/child-selection.test.mjs` | 8 tests pass |
| `node scripts/audit-repository.mjs` | 223 history blobs, zero recognized credentials; local env format checks pass |

SQL tests use PGlite PostgreSQL 18.6 with synthetic auth roles and `auth.uid()`;
SDK tests use stubbed HTTP. They do not run the hosted Auth server, mail delivery,
PostgREST schema cache or Vercel. Historical Phase 2/3 suites intentionally test
their original migration boundaries. Full-chain tests cover later changes.
No failures were observed in the executed automated suites. Pending integration
and failed deployment-readiness checks are listed explicitly below.

The SQL test dependency is isolated/ignored, not part of `npm ci`. On a fresh
checkout run the pinned tooling installation in `supabase/README.md` before
tests. Lockfiles pin the app's resolved packages; `@supabase/supabase-js` still
has a range in package.json, so use `npm ci` for the reviewed dependency set.

## Hosted findings and unresolved risks

Read-only Supabase MCP catalog/advisor inspection targeted the project selected
by the configured URL (`jrlithrdswjallpolwep`). No account rows were read.

1. **Deployment blocker — schema/history drift.** `list_migrations` returned an
   empty list although Phase 2/3-style tables/functions exist. Catalog confirms
   no Auth user provisioning trigger, no `clinic_name`, and only the old
   five-argument `create_child`. New signup could leave a missing profile; child
   service selects/creates refer to nonexistent fields/signatures. Do not deploy
   the connected frontend or blindly replay Phase 2 over existing tables.
2. **Advisor warning — overly broad definer-function ACL.** Hosted
   `public.rls_auto_enable()` grants EXECUTE to PUBLIC, anon, authenticated and
   service_role. The advisor reports both anonymous and authenticated access.
   Its inspected return type is `event_trigger` and body handles DDL events,
   with fixed `search_path=pg_catalog`; an ordinary exploitable RPC has **not**
   been demonstrated. Treat this as an unnecessary privilege/maintenance risk,
   not proof that child RLS can be bypassed. It is outside the committed Member 3
   migrations. Have the database owner preserve the event trigger while reviewing
   and revoking unneeded client execution, then rerun security advisors.
3. **Unverified configuration:** SQL `pgrst.db_schemas` returned null, which
   cannot establish actual Data API schema exposure. Confirm `private` is not
   exposed in Dashboard settings. Hosted Auth email/SMTP/redirect/password policy
   settings and Vercel environment/routing were not available in this audit.
4. **Frontend integration incomplete:** placeholders and demo IDs remain. The
   guarded dashboard is not a working login journey; no manual UI acceptance
   results are recorded. New selection adapter is intentionally opt-in.
5. **Retention/deletion intentionally unresolved:** auth users referenced as
   creators/caregivers are protected by RESTRICT; child deletion is not a client
   feature. A future retention or owner-transfer workflow needs separate design.

No credential leak, cross-family RLS bypass, or caregiver escalation was found
in the reviewed Member 3 code/local tests. That statement does not close the
hosted configuration and end-to-end verification gaps above.

## Migration risks

- Migrations are transactional, versioned and designed to run once; they are
  not idempotent scripts. Use migration history, never repeated manual replay.
- Phase 4 backfills missing profiles without overwriting existing names, then
  removes client INSERT. Apply it before enabling signup. A profile failure
  deliberately fails the Auth transaction; monitor signup failures after rollout.
- Phase 5 validates existing child names, clinic names and ISO DOB bounds.
  Violating existing rows stop the transaction; review counts before deploying,
  never silently rewrite medical data. It replaces the old RPC signature and
  adds a defaulted clinic argument, so reconcile dependent functions/permissions
  and refresh PostgREST metadata after deployment. Five-argument SQL calls remain
  supported through the trailing default, not an overloaded old function.
- Phase 3 revokes/regrants table privileges. Future Member 4 migrations must be
  later versions; do not rerun Phase 3 after extending child-column permissions.
- PGlite is newer than the hosted PostgreSQL 17 instance. Stage the migration
  chain on a disposable Supabase project before changing the existing project.

## Instructions for Member 4

Reference `public.children(id)` with a native UUID foreign key, index health-table
`child_id`, and explicitly decide retention/ON DELETE behavior. No child-delete
client API exists; do not add cascading medical-data loss by accident. UUIDs
come from connected services, never demo fixture strings.

Enable RLS immediately with narrow column grants. Reads require current-user
membership in `child_caregivers`; writes additionally require owner/editor.
UPDATE requires SELECT plus both USING and WITH CHECK; protect reassignment of
`child_id`, verification status and provenance with column grants/policies.
Viewer reads must not imply write permission. Never authorize from `created_by`
or user-editable metadata. Keep memberships self-scoped and acyclic; do not add
reverse policies that query health tables from child_caregivers. New views use
`security_invoker=true` or remain private. No browser service-role key.

Use later migrations, extend/regenerate DB types (the Phase 5 `ChildDatabase`
is a deliberately narrow hand-maintained API surface), and test owner/editor/
viewer/unlinked/anon access directly through SQL/API. Preserve name/date/weight
contracts and parent-reported vs professional verification provenance.

## Exact deployment steps (operator actions; not executed)

1. Finish/review the separate Member 1 integration patch from the Phase 6 guide.
   In a clean deployment checkout run `npm ci`, install the isolated test tooling
   from `supabase/README.md`, and rerun every command in the table above.
2. Take a trusted database backup and stage all four migrations on an empty
   disposable Supabase project. Confirm Auth-profile provisioning and child
   creation/RLS with fictional accounts. Do not point seed/test fixtures at the
   existing project.
3. Use a pinned Supabase CLI (the repo's tooling setup uses 2.122.0). Inspect
   `--help` before executing. If no config exists, initialize the **clean operator
   checkout** with `supabase init`, review the generated config separately, and
   authenticate using a scoped token supplied through a trusted secret facility.
   Do not put database passwords or tokens in command arguments or Git.
4. For the existing project, first compare the entire hosted Phase 2/3 schema,
   function definitions, constraints, indexes, triggers, policies and grants
   against the committed migrations. The catalog audit here is not a complete
   baseline certification. If they differ, stop and prepare a reviewed
   reconciliation migration; never mark a mismatched schema as applied.
5. Only **after** that comparison confirms the baseline, the operator can use:

   ```powershell
   supabase link --project-ref jrlithrdswjallpolwep
   supabase migration list --linked
   # Conditional baseline repair; records history, does not execute DDL:
   supabase migration repair 20261024071052 --status applied --linked
   supabase migration repair 20261024073000 --status applied --linked
   supabase db push --linked --dry-run
   # Review: expected pending migrations are Phase 4 and Phase 5 only.
   supabase db push --linked
   supabase migration list --linked
   ```

   On a fresh project do not repair history; push all four in filename order.
   Never use `db reset --linked` on the existing project.
6. Verify `clinic_name`, the six-argument RPC, provisioning trigger, table RLS,
   policies and grants. Confirm the Data API exposes only intended schemas,
   excluding `private`. If PostgREST metadata is stale, a trusted operator can
   issue `notify pgrst, 'reload schema';`. Review the separate hosted helper ACL;
   a proposed narrowly scoped owner action is:

   ```sql
   revoke execute on function public.rls_auto_enable()
     from public, anon, authenticated, service_role;
   ```

   Preserve the event trigger and trusted owner execution. Re-run security
   advisors and document remaining findings; this SQL was not applied here.
7. In Supabase Authentication enable Email and Confirm email, configure SMTP,
   delivery limits and an at-least-eight-character password policy. Keep email
   links based on `{{ .ConfirmationURL }}` so PKCE verification returns `?code=`
   to the requested redirect. Set Site URL to the canonical deployed origin.
   Allow exact `/auth/callback` and `/reset-password` URLs on that origin,
   `http://localhost:5173`, and each approved preview origin. Use the actual
   development port. Same-browser/device/storage is required for PKCE; use the
   newest email. Cross-device confirmation is not implemented.
8. In Vercel import the reviewed repo/integration branch with Framework **Vite**,
   root repository directory, Install `npm ci`, Build `npm run build`, Output
   `dist`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the
   correct Development/Preview/Production environments (use an isolated staging
   project for previews). Never set a service-role/secret key or Gemini key in
   `VITE_`; this SPA does not require server credentials. Redeploy after env
   changes because Vite embeds these public values at build time.
9. Member 1 must coordinate a root `vercel.json` SPA deep-link rewrite. Proposed
   content, **not added by this phase**:

   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

   Test direct requests/refreshes to `/dashboard`, `/children/REAL-UUID`,
   `/auth/callback` and `/reset-password`; the browser must load the SPA rather
   than a hosting 404. Do not add competing callbacks or a second provider.
10. Deploy a preview, execute the Phase 6 live checklist with fictional inboxes
    and two independent parent accounts, and verify API-level isolation. Only
    promote after confirmation/reset, new/old-password login, logout, refresh,
    list/create/update and multiple-child selection work. Do not load real child
    health records before the BRD's privacy/security/clinical review gates.

## Changes from this task

Created `src/services/integration/child-selection.ts` and its eight-test suite,
`src/hooks/useChildProfiles.ts`, `scripts/audit-repository.mjs`, and these Phase
6/7 guides. Modified only `supabase/tests/phase4-auth.test.mjs` to apply migrations
chronologically. No SQL migration, package dependency, route/provider wiring,
Member 1/2 screen, mock dataset, deployment or remote user data changed.

Official configuration references:
[Supabase redirects](https://supabase.com/docs/guides/auth/redirect-urls),
[CLI history repair](https://supabase.com/docs/reference/cli/supabase-migration-repair),
[Vite SPA deep links](https://vercel.com/docs/frameworks/frontend/vite),
[Vercel environment variables](https://vercel.com/docs/environment-variables).

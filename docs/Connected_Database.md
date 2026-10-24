# Connected database

Project: `jrlithrdswjallpolwep`. The app uses Supabase Auth, PostgREST and Postgres Changes. It has no runtime demo account, seeded child, in-memory health adapter, or scripted nutrition reply.

## Tables and access

| Table | Purpose | Client access |
| --- | --- | --- |
| user_profiles | Profile provisioned with the auth account | Read/update own name |
| children | Child demographics and clinic | Linked caregivers read; owner/editor update; atomic create_child RPC |
| child_caregivers | Child access membership | Read own membership; no client role escalation |
| growth_measurements | Dated measurements with explicit units | Linked caregivers read; owner/editor add/correct |
| vaccination_records | Parent-reported vaccine/dose and administration date | Linked caregivers read; owner/editor add/correct date |
| clinic_appointments | Visit time, clinic, purpose, status | Linked caregivers read; owner/editor add/update/cancel/complete |
| nutrition_messages | Saved caregiver notes; future server messages | Linked caregivers read; owner/editor add notes only |
| todos | Personal tasks | Current user only |
| vaccination_schedule | Versioned, sourced reference milestones | Authenticated read of active rows; trusted administrator writes |
| growth_references | Sourced growth reference values | Authenticated read of active rows; trusted administrator writes |

All ten tables have RLS and are in `supabase_realtime`. Client grants are column-specific. Clients cannot forge creators, creation times, verified clinical provenance, memberships, or assistant messages. Health records have no client hard-delete operation. Appointment cancellation preserves the record. Foreign keys and membership/date indexes support authorized queries.

Health dates must be finite and between the child's birthday and today's Asia/Colombo date. Measurements must be positive and finite. A birth-date correction cannot move birth after an existing measurement or dose. Record-date validation locks the child row to coordinate concurrent demographic edits.

## Live refresh

`watchRecords` invalidates reads on database changes and after subscription reconnect. Focus, network reconnection and a 30-second visible-page fallback repair missed events. Components discard late responses on unmount/account changes, clear inaccessible results, and preserve forms during background refresh. Signing out removes the authenticated child boundary.

## Configuration and rollout

Use the project URL and a publishable key in the untracked `.env`; never put service-role or AI provider secrets in a `VITE_` variable. The local environment is configured for this project.

Apply migrations in filename order on a fresh Supabase database. The hosted project's previously manual core schema was recorded as the Phase 2 baseline; hosted migration versions now match the repository. Do not reapply the core CREATE TABLE migration to this hosted project.

Set Supabase Auth's Site URL to the actual app origin and allow its `/auth/callback` and `/reset-password` URLs. For local development include both localhost and 127.0.0.1 if used. Browser confirmation/recovery needs the same browser that started the PKCE flow. Email delivery and deployed redirect configuration are separate from database installation.

No personal or clinical data is seeded. Register, confirm the account email when required, then add the first child. Synthetic reference curves and unreviewed example vaccine schedules are not published. Reference tables remain empty pending reviewed source imports. Existing WHO source files are retained for the separately tested domain engine. Nutrition stores notes; AI generation, notification delivery, caregiver invitations and clinical verification are not enabled by this database change.

## Verification (24 October 2026)

- TypeScript and production build passed.
- Auth and child service/SQL tests passed, including atomic profile creation and account isolation.
- New SQL tests cover owner/editor/viewer/stranger access, invalid dates and measurements, provenance protection, personal tasks, and unavailable reference data.
- Hosted integration passed using disposable accounts: real password sign-in, profile provisioning, child RPC, health CRUD, cross-account denial, and a Realtime growth INSERT delivered between independent clients.
- Browser sign-in loaded stored records. A note submitted through the UI survived reload and was confirmed in SQL. Logout returned to sign-in.
- All disposable accounts and records were removed; the hosted user and record tables were confirmed empty afterward.
- Hosted security and performance advisors returned no findings.

Run `npm test`, `npm run test:auth`, `npm run test:children`, `npm run test:database`, and `npm run build`. SQL suites use the isolated PGlite installation described in `supabase/README.md`. `scripts/verify-hosted.mjs` is an explicit manual integration check requiring disposable credentials in ignored `node_modules/.hosted-test.json`; never run it with a real account. Provisioning/cleanup are deliberate administrative test steps, not application features.

Frontend edits are local workspace changes; database migrations were applied to the hosted project. Publishing the frontend is a separate deployment step.

## Main-branch integration

The parallel 20261024160000 migration is retained as a compatibility checkpoint;
the earlier connected-health migration remains the canonical schema. The main
branch health adapters use the same child service and curated schedule tables,
with no demonstration fallback. The optional nutrition Edge Function source is
preserved but is not deployed or enabled by this merge.

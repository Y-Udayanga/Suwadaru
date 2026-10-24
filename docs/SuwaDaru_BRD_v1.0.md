# SuwaDaru — Business Requirements Document (BRD)

**Project:** SuwaDaru: Digital Child Health Development Record, Vaccination, Growth & Nutrition Companion  
**Version:** 1.0 | **Date:** 24 October 2026 | **Status:** Baseline for student/hackathon prototype  
**Owner:** SuwaDaru four-member development team | **Language:** English  
**Audience:** Product owner, frontend developers, backend developers, evaluators, future clinical reviewers  
**Document authority:** This document is the shared source of truth. For implementation, follow the scope/status labels and requirement IDs. Changes require a decision-log entry and team agreement.

> **Clinical and regulatory boundary.** SuwaDaru is a proposed, unofficial digital *companion* to Sri Lanka's physical Child Health Development Record (CHDR). It is not a government service, an authorized clinical record, a medical device, a diagnostic system, a certified vaccine schedule, or a replacement for the CHDR, a Public Health Midwife (PHM), or a doctor. Use fictional data in prototype development and demos. National schedules and clinical content require current-source verification and professional review before live use.

## 1. Executive summary

SuwaDaru addresses common difficulties involved in preserving a child's paper CHDR, remembering appointments and vaccine dates, interpreting growth measurements, and understanding age-appropriate nutrition. The proposed solution is a mobile-first web application for caregivers of children from birth to five years in Sri Lanka. It integrates a child-specific timeline; a configurable, date-of-birth-based National Expanded Programme on Immunization (EPI) milestone viewer; a weight-for-age growth chart using verified WHO references when available; clinic appointment tracking and reminder *previews*; and a Gemini-assisted educational nutrition interface. A secure Supabase-backed version follows the mock-data frontend.

The main users are parents and guardians. Future users could include verified PHMs, clinic staff, and health administrators, but these roles and official integrations are excluded from the first release. The initial development sequencing is frontend-first with two frontend members, followed by backend development with the remaining two members and all-member integration.

**Project vision:** Every child, every milestone, a healthier tomorrow.  
**Value proposition:** One clear, culturally relevant place for caregivers to view a child's appointments, parent-reported vaccinations, growth history, and safe feeding education.  
**North-star outcome (future pilot):** Increased timely follow-up and caregiver understanding, measured rather than presumed.

## 2. Business context and problem definition

### 2.1 Context

Sri Lanka's CHDR is a familiar paper-based child-health record used in preventive care. Over years of repeated handling it can be misplaced or damaged. Caregivers may find it difficult to keep track of scheduled immunization milestones, clinic appointments, and growth trends across numerous pages. Digital support may reduce this friction, provided it respects current clinical practice and access constraints.

### 2.2 Problem statements

| ID | Problem | Consequence to address |
|---|---|---|
| P-01 | Paper records may be torn, damaged, or misplaced | Loss of convenient access to information |
| P-02 | Vaccine milestone dates are difficult to calculate | Risk of confusion and missed follow-up |
| P-03 | Measurements are scattered across paper charts | Trends are not easily understood by families |
| P-04 | Child feeding advice online may be generic or culturally mismatched | Parent uncertainty or inappropriate choices |
| P-05 | Appointment details are easy to forget | Missed or delayed follow-up |
| P-06 | Multiple caregivers may coordinate child care | Duplicated or inconsistent information |
| P-07 | Some families have limited connectivity | Poor access to always-online experiences |

### 2.3 Opportunity and differentiation

A digital CHDR copy alone is not the differentiator. SuwaDaru brings together understandable EPI *milestone planning*, structured parent-reported records, properly attributed growth trend visualizations, practical Sri Lankan feeding education, and a consistent future path to verified healthcare-worker workflows. The experience prioritizes clarity, trust, accessibility, and explainability over flashy AI output.

## 3. Objectives and success measures

| ID | Objective | Prototype verification | Later pilot KPI (proposed, not achieved) |
|---|---|---|---|
| O-01 | Make child health information easier to navigate | Parent can reach each core feature within 2–3 interactions | Caregiver task completion rate |
| O-02 | Improve visibility of EPI milestones | Age-based timeline renders with explicit source/version | On-time vaccination follow-up rate |
| O-03 | Enable growth trend viewing | Historical points render accurately; references properly labeled | Correct measurement documentation rate |
| O-04 | Provide culturally appropriate nutrition education | Safe mock chat and example food cards | Caregiver comprehension survey |
| O-05 | Organize clinic appointments | Users can create/update sample appointments | Attendance and reminder usefulness |
| O-06 | Prepare safe future expansion | Typed service layer, access control plan, audit provenance model | Authorized access/security metrics |

Success for the initial frontend is **a polished, interactive, responsive demonstration using fictional data**, not clinical outcome improvement or production deployment.

## 4. Scope, releases and exclusions

### 4.1 Release definitions

- **F0 — Frontend demo (current priority):** React UI and navigation, mock sign-in, fictional child profiles, vaccination milestone viewer, growth measurement visualization, nutrition chat with scripted educational examples, appointment CRUD in an in-memory mock adapter, settings, graceful empty/error states. No real account, external notifications, or backend required.
- **B1 — Connected MVP (subsequent phase):** Supabase Auth, PostgreSQL and RLS, persistent child/measurement/vaccination/appointment records, secure Edge Function for Gemini, access-control testing. Requires security review before any non-fictional health records.
- **F2 — Future expansion:** PHM-authorized workflows, verified clinic immunization entries, SMS and push delivery, CHDR capture/OCR, caregiver sharing, offline sync, Sinhala and Tamil localization, FHIR exchange after agreement, clinician-approved decision support.

### 4.2 F0 in scope

Landing page; registration/login/forgot-password *screens* with demo behavior; parent shell/navigation; child selector and profiles; add/edit child form; dashboard; vaccine timeline and status display; growth chart with sample measurements and, if available, properly sourced WHO references; nutrition chat UI; appointment calendar/list/form; persistent-within-session demo state if feasible; responsive design; accessibility; guardrails and source labels; mock services and contracts.

### 4.3 F0 out of scope

Real authentication, real health data, real SMS/push, payment, government integration, PHM login, prescription generation, medical diagnosis, vaccine catch-up prescription, direct client-side Gemini requests, OCR, production offline storage of sensitive information, electronic CHDR certification, HL7 FHIR production implementation, healthcare interoperability, analytics on identifiable children.

### 4.4 B1 in scope and non-goals

B1 adds real auth and persistence, securely accessed health records and constrained AI educational requests. It does not automatically create a clinically validated or government-approved healthcare system.

## 5. Stakeholders and personas

| Stakeholder | Current / future | Need / concern |
|---|---|---|
| Parent / guardian | F0 primary | Know what is coming up; understand and find records easily |
| Additional trusted caregiver | Future | Restricted, consented access to reminders and appointments |
| PHM | Future | Verified records, assigned-child follow-up, auditability |
| Clinician / clinic staff | Future | Reliable provenance and clinically validated interpretations |
| Administrator | Future | Control approved access and reviewed content |
| Hackathon judges / evaluators | F0 | Demonstrable end-to-end flow and believable impact |
| Product team (4 developers) | F0/B1 | Stable contracts, clean ownership, manageable merging |
| Medical / policy reviewer | Required before real-world release | Accuracy, safety, safeguarding, compliance |

**Persona A — Caregiver:** Uses a mid-range Android phone; prefers a simple interface, clear reminders and minimal medical jargon.  
**Persona B — Parent of two:** Needs to switch between child profiles without accidentally editing the wrong child.  
**Persona C — Future PHM:** Needs clinically valid sources and record provenance; not an available login role in F0.

## 6. Product principles

1. **Companion, not replacement:** Physical CHDR remains the authoritative family-held record for the prototype.
2. **Source transparency:** Distinguish national milestones, clinic appointment dates, and actual administered vaccinations.
3. **No fabricated clinical data:** Demonstration references are labeled and must not masquerade as WHO/EPI standards.
4. **Explain before alerting:** Informative indicators, never automated diagnosis.
5. **Privacy by default:** Fictional demo data, minimal PII, controlled future backend access.
6. **Mobile first:** Designs must work on narrow screens, slow networks and touch input.
7. **Simple modularity:** Feature pages use contracts and adapters, not backend-specific logic in components.
8. **Progressive enhancement:** English-first MVP, future Sinhala/Tamil support without hardcoded structural constraints.

## 7. Detailed business and functional requirements

**Priority legend:** Must = F0 required; Should = desirable if time; Later = deferred.  
**Status legend:** Demo = mock-only; Connected = B1; Future = F2. Each requirement ID is stable.

### 7.1 Entry, authentication UI and global shell

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-001 | Must/Demo | Landing page contains logo/name, value statement, key features, and working Get Started / Sign In routes. |
| FR-002 | Must/Demo | Register and login screens validate empty/invalid fields and simulate success with visibly labeled demo access. No real passwords or PII persisted. |
| FR-003 | Must/Demo | Logged-in demo shell includes responsive nav, active route indication, child context and sign-out action. |
| FR-004 | Must/Demo | All authenticated routes support a mock-guarded session and redirect to login if the user signs out. |
| FR-005 | Should/Demo | Forgot-password screen explains that recovery is a UI preview and does not claim to send an email. |
| FR-006 | Must/Demo | Shared pages provide loading, empty, validation, and non-crashing error states; keyboard focus is visible. |

### 7.2 Child profiles and dashboard

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-010 | Must/Demo | Create a fictional child with name, date of birth, sex for WHO chart selection, optional birth weight/clinic. Show validation and save confirmation. |
| FR-011 | Must/Demo | Parent can list, select, and switch between at least two demo children; all feature screens reflect selected child. |
| FR-012 | Must/Demo | Child profile displays data clearly and supports editing allowed demographic fields. |
| FR-013 | Must/Demo | Dashboard shows selected child, age, next EPI milestone, last recorded growth point, upcoming appointment and nutrition CTA. |
| FR-014 | Must/Demo | Empty child state offers Add Child action; no misleading zero-risk or fully immunized statements. |
| FR-015 | Should/Demo | Recent activity timeline shows attributed *sample* events and timestamps. |

### 7.3 Immunization schedule and records

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-020 | Must/Demo | For selected child, display a birthdate-derived, age-milestone timeline from versioned schedule configuration. |
| FR-021 | Must/Demo | Distinguish *scheduled milestone due date*, *actual vaccine administered date* and *clinic appointment* on separate fields/views. |
| FR-022 | Must/Demo | Display status: upcoming, due, overdue, parent-reported completed/unverified, verified only if explicitly sourced from a verified backend (not F0). |
| FR-023 | Must/Demo | Show vaccine name, milestone age, due-date display, context note, schedule source, version, and reviewed-status banner. |
| FR-024 | Should/Demo | Interactive record form allows sample parent-reported administered dates with editable/cancellable state; never treats the entry as PHM-confirmed. |
| FR-025 | Must/Demo | Show a reminder *preview* and never claim that SMS/push was sent. |
| FR-026 | Must/Demo | Incorrect future birthdates rejected; month-end and leap-day date logic tested; do not implement custom catch-up regimes. |
| FR-027 | Connected | Authoritative schedule configuration and real parent-reported records persist to DB with provenance. |

**Illustrative published EPI baseline for *development research only*** (official 2023 schedule PDF; verify latest effective schedules and circulars before use): birth/0–4 weeks BCG; 2 months pentavalent 1 + OPV1 + fIPV1; 4 months pentavalent 2 + OPV2 + fIPV2; 6 months pentavalent 3 + OPV3; 9 months MMR1; 12 months JE; 18 months DTP booster + OPV4; 3 years MMR2; 5 years DT booster + OPV5. The engine must support replacement/versioning, not embed these as timeless clinical truth. Source: https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf

### 7.4 Growth monitoring

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-030 | Must/Demo | Chart plots child measurement history for the chosen child, using dated weight in kg and meaningful age X-axis. |
| FR-031 | Must/Demo | When reference curves are shown, clearly identify actual WHO dataset, sex/age/indicator and source/version; otherwise mark synthetic curves prominently as demonstration only. |
| FR-032 | Must/Demo | Support visible +2SD, +1SD, median, -1SD, -2SD reference legends when data source is valid; do not derive unverified clinical categories. |
| FR-033 | Must/Demo | Measurement form includes date, weight in kg, optional length/height and head circumference; validates nonpositive numbers and impossible future dates. |
| FR-034 | Must/Demo | Measurement list can be added to and shows source: parent entered vs sample vs professional-verified (future). |
| FR-035 | Must/Demo | Clinical status defaults to 'not assessed' unless a validated WHO calculation is actually implemented. Show safety message if data/reference is missing. |
| FR-036 | Should/Demo | Growth graph supports tooltip, axis labels, accessible tabular alternative and separate child-series styling. |
| FR-037 | Connected | Later backend stores measurements and optional verified z-score metadata; validation is independent of Gemini. |

**Reference:** WHO Child Growth Standards, weight-for-age and other indicator tables; charts are sex- and age-specific. https://www.who.int/tools/child-growth-standards/standards/weight-for-age . A high/low color line without real standard values is only illustrative.

### 7.5 AI nutrition educational experience

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-040 | Must/Demo | Chat screen shows child age context, example questions, input, sent/received messages, typing/loading, and retry/error state. |
| FR-041 | Must/Demo | Mock nutrition education covers age-appropriate Sri Lankan food examples and clear disclaimer; no diagnosis, treatment or prescription. |
| FR-042 | Must/Demo | Clearly label all simulated AI replies as demo responses; never claim a request reached Gemini. |
| FR-043 | Must/Demo | Unsafe question categories (emergency symptoms, medications, severe feeding concern) display a safe professional-care referral. |
| FR-044 | Should/Demo | A static local-food card gallery and example meal planner may be included if core flow is complete. |
| FR-045 | Connected | Gemini requests go through an authenticated server-side function with minimal child context and vetted guardrails; no frontend API key. |

**Safety content:** Breastfeeding and complementary feeding recommendations must be aligned with current WHO and local professional guidance; food texture, hygiene, allergy, bones/choking risk, and age matter. For F0, the responses are scripted educational examples rather than medical advice.

### 7.6 Appointments and reminders

| ID | Priority/status | Requirement and measurable acceptance criteria |
|---|---|---|
| FR-050 | Must/Demo | Create, edit, cancel, complete and list fictional clinic appointments for a selected child. |
| FR-051 | Must/Demo | Appointment model stores specific scheduled date/time and clinic name separately from an EPI due date. |
| FR-052 | Must/Demo | Upcoming and past views, no-appointment state, reminder preview with explicit 'not sent' label. |
| FR-053 | Connected | Persist visits; real reminders require consent, scheduling provider, delivery monitoring and opt-out design. |

### 7.7 Future modules (not F0 work)

| ID | Phase | Requirement |
|---|---|---|
| FR-060 | F2 | Approved PHM portal with verified identity, assigned-child access, and audit logging. |
| FR-061 | F2 | CHDR scan/OCR with image retention policy and human verification. |
| FR-062 | F2 | Limited consented family care-circle permissions. |
| FR-063 | F2 | Carefully scoped offline caching and safe synchronization. |
| FR-064 | F2 | Sinhala and Tamil translations with clinical-content review. |
| FR-065 | F2 | Authorized FHIR resource exchange with compatible implementation guides and organizational agreements. |
| FR-066 | F2 | Development milestone checklists based on vetted sources; no automated diagnosis. |
| FR-067 | F2 | Aggregated public-health analytics with privacy safeguards. |

## 8. Screen inventory, navigation and ownership

| Route | Screen | Owner F0 | Critical UI states |
|---|---|---|---|
| `/` | Landing | Frontend A | default, mobile |
| `/login` | Demo login | Frontend A | validation, loading, error |
| `/register` | Demo registration | Frontend A | validation, success |
| `/forgot-password` | Recovery preview | Frontend A | information, no-send |
| `/dashboard` | Parent home | Frontend A | populated, no-child, selected-child |
| `/children/new` | Add child | Frontend A | invalid, save, cancel |
| `/children/:childId` | Child overview/edit | Frontend A | loading, missing child, edit |
| `/children/:childId/vaccinations` | Vaccine schedule | Frontend B | upcoming, overdue, entry, no-data |
| `/children/:childId/growth` | Growth tracker | Frontend B | chart, add, empty, invalid |
| `/children/:childId/nutrition` | Nutrition chat | Frontend B | first-use, conversation, refused, retry |
| `/children/:childId/appointments` | Clinic visits | Frontend B | list, add/edit, empty, completed |
| `*` | Not found | Frontend A | helpful navigation |

**Navigation hierarchy:** Global app shell → selected child → overview or four child-specific health pages. Explicit child IDs in URLs prevent ambiguous context; routes for nonexistent child IDs must show a safe 404-like state, never data for another child.

## 9. Detailed user journeys

### J-01: First-time parent

Landing → Create Demo Account → Demo Dashboard (empty) → Add Child → Select Child → Dashboard with computed age and health cards → Open Vaccine Timeline → Open Growth Tracker → Open Nutrition → Add Clinic Appointment. Success: parent can complete this without needing a backend or refreshing into errors.

### J-02: Parent with two children

Login → dashboard child dropdown → switch Child A to Child B → verify name, age, upcoming milestone, measurements and appointments all update → edit only selected child's records. Success: no stale child A content on child B pages.

### J-03: Understand growth without false diagnosis

Open Growth → choose child → inspect weight records → add a sample weight → chart refreshes → reference source clearly shown or 'demonstration only' label → educational note directs concerns to healthcare professional. Success: app does not confidently diagnose from toy data.

### J-04: Missed milestone

Open Vaccination → overdue milestone is visually separated from completed and scheduled → show date and suggestion to contact clinic/PHM → parent reports administered date as unverified or opens clinic appointment. Success: no AI-made catch-up timetable.

### J-05: Nutrition question

Open Nutrition → choose suggested prompt → see scripted reply about local foods, age context and disclaimer → type an emergency-like question → receive care-seeking response. Success: clearly marked simulation, no fabricated medical advice.

## 10. Interface and data contract — frontend baseline

All F0 components consume exported mock asynchronous *service functions* rather than importing mock arrays into JSX. This keeps B1 integration possible without screen rewrites. Dates use ISO 8601 date-only (`YYYY-MM-DD`) for birthdays/measurement dates; appointments use ISO 8601 date-time with explicit zone or a separately documented local-time convention. Numeric weight uses kg, height/head uses cm; do not store formatted strings as quantities.

```ts
export type ChildSex = 'male' | 'female'; // for WHO reference selection
export type RecordSource = 'demo' | 'parent_reported' | 'health_worker_verified';
export type VaccinationStatus = 'upcoming' | 'due' | 'overdue' | 'completed_unverified' | 'completed_verified';

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: ChildSex;
  birthWeightKg?: number;
  clinicName?: string;
}
export interface VaccinationMilestone {
  id: string;
  vaccineCode: string;
  vaccineName: string;
  ageMonths: number | null;
  birthWindow?: boolean;
  dueDate: string;
  scheduleVersion: string;
  sourceUrl: string;
}
export interface VaccinationRecord {
  id: string;
  childId: string;
  vaccineCode: string;
  administeredOn: string | null;
  source: RecordSource;
  verifiedBy?: string; // future use only
}
export interface GrowthMeasurement {
  id: string;
  childId: string;
  measuredOn: string;
  weightKg?: number;
  lengthHeightCm?: number;
  headCircumferenceCm?: number;
  source: RecordSource;
}
export interface ClinicAppointment {
  id: string;
  childId: string;
  scheduledAt: string;
  clinicName: string;
  purpose?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
  isDemo: boolean;
}
```

**Expected service boundaries:** `authService` (demoSignIn, demoSignOut, getSession), `childService` (list/get/create/update), `vaccinationService` (getSchedule/getRecords/addReportedDose), `growthService` (list/addMeasurement/getReferenceSeries), `appointmentService` (list/create/update/cancel), `nutritionService` (getDemoResponse). All functions should be Promise-based and throw typed/app-friendly errors. Components should not know whether an adapter is mock or Supabase.

**Ownership of shared artifacts:** Frontend A creates the final `src/types/*`, `src/services/contracts/*`, router and shell. Frontend B may create temporary local feature types until the contract lands on main; then adapt without changing authoritative contracts unilaterally. Both follow feature-module isolation.

## 11. Information architecture and component inventory

**Global components (A):** Logo, AppShell, Header, Sidebar, MobileNav, ChildSwitcher, PageHeader, StatCard, EmptyState, ErrorState, LoadingSkeleton, ConfirmDialog, form elements via shadcn/ui, NotFoundPage.  
**Dashboard/child (A):** ChildRegistrationForm, ChildProfileHeader, ChildCard, DashboardSummary, QuickActionCard, RecentActivity.  
**Health features (B):** VaccineTimeline, VaccineMilestoneCard, ReportVaccinationDialog, ReminderPreview, GrowthChart, GrowthLegend, MeasurementForm, MeasurementTable, NutritionChat, PromptChips, DemoDisclaimer, FoodEducationCard, AppointmentsList, AppointmentForm, AppointmentDetails.

Reusable component styling belongs to global design tokens. Feature components must not modify AppShell or route configuration without coordinated PR approval.

## 12. Design system, responsiveness and accessibility

- Brand: **SuwaDaru**. Tagline: **Every Child. Every Milestone. A Healthier Tomorrow.**
- Primary teal: `#0F766E`; mint `#E8F7F3`; near-white `#F8FAFC`; gold accent `#F4C95D`; coral for carefully described warnings `#E27D72`.
- Typography: Inter; use a fallback stack; future Sinhala/Tamil-compatible font planning. English-only displayed content for F0.
- Design character: approachable pediatric healthcare, credible not cartoonish, calm charts, modest rounded cards, restrained shadows, high contrast.
- Responsive targets: 360 px mobile, 768 px tablet, 1280 px desktop, and intermediate layouts; no horizontal overflow on mobile.
- Usability: visible selected child, clear page titles, descriptive buttons, inline form errors, confirmation for destructive actions, back navigation.
- Accessibility: semantic headings and labels, keyboard operability, visible focus, text alternatives, accessible tables for charts, minimum usable touch target around 44 px, no status conveyed by color alone, respect reduced-motion settings.
- Illustrations/icons: Lucide; no patient photographs required. Do not use real infant/parent imagery without permissions.
- Charts: separate reference lines and child measurements using distinct style plus legends and descriptive text; tooltips must not be the only source of exact values.

## 13. Nonfunctional requirements

| ID | Category | Requirement / acceptance |
|---|---|---|
| NFR-01 | Performance | On a modest phone, core screens feel responsive; avoid large libraries and uncontrolled re-renders. |
| NFR-02 | Responsiveness | 360–1440 px viewport support; no horizontal scroll for core flows. |
| NFR-03 | Reliability | Pages handle missing child, invalid route, no data and simulated service errors without crashing. |
| NFR-04 | Maintainability | Strict TypeScript, feature-scoped modules, reusable services, no monolithic `App.tsx`. |
| NFR-05 | Accessibility | Keyboard and screen-reader basics; chart tabular fallback; contrast checks. |
| NFR-06 | Security | F0 uses fictional records; no storing real passwords or sensitive profiles; B1 requires RLS and secure secrets. |
| NFR-07 | Traceability | Schedule source/version and source-of-entry are visible where applicable. |
| NFR-08 | Quality | `npm run build`, TypeScript checks and meaningful test scenarios pass before merge. |
| NFR-09 | Configurability | EPI schedule rules and educational content externalized into data/config files. |
| NFR-10 | Environment | `.env.example` committed; secrets excluded; no Gemini keys in `VITE_` variables. |

## 14. Business rules and safety constraints

**BR-01 Date computation:** Birthdate may not be future. Birthdays are date-only values. Age milestones use calendar-month arithmetic with an explicitly defined end-of-month rule, not a constant 30-day multiplier.  
**BR-02 Vaccine provenance:** A scheduled vaccine is not a received vaccine. User-entered completion is unverified. Only future approved health-worker flow may mark verified.  
**BR-03 Missed vaccination:** Show a contact-clinic/PHM suggestion, not a generated catch-up plan.  
**BR-04 Growth references:** Use official WHO sex/indicator/age-specific tables with attribution and version or label all example values synthetic and withhold clinical scoring.  
**BR-05 Growth interpretation:** Do not equate one isolated value to a diagnosis. Measurement quality, multiple indicators and clinical context matter.  
**BR-06 AI boundaries:** AI provides supervised educational nutrition content, not diagnosis, medication dosing, treatment, emergencies triage as definitive judgement, or child-specific therapeutic diet prescriptions.  
**BR-07 Demo honesty:** No 'SMS sent', 'email sent', 'Gemini replied', 'officially verified', or 'medical risk detected' unless genuinely true and evidence-backed.  
**BR-08 Child context:** Every feature request is scoped by `childId`, and missing/invalid child IDs produce a safe state.  
**BR-09 Locale:** English labels for F0; support later translations by keeping strings organized.  
**BR-10 Data minimization:** Demo uses generated fictional names, no actual medical data, addresses, ID numbers or identifying contact details.

## 15. Architecture overview and evolution

**Frontend F0:** React + TypeScript + Vite, React Router, Tailwind, shadcn/ui, Lucide, Recharts; typed Promise-based mock adapters; local in-memory or explicit sample-data state. Avoid implying that browser state is durable medical storage.

**Backend B1:** Supabase Auth and PostgreSQL RLS; separate tables `user_profiles`, `children`, `child_caregivers`, `vaccination_schedule_versions`, `vaccination_records`, `growth_measurements`, `clinic_appointments`, `audit_logs`; an authenticated Supabase Edge Function for Gemini. The backend team chooses safe migration/ownership policies, and database authorization is mandatory. Real human data is prohibited until an appropriate privacy/security review and lawful governance are in place.

**HL7 FHIR:** Not required in F0/B1. Maintain consistent identifiers, coded vaccine names, explicit units, dates and record provenance for later mapping. Do not claim interoperability exists.

**Future low-connectivity:** PWA support is a roadmap item, not permission to cache sensitive health information in uncontrolled local storage.

## 16. Git branching, ownership and delivery process

**Repository:** `suwa-daru` (GitHub; private at the start).  
**Stable branch:** `main`, protected by PR review.  
**Frontend A branch:** `feature/frontend-core` — app shell, auth UI, child profiles, dashboard, router, shared contracts.  
**Frontend B branch:** `feature/frontend-health` — vaccination, growth, nutrition and clinic appointments feature modules.  
**Backend A branch:** `feature/backend-auth` (later).  
**Backend B branch:** `feature/backend-health-ai` (later).

### Initial scaffold and branch contract

1. Frontend A creates Vite React TS app, installs approved dependencies, configures lint/type/build scripts, adds project paths, shared tokens, docs and placeholder modules; pushes initial scaffold to `main` after teammate review.
2. Both frontend members branch from the same scaffold commit. A owns router/layout; B owns health feature subtrees. Both can work simultaneously.
3. Commit in logical increments; use Conventional Commit prefixes: `chore`, `feat`, `fix`, `test`, `docs` with scope.
4. Each phase opens a PR or pushes small commits to its feature branch. Prefer **one final PR per feature branch** for the short hackathon; require review before merge.
5. Merge A into `main` first to establish routes, then B pulls main into their branch, integrates exports, runs build/tests and opens PR.
6. No direct pushes to `main`; no shared force-pushing; no secrets in commits. Use `.env.example` only.

### Definition of ready

A coding phase is ready if BRD requirement IDs, files owned, data interface, mocked scenarios, and acceptance checks are clear.

### Definition of done

- All phase-specific acceptance criteria demonstrated.
- Correct file ownership; `npm run build` succeeds and lint/tests succeed when configured.
- Loading, empty, invalid-input and failure states considered.
- No fabricated clinical standards or claims, no real PII, no exposed secrets.
- PR includes screenshot or screen recording on 360 px and desktop plus short test note.
- Commit messages describe actual implementation.

## 17. Testing plan and scenarios

| ID | Scenario | Expected result |
|---|---|---|
| T-01 | Register and sign into demo | Mock session enters dashboard; no real authentication assertion |
| T-02 | Empty dashboard | Helpful add-child CTA; no broken widgets |
| T-03 | Add child with tomorrow DOB | Validation blocks submit |
| T-04 | Add two fictional children | Selector updates dashboard and feature pages |
| T-05 | Open bogus child ID route | Not-found/unauthorized-style safe empty state |
| T-06 | Generate vaccine schedule for end-of-month DOB | Correct tested calendar-month behavior |
| T-07 | Record vaccine as parent reported | Completed-unverified label; no verified badge |
| T-08 | No growth measurements | Empty graph message and add-measurement CTA |
| T-09 | Add zero/negative weight | Inline validation prevents save |
| T-10 | Use synthetic reference lines | Clearly prominent demo-only banner; no clinical diagnosis |
| T-11 | Nutrition chatbot first-use and emergency question | Safe example replies / professional care guidance, demo label |
| T-12 | Add and complete appointment | List updates and reminder remains 'preview only' |
| T-13 | Refresh after demo sign-out | Protected route redirects appropriately |
| T-14 | Mobile width 360 px | No clipping or horizontal layout overflow |
| T-15 | Keyboard-only navigation | Form controls, tabs, dialogs and menus usable |
| T-16 | Service mock rejection | Recoverable error and retry/return route |

**Later backend tests:** RLS cross-user isolation; explicit caregiver authorization; server-side Gemini key; failure modes; secure audit trail; migrations applied on clean database; data deletion/retention requirements.

## 18. Risks, assumptions and dependencies

| ID | Risk / dependency | Mitigation |
|---|---|---|
| R-01 | Vaccine schedule changes | Version and source it; clinical verification gate before real use |
| R-02 | Unverified WHO data used accidentally | Pin official datasets or visibly label synthetic demo curves |
| R-03 | AI gives unsafe child feeding advice | Script safe mock responses in F0; later curated sources and safeguards |
| R-04 | Two frontend branches edit shared routes | Explicit ownership, page exports, A integrates routes |
| R-05 | Team integrates too late | Shared mock contracts, small PRs and early smoke test |
| R-06 | Demo uses actual health records | Use generated child personas and synthetic measurement histories |
| R-07 | Timebox overrun | Prioritize user journey over future features and backend connections |
| R-08 | Data privacy/security gaps | No production launch with real records until review and security testing |
| R-09 | SMS/push unavailable | Accurate reminder preview rather than fake delivery |
| R-10 | Third-party API limits | Nutrition scripted mock service; later backend timeout/fallback |

**Assumptions:** Team members can use GitHub, Node LTS and compatible npm; English UI accepted for demo; there is no official MoH data-access permission; dates and health content are subject to expert validation; no payments or official EMR access.

## 19. Delivery milestones and go/no-go gates

| Milestone | Owner | Exit gate |
|---|---|---|
| M0 — Scaffold + contract | Frontend A + B review | App starts; baseline types, router ownership, UI tokens agreed |
| M1 — Core shell and flows | Frontend A | Login UI, child registration, dashboard work with mocks |
| M2 — Health feature UIs | Frontend B | Vaccines, growth, nutrition, appointments all interactive using mocks |
| M3 — Frontend integration | A + B | Every route, shared child context, mock services, mobile layout, build pass |
| M4 — Connected MVP | Backend A + B | Auth, DB/RLS, clinical source handling, AI server adapter testable |
| M5 — Prototype demo | All | Fictional end-to-end storyline, accurate claims, backup screenshots/video |

**Demo must-have flow:** sign in to demo → add fictional child → view date-derived vaccine milestones → add growth measurement and view chart → ask scripted nutrition question → add clinic appointment. If any module is incomplete, show a transparent placeholder rather than fabricate working functionality.

## 20. Key decisions and open questions

### Confirmed decisions

- D-01 React + TypeScript + Vite, Tailwind, shadcn/ui, React Router and Recharts.
- D-02 Supabase proposed for backend, but not in F0 frontend.
- D-03 Two frontend members work in parallel on separate branches after shared scaffold.
- D-04 Frontend A owns app shell, navigation and shared type contracts; Frontend B owns four healthcare UI modules.
- D-05 English-only MVP, mobile first; no HL7 FHIR now.
- D-06 Fictional sample data only until security/privacy and clinical review.
- D-07 Gemini is B1 backend; F0 uses an explicitly scripted UI simulator.

### Open decisions requiring explicit team confirmation

- Q-01 Should demo child edits survive refresh? Recommended F0: in-memory state with preloaded sample profiles; optional non-sensitive sample-only localStorage if clearly resettable. Never persist real child health data in demo storage.
- Q-02 Which EPI circular is effective at deployment date? Product owner/medical reviewer must verify.
- Q-03 Will the team use official WHO numerical tables in F0 or display synthetic examples? Prefer official if safely implemented, otherwise synthetic with explicit disclaimers.
- Q-04 Should the hackathon include real sign-up? Recommendation: only after F0 UI works and B1 RLS is ready.
- Q-05 Who is responsible for reviewing privacy notices and clinical copy before real pilot? Assign qualified reviewers.

## 21. Official references and verification register

1. Sri Lanka Epidemiology Unit, published National Immunization Schedule (baseline; check later circulars before release): https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
2. WHO Child Growth Standards — Weight-for-age, official reference charts and tables: https://www.who.int/tools/child-growth-standards/standards/weight-for-age
3. WHO Child Growth Standards — overall indicators and method: https://www.who.int/tools/child-growth-standards
4. Sri Lanka Data Protection Authority — applicable Acts, regulations and official guidance (including amendments; verify effective dates): https://www.dpa.gov.lk/guidelines.php
5. Personal Data Protection (Amendment) Act No. 22 of 2025: https://www.dpa.gov.lk/acts/22-2025_E_251104_201549.pdf

These are reference starting points, not proof that SuwaDaru is clinically validated or officially endorsed.

## Appendix A. Demo fictional user story and test fixtures

**Fictional child A:** Nethmi, female, DOB 2025-04-15; example measurements at several historical dates; one illustrative upcoming appointment.  
**Fictional child B:** Kavindu, male, DOB 2026-02-28; separate measurements and vaccination status.  
**Fictional caregiver:** Demo Parent.  
All example records and images must be synthetic and clearly labeled. Avoid an implied clinical status for sample measurements.

## Appendix B. Frontend repository layout

```text
suwa-daru/
├── docs/
│   ├── SuwaDaru_BRD_v1.0.md
│   └── Frontend_Phased_Prompts.md
├── src/
│   ├── app/                    # App, router, providers (A)
│   ├── components/
│   │   ├── ui/                 # shadcn + reusable elements (A)
│   │   └── layout/             # shell, navigation (A)
│   ├── features/
│   │   ├── auth/               # A
│   │   ├── children/           # A
│   │   ├── dashboard/          # A
│   │   ├── vaccinations/       # B
│   │   ├── growth/             # B
│   │   ├── nutrition/          # B
│   │   └── appointments/       # B
│   ├── data/mock/              # sample data, service adapters (owned by module)
│   ├── services/contracts/     # service interfaces (A; B reviews)
│   ├── types/                  # shared types (A; B reviews)
│   ├── hooks/
│   ├── lib/
│   └── styles/
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Appendix C. Change control template

Every proposed BRD update records: change ID, date, requesting member, affected requirement IDs, reason, impact on scope/UI/contracts, test implications, reviewer, approved or rejected outcome. For an important clinical change, obtain an appropriate expert reviewer before changing displayed guidance.

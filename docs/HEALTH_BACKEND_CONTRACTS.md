# SuwaDaru Health Backend Contracts

**Phase:** 1 — contracts and verified sources  
**Owner:** Member 4 (`feature/backend-health-ai`)  
**Date:** 24 October 2026  
**Base:** `origin/main` at `bc58846`  
**Status:** Proposed. Shared TypeScript types, UI components, and Member 3 authentication files are unchanged.  
**Authority:** `docs/SuwaDaru_BRD_v1.0.md`. Requirement IDs below refer to that document.

SuwaDaru is an unofficial companion to the paper Child Health Development Record. These contracts do not approve a vaccine schedule, a growth standard, or a clinical decision. They describe how the health backend must exchange data with the existing frontend.

## 1. What already exists

The frontend already exports the types and service interfaces this backend must satisfy.

| Module | Shared types | Service interface | Current adapter |
|---|---|---|---|
| Vaccination schedule and records | `src/types/vaccination.ts` | `VaccinationService` | `src/features/vaccinations/vaccinationService.ts` |
| Growth measurements and reference curves | `src/types/growth.ts` | `GrowthService` | `src/features/growth/growthService.ts` |
| Clinic appointments | `src/types/appointment.ts` | `AppointmentService` | `src/features/appointments/appointmentService.ts` |
| Nutrition demo chat | `src/types/nutrition.ts` | `NutritionService` | `src/features/nutrition/nutritionService.ts` |

Units, dates, sex, and provenance live in `src/types/common.ts`:

- `IsoDate` — `YYYY-MM-DD`, no time and no timezone. Birthdays, milestone due dates, administered dates, and measurement dates use this.
- `IsoDateTime` — ISO 8601 instant with an explicit offset, for example `2026-11-02T09:30:00+05:30`. Clinic appointments use this. A wall time without an offset is invalid. A `Z` suffix is UTC and is not the Colombo local convention the type documents.
- `ChildSex` — `"male"` or `"female"`, used only to select a sex-specific growth reference.
- `RecordSource` — `"demo"` | `"parent_reported"` | `"health_worker_verified"`.
- `Kilograms` and `Centimetres` — numbers. Formatted strings such as `"7.2 kg"` are display text, not stored quantities.

`Child` in `src/types/child.ts` supplies `dateOfBirth`, `sex`, and optional `birthWeightKg`. Schedule calculation reads the date of birth. It does not read vaccine rows.

## 2. Calculation and persistence stay separate

Two kinds of module implement these contracts. Neither kind imports React.

**Pure calculation** accepts plain values and returns a `HealthResult`. It does not open a database connection, read the current user, or call Gemini. The same functions run in unit tests and, later, inside an Edge Function or a repository.

**Persistence** loads and saves rows for one child. A repository receives an already authenticated actor. It does not trust a caregiver id sent in the JSON body. It maps database rows to the existing camelCase types.

The service the UI calls composes both. Pages keep calling `VaccinationService`, `GrowthService`, `AppointmentService`, and `NutritionService`. They do not choose a mock or a Supabase client themselves.

Proposed locations, not created in this phase:

```text
src/domain/health/vaccination/     pure schedule dates and status
src/domain/health/growth/          measurement checks and assessment
src/domain/health/appointments/    instant and status checks
src/domain/health/nutrition/       local safety classification
src/services/adapters/             later Supabase implementations of the existing service interfaces
supabase/migrations/               later health tables, after Member 3's schema is on the branch
supabase/functions/nutrition-education/   later Gemini caller
```

`src/features/vaccinations/scheduleConfig.ts` remains the frontend research baseline. This phase does not move it and does not add antigens.

## 3. Error convention

Expected failures use one result shape inside calculation and repository code:

```ts
export interface HealthRuleViolation {
  /** Stable code. `message` may change; callers branch on `code`. */
  code:
    | "validation"
    | "not_found"
    | "unauthenticated"
    | "forbidden"
    | "unavailable"
  message: string
}

export type HealthResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HealthRuleViolation }
```

Rules:

- Validation, missing records, anonymous callers, viewers who may read but not write, and dependency failures return `{ ok: false }`. They do not throw.
- A thrown exception means a programming fault. Tests fail on an unexpected throw.
- At the service boundary the adapter converts `HealthRuleViolation` into the existing `AppError` (`src/services/contracts/errors.ts`) so current pages, which already use `err instanceof AppError`, keep working.
- Mapping that does not need a shared-type edit: `validation` → `AppError("validation")`, `not_found` → `AppError("not_found")`, `unauthenticated` → `AppError("unauthenticated")`, `unavailable` → `AppError("unavailable")`.
- `forbidden` has no `AppErrorCode` yet. Section 13 asks the frontend to add it before a connected adapter denies a viewer write. Until that code exists, a connected adapter must not pretend a viewer is unauthenticated, and it must not report a successful save.

Child scope:

- A list for a child the caller can access, with no rows, is `{ ok: true, value: [] }`.
- A child the caller cannot access is `not_found`. The message does not say whether the id exists.
- The F0 mocks are looser: `getRecords`, `growth.list`, and `appointment.list` return `[]` for an unknown id. That mock behavior stays until the pages are switched. Tests of those mocks keep expecting `[]`.

Calendar “today” for health writes is the current date in `Asia/Colombo`, the same zone Member 3 uses for date of birth. The F0 mocks use `new Date().toISOString().slice(0, 10)`, which is the UTC date. Near midnight those dates differ. Connected adapters use Colombo. This phase does not change the mocks.

## 4. Clinical reference metadata

Every schedule version and every growth reference carries this metadata. It is stored with the version, not inferred from a vaccine name.

```ts
export type ClinicalDomain = "lk_epi_schedule" | "who_child_growth"

export interface ClinicalReference {
  domain: ClinicalDomain
  /** Human-readable publisher and document title. */
  sourceLabel: string
  sourceUrl: string
  /** Version chosen by SuwaDaru for this pin, not an implied government version. */
  sourceVersion: string
  /** ISO date the file or page was retrieved. */
  retrievedOn: IsoDate
  reviewStatus: "unreviewed_research_baseline" | "professionally_reviewed"
  /**
   * SuwaDaru is not a Ministry of Health or WHO product.
   * This literal cannot be set to an approved state without a type change.
   */
  endorsement: "none"
}
```

`professionally_reviewed` means a named reviewer accepted that the pinned file matches the cited official publication. It does not mean SuwaDaru is officially approved. No code path in this phase may set `reviewStatus` to `professionally_reviewed`.

## 5. Vaccination schedule

A schedule milestone is a calculated due date. It is not evidence that a vaccine was given.

### Reused types

`VaccinationMilestone` is the value returned to the UI:

- `vaccineCode`, `vaccineName`
- `ageMonths: number | null` — completed calendar months; `null` when `birthWindow` is true
- `birthWindow?: boolean`
- `dueDate: IsoDate`
- `scheduleVersion`, `sourceUrl`

`VaccinationStatus` stays a derived label: `upcoming`, `due`, `overdue`, `completed_unverified`, `completed_verified`. It is not a database column. Storing it would let a row disagree with the child’s birthday and the reported doses.

### Pure function

```ts
export interface ScheduleDoseDefinition {
  vaccineCode: string
  vaccineName: string
  /** Null only when birthWindow is true. */
  ageMonths: number | null
  birthWindow: boolean
}

export interface ScheduleDefinitionSet {
  reference: ClinicalReference
  doses: readonly ScheduleDoseDefinition[]
}

export interface BuildScheduleInput {
  childId: string
  dateOfBirth: IsoDate
  schedule: ScheduleDefinitionSet
}

export function buildVaccinationSchedule(
  input: BuildScheduleInput,
): HealthResult<VaccinationMilestone[]>
```

Date rule, matching `addCalendarMonths` in `src/features/vaccinations/calendarDate.ts` and BR-01:

- Reject a date of birth that is not a real `YYYY-MM-DD` date, or that is after today in `Asia/Colombo`.
- A birth-window dose uses the date of birth as `dueDate`. The current frontend does this. The label “0–4 weeks” is display context on the schedule definition. This contract does not invent a second window-end date.
- Any other dose uses `ageMonths` completed calendar months added to the date of birth. If that day does not exist in the target month, clamp to the last day of that month. Do not multiply by 30.
- Copy `scheduleVersion` and `sourceUrl` from `schedule.reference` onto every milestone.
- Do not generate a catch-up timetable (BR-03). A missed dose remains overdue and tells the caregiver to contact the clinic. The calculator does not invent a new interval.

The dose list is an input. The function does not embed antigen names, ages, routes, or doses of its own. The research baseline already loaded by the frontend is `EPI_SCHEDULE_DEFINITIONS` in `src/features/vaccinations/scheduleConfig.ts`, version `LK-EPI-2023.v1-research-baseline`, with `isDemonstrationOnly: true`. Promoting that array into the database is a later step, and only with the reference metadata in sections 4 and 9. This document does not restate or amend those rows.

### Derived status

`computeVaccinationStatus` in `src/features/vaccinations/vaccinationStatus.ts` is the current UI rule:

- A record with a non-null `administeredOn` and `source === "health_worker_verified"` is `completed_verified`.
- Any other record with a non-null `administeredOn` is `completed_unverified`, including `demo` and `parent_reported`.
- Otherwise a `dueDate` before today is `overdue`.
- The UI then calls a due date within 14 days `due`, and a later date `upcoming`.

The 14-day split is not in the BRD. It stays in the UI module until Member 2 confirms it. The backend must not persist `due` versus `upcoming`, and it must not invent another window.

### Persistence boundary

```ts
export interface VaccinationScheduleRepository {
  /** The active research or reviewed definition set. Does not query a child. */
  getActiveDefinition(): Promise<HealthResult<ScheduleDefinitionSet>>
}
```

`VaccinationService.getSchedule(childId)` loads the child (Member 3), loads the active definition, then calls `buildVaccinationSchedule`. An unknown or inaccessible child is `not_found`.

## 6. Vaccination records

A vaccination record is a reported administered dose. `administeredOn` is not `dueDate` and not `ClinicAppointment.scheduledAt` (FR-021).

### Reused types

`VaccinationRecord` and `AddReportedDoseInput` stay the UI contract.

- Caregiver insert sets `source` to `"parent_reported"` inside the adapter. The client cannot send `source` or `verifiedBy` (BR-02).
- `"demo"` is only for fictional seeded rows such as Nethmi and Kavindu. A connected insert never writes `demo`.
- `"health_worker_verified"` and `verifiedBy` stay unset. No caregiver API sets them. A future health-worker flow has to be a separate reviewed function.
- `administeredOn` on input is a required `IsoDate`. The stored field stays `IsoDate | null` so an unreported code can be represented without pretending a date exists. The current add path always stores a date.

### Pure checks

```ts
export interface ReportedDoseFacts {
  dateOfBirth: IsoDate
  vaccineCode: string
  administeredOn: IsoDate
  knownVaccineCodes: readonly string[]
  today: IsoDate
}

export function validateReportedDose(
  facts: ReportedDoseFacts,
): HealthResult<{ administeredOn: IsoDate; source: "parent_reported" }>
```

Reject when:

- `administeredOn` is missing, malformed, or not a real calendar date
- `administeredOn` is after `today`
- `administeredOn` is before `dateOfBirth`
- `vaccineCode` is not in `knownVaccineCodes` for the active schedule version

Do not reject a dose only because it is before or after the milestone due date. An early or late report is still unverified history, not a catch-up plan.

### Persistence boundary

```ts
export interface VaccinationRecordRepository {
  listForChild(childId: string): Promise<HealthResult<VaccinationRecord[]>>
  saveParentReported(input: AddReportedDoseInput): Promise<HealthResult<VaccinationRecord>>
}
```

The current mock replaces an existing row with the same `childId` and `vaccineCode`. The connected store keeps one current caregiver-reported row per `(child_id, vaccine_code)` and writes the previous date into the audit trail when that table exists. It does not mark the replacement verified.

`VaccinationService.addReportedDose` runs `validateReportedDose`, then `saveParentReported`, and returns the saved `VaccinationRecord`.

## 7. Growth measurements

A measurement is a dated quantity. It is not a nutritional diagnosis (BR-05).

### Reused types

`GrowthMeasurement` and `AddMeasurementInput`:

| Field | Unit | Required on add |
|---|---|---|
| `measuredOn` | `IsoDate` | Yes. Not after today in `Asia/Colombo`. Not before date of birth. |
| `weightKg` | kilograms | Optional on the shared type. If present, a finite number strictly greater than 0. |
| `lengthHeightCm` | centimetres | Optional. If present, a finite number strictly greater than 0. |
| `headCircumferenceCm` | centimetres | Optional. If present, a finite number strictly greater than 0. |
| `source` | `RecordSource` | Set by the server to `parent_reported` for a caregiver insert. |

No upper “clinical” bound is defined here. Inventing one would be an unreviewed threshold.

The shared type allows an add with none of the three quantities. The F0 growth adapter instead requires `weightKg`. Those two rules disagree. Section 13 asks Member 2 which rule the connected adapter should enforce. This contract recommends: at least one of the three quantities must be present and valid, and any quantity that is present must be a positive finite number. Until Member 2 agrees, the mock’s weight requirement stays in the UI adapter.

`birthWeightKg` on `Child` is a profile field owned with Member 3. It is not a `GrowthMeasurement` unless a caregiver also records it as a measurement on the date of birth.

### Pure checks

```ts
export function validateMeasurement(input: {
  dateOfBirth: IsoDate
  measuredOn: IsoDate
  weightKg?: Kilograms
  lengthHeightCm?: Centimetres
  headCircumferenceCm?: Centimetres
  today: IsoDate
}): HealthResult<Omit<GrowthMeasurement, "id" | "childId" | "source">>
```

### Persistence boundary

```ts
export interface GrowthMeasurementRepository {
  listForChild(childId: string): Promise<HealthResult<GrowthMeasurement[]>>
  addParentReported(input: AddMeasurementInput): Promise<HealthResult<GrowthMeasurement>>
}
```

Rows are append-only for caregivers. A later correction is a new row, not a silent overwrite, so the chart can show the entered history. Deleting a measurement waits for the retention decision Member 3 already flagged: there is no client delete on children.

`GrowthService.list` and `addMeasurement` are thin wrappers over these functions. `source` on the returned row is `parent_reported`.

## 8. Growth assessments

An assessment answers “what does this weight mean against a named reference?”. The chart series and the assessment are different objects.

### What the UI has today

`GrowthReferenceSeries` is the chart contract:

- `indicator` is only `"weight_for_age"`
- `sex` selects the series
- `provenance` is `"who"` or `"synthetic_demo"`
- `sourceLabel`, `sourceVersion`
- `clinicalStatus` is the literal `"not_assessed"`
- `points` are `GrowthReferencePoint` values in kilograms at integer `ageMonths`, with −2 SD, −1 SD, median, +1 SD, and +2 SD

`GrowthService.getReferenceSeries` returns that object. The current adapter always returns `provenance: "synthetic_demo"` from `src/features/growth/mockData.ts`. Those point values are demonstration drawings. They are not WHO tables. The backend must not copy them into a table labeled `who`, and this document does not repeat the numbers.

A series with `provenance: "synthetic_demo"` must keep `clinicalStatus: "not_assessed"`. A series may use `provenance: "who"` only when `reference` points at a pinned official file that passed the review in section 9. This phase does not add that file, so no connected call returns `provenance: "who"`.

### Assessment result

There is no assessment type in `src/types` yet. The proposed result is a discriminated union. The `calculated` arm exists so FR-037 can store a verified z-score later. Nothing in this phase may construct that arm.

```ts
export type GrowthIndicator = "weight_for_age"

export type GrowthAssessment =
  | {
      status: "not_assessed"
      measurementId: string
      childId: string
      indicator: GrowthIndicator
      reason:
        | "reference_dataset_not_pinned"
        | "measurement_missing_weight"
        | "age_outside_pinned_table"
        | "synthetic_reference_cannot_be_scored"
      reference: ClinicalReference | null
    }
  | {
      status: "calculated"
      measurementId: string
      childId: string
      indicator: "weight_for_age"
      /** From the pinned WHO table only. Not a diagnosis and not a colour band. */
      zScore: number
      reference: ClinicalReference & { reviewStatus: "professionally_reviewed" }
      /** BR-05. A z-score does not become a clinical category in this contract. */
      clinicalCategory: "not_assessed"
    }
```

```ts
export function assessWeightForAge(input: {
  measurement: GrowthMeasurement
  sex: ChildSex
  dateOfBirth: IsoDate
  pinnedDataset: PinnedGrowthDataset | null
}): GrowthAssessment
```

Until section 9 is satisfied, `pinnedDataset` is `null` and the function returns `status: "not_assessed"` with `reason: "reference_dataset_not_pinned"`. It returns `measurement_missing_weight` when `weightKg` is absent. It returns `synthetic_reference_cannot_be_scored` if the caller passes the demo series. It does not interpolate, estimate, or return a z-score from memory.

Length-for-age and head-circumference-for-age are not indicators yet. Those quantities are stored and are not scored.

`PinnedGrowthDataset` is the loaded official table plus its `ClinicalReference` and content checksum. The loader fails closed: a missing file, a checksum mismatch, or `reviewStatus !== "professionally_reviewed"` yields `null`.

### Persistence boundary

```ts
export interface GrowthReferenceRepository {
  getSeries(childId: string, sex: ChildSex): Promise<HealthResult<GrowthReferenceSeries>>
}

export interface GrowthAssessmentRepository {
  /** Optional cache of a calculated assessment. Empty until a pinned dataset exists. */
  findForMeasurement(measurementId: string): Promise<HealthResult<GrowthAssessment | null>>
}
```

`getSeries` today is satisfied by the synthetic adapter. A Supabase adapter of `getReferenceSeries` returns the same synthetic series, still labeled `synthetic_demo`, unless a reviewed pin exists. It does not query Gemini. Growth math never calls Gemini (FR-037).

## 9. Official sources required

These publications are required before any schedule is treated as current national practice, and before any growth series is labeled `who` or any assessment returns `calculated`. Retrieval for this phase did not download the numerical tables. No z-score, percentile, LMS coefficient, antigen age, or dose volume is stated in this contract.

### Vaccine schedule

| Item | Value |
|---|---|
| Publisher | Epidemiology Unit, Ministry of Health, Sri Lanka |
| Document | National Immunization Schedule, the English PDF cited by the BRD |
| URL | https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf |
| BRD | Section 7.3 illustrative baseline, section 21 reference 1, open question Q-02 |
| Frontend pin already in the repo | `LK-EPI-2023.v1-research-baseline` in `scheduleConfig.ts`, `isDemonstrationOnly: true`, disclaimer “For demonstration — verify the latest official EPI schedule before clinical use” |
| Review status for backend use | `unreviewed_research_baseline` |
| Endorsement | `none` |

Q-02 is still open: which circular is in effect on a deployment date is not decided. The PDF above is the required starting document. It is not proof that the rows in `EPI_SCHEDULE_DEFINITIONS` match that PDF, and it is not proof that a later circular has left those rows unchanged.

Before a schedule version is stored as the active clinical configuration, the team records, in the version row itself:

1. Document title, publisher, and publication or circular date as printed on the document.
2. The URL and the `retrievedOn` date.
3. The `sourceVersion` string SuwaDaru will copy onto milestones.
4. A statement, by a named reviewer, that each stored `vaccineCode` and `ageMonths` was checked against that document.
5. `reviewStatus: "professionally_reviewed"` only after that statement exists. `endorsement` remains `"none"`.

Until that record exists, the active definition stays the demonstration baseline and every milestone keeps the demonstration disclaimer. The backend does not add, drop, or retitle antigens to “complete” the schedule.

### WHO growth reference

| Item | Value |
|---|---|
| Publisher | World Health Organization |
| Indicator in scope | Weight-for-age, separately for female and male |
| Method overview | https://www.who.int/tools/child-growth-standards |
| Weight-for-age standard | https://www.who.int/tools/child-growth-standards/standards/weight-for-age |
| BRD | Section 7.4, FR-031, FR-032, FR-035, BR-04, BR-05, section 21 references 2 and 3, open question Q-03 |
| Data present in this repository | Synthetic chart points only (`provenance: "synthetic_demo"`, `sourceVersion: "synthetic-demo-v1"`) |
| Official numerical table in this repository | None |

Q-03 is still open. The safe choice until a pin exists is the one the growth page already makes: show the synthetic series with a demonstration label and withhold scoring.

A future pin is a file committed only after a reviewer downloads it from the WHO weight-for-age publication and records:

1. Indicator (`weight_for_age`), sex, and the age unit the table actually uses (completed days or completed months). The contract does not guess which WHO workbook applies.
2. Table title as published, `sourceUrl`, `retrievedOn`, and `sourceVersion`.
3. SHA-256 of the pinned file.
4. The reviewer statement that the file is the WHO table, not a redraw of `mockData.ts`.
5. `reviewStatus: "professionally_reviewed"` and `endorsement: "none"`.

The assessment function may return `calculated` only for a pin that has all five. SD lines on a chart, when the pin exists, are the table’s −2, −1, 0, +1, and +2 curves (FR-032). They are labels of the reference, not a diagnosis of the child. This phase does not choose z-score cutoffs for “underweight” or any other clinical word.

## 10. Clinic appointments

An appointment is a clinic visit. `scheduledAt` is not an EPI due date (FR-051).

### Reused types

`ClinicAppointment`, `CreateAppointmentInput`, `UpdateAppointmentInput`, and `AppointmentStatus` (`"scheduled"` | `"completed"` | `"cancelled"`).

- `scheduledAt` is `IsoDateTime` with an explicit offset.
- `clinicName` is required and non-blank.
- `purpose` is optional free text.
- `cancel` sets `status` to `"cancelled"`. Update does not cancel. The shared `UpdateAppointmentInput` already excludes `"cancelled"` from `status`.
- No field records that an SMS, push, or email was sent. A reminder preview, if returned, uses `deliveryState: "not_sent"` only (FR-052, BR-07).

The appointments page also calls `appointmentService.complete(id)`. That method is not on `AppointmentService`. Section 13 asks to add it. The intended behavior, matching the mock, sets `status` to `"completed"` and does not send a reminder.

### Pure checks

```ts
export function validateNewAppointment(input: {
  scheduledAt: IsoDateTime
  clinicName: string
  purpose?: string
}): HealthResult<CreateAppointmentInput>
```

Reject a blank clinic name and a `scheduledAt` that does not parse as an ISO 8601 instant with an offset (`Z` or `±hh:mm`). Do not compare the instant with the child’s immunisation due dates.

### Persistence boundary

```ts
export interface AppointmentRepository {
  listForChild(childId: string): Promise<HealthResult<ClinicAppointment[]>>
  create(input: CreateAppointmentInput): Promise<HealthResult<ClinicAppointment>>
  update(
    appointmentId: string,
    input: UpdateAppointmentInput,
  ): Promise<HealthResult<ClinicAppointment>>
  cancel(appointmentId: string): Promise<HealthResult<ClinicAppointment>>
  complete(appointmentId: string): Promise<HealthResult<ClinicAppointment>>
}
```

`update`, `cancel`, and `complete` resolve the row only among appointments for children the actor can access. The F0 mock scans every child in the session store. A connected repository must not do that.

## 11. Nutrition AI requests and responses

Two paths exist. They must not be mixed.

### Path A — demo, already shipped

`NutritionService.getDemoResponse(DemoNutritionRequest): Promise<ChatMessage>` stays the browser contract.

- Input is `childId` plus caregiver `text`.
- The returned assistant `ChatMessage` has `isDemo: true`.
- The implementation does not call Gemini and does not read `GEMINI_API_KEY`.
- Empty text is `validation`.
- The text `[simulate-error]` is the existing test hook and throws `AppError("unavailable")`. A connected function does not treat that string as a special case.
- Local classification categories already used by `src/features/nutrition/mockData.ts` are `emergency_referral`, `medication_refusal`, `breastfeeding`, `complementary_feeding`, `local_foods`, `hygiene_safety`, `meal_planner`, and `general_education`. Emergency and medication categories return a professional-care referral or a refusal, not feeding advice (FR-043, BR-06).

`NutritionPage` builds the caregiver’s own bubble with `isDemo: false` (`createClientMessage`). That flag means “this bubble was typed by the user”, not “Gemini wrote this”. Assistant bubbles from path A stay `isDemo: true`. The page banner “Demo responses — no Gemini API connected” stays until a page is deliberately switched to path B.

### Path B — server education, not wired

Proposed types, not added to `src/types` in this phase:

```ts
export type NutritionSafetyCategory =
  | "emergency_referral"
  | "medication_refusal"
  | "educational"

export interface NutritionEducationRequest {
  childId: string
  text: string
}

/** Built on the server from the child row. The browser cannot override it. */
export interface NutritionMinimalContext {
  ageCompletedMonths: number
  sex: ChildSex
}

export interface NutritionEducationResult {
  message: ChatMessage
  safetyCategory: NutritionSafetyCategory
  /** Copied onto message.isDemo. False only after a completed model call. */
  modelCalled: boolean
}
```

```ts
export function classifyNutritionSafety(text: string): HealthResult<
  | { action: "refer"; category: "emergency_referral" }
  | { action: "refuse"; category: "medication_refusal" }
  | { action: "allow_education"; category: "educational" }
>
```

Order of the future Edge Function:

1. Require a Supabase user JWT. Anonymous calls are `unauthenticated`. Verify the user with the Auth server, not with a decoded `user_metadata` claim.
2. Resolve `childId` through caregiver membership (Member 3). Failure is `not_found`.
3. Reject empty text with `validation`.
4. Run `classifyNutritionSafety` locally. `refer` and `refuse` return a fixed educational message, `modelCalled: false`, and `message.isDemo: true`. They do not call Gemini.
5. Only `allow_education` may call Gemini. The request body sent to the model contains the question, `ageCompletedMonths`, and `sex`. It omits the child’s name, clinic, measurements, vaccine records, appointment text, and any contact detail.
6. The API key is the server environment variable `GEMINI_API_KEY`. It is never a `VITE_` variable, never written into `ChatMessage`, and never logged.
7. A timeout, a blocked response, or a provider error is `unavailable`. The function does not fill in a invented answer. The UI already has a retry state for `AppError`.
8. A successful model response sets `modelCalled: true` and `message.isDemo: false`, and still describes itself as general feeding education rather than a diagnosis, a medicine dose, or a therapeutic diet (BR-06).
9. `createdAt` uses an offset instant. The demo adapter’s `toISOString()` value ends in `Z`; path B should emit `+05:30` or an equivalent explicit offset.

`getDemoResponse` is not the method that gains a Gemini call. Adding a second method is the shared-type change in section 13. Until the UI opts into that method, path B can be deployed and tested without changing `NutritionPage`.

## 12. How a mock is replaced

A replacement adapter is another object that implements the existing interface. The page import changes from `./vaccinationService` to that object in a later integration change. This phase does not change those imports.

| UI call | Replacement must |
|---|---|
| `getSchedule` | Run section 5 and return `VaccinationMilestone[]` |
| `getRecords` / `addReportedDose` | Run section 6. Force `parent_reported`. |
| `list` / `addMeasurement` / `getReferenceSeries` | Run sections 7 and 8. Keep synthetic provenance until a WHO pin exists. |
| `list` / `create` / `update` / `cancel` on appointments | Run section 10. `complete` waits for the interface change. |
| `getDemoResponse` | Stay on path A |

Database rows use snake_case (`child_id`, `measured_on`, `weight_kg`, `administered_on`, `scheduled_at`). Adapters map to the camelCase types at this boundary. Child ids in Supabase are UUIDs from Member 3, not `child_nethmi_demo`.

Authorization for every health table, once migrations exist:

- Enable row level security in the same migration that creates the table.
- `SELECT` requires a `child_caregivers` row for `auth.uid()`.
- `INSERT` and `UPDATE` also require `access_level` of `owner` or `editor`. A viewer who can read must not write.
- Policies read `child_caregivers` the way Member 3’s child policies do. They do not use `children.created_by` as permission, and they do not make `child_caregivers` policies depend on health tables.
- Column grants omit `source`, `verified_by`, and timestamps so a browser client cannot forge provenance.
- The service-role key stays on the server. The browser keeps using the publishable key only.

## 13. Changes that need frontend agreement

None of these edits were made.

| Proposal | Why it needs agreement | If declined |
|---|---|---|
| Add `AppErrorCode` `"forbidden"` in `src/services/contracts/errors.ts` | Viewer write denial needs a code that is not `unauthenticated` | Connected adapter cannot tell a viewer failure apart from a missing child without overloading `not_found` |
| Add `complete(appointmentId)` to `AppointmentService` | `AppointmentsPage` and `tests/appointments.test.ts` already call it on the mock | Repository can implement `complete`, but the shared interface stays short of the page |
| Add `NutritionEducationService.requestEducation` (path B) beside `getDemoResponse` | `NutritionService` currently forbids a Gemini call | Path B stays an Edge Function tested without the page |
| Add `ClinicalReference`, `GrowthAssessment`, and `ScheduleDefinitionSet` under `src/types` and export them from `src/types/index.ts` | New shared names | They remain documented here and local to the domain module |
| Confirm the 14-day `due` window in `vaccinationStatus.ts` | It is not a BRD rule | Status stays a UI concern and is not stored |
| Choose measurement validity: weight required (current mock) or at least one positive quantity (this recommendation) | `AddMeasurementInput` allows a measurement with no quantities; the mock rejects a missing weight | Database check waits |
| Later, switch unknown-child list behavior from `[]` to `not_found` | `tests/vaccinations.test.ts` expects `getRecords("unknown_child_123")` to be `[]` | Mocks and their tests stay as they are; only the connected adapter uses `not_found` |

`src/features/auth`, `src/services/contracts/auth-service.ts`, `src/services/mock-auth-service.ts`, and Member 3’s migrations are out of scope for those agreements.

## 14. Dependencies on Member 3

From `feature/backend-auth`, not yet on `origin/main`:

- `public.children.id` is a UUID. Health foreign keys use that id.
- `public.child_caregivers.access_level` is `owner`, `editor`, or `viewer`.
- `children.created_by` is provenance, not access.
- Child creation is `public.create_child` → `private.create_child_with_owner`. Health code does not insert children.
- Date of birth cannot be after today in `Asia/Colombo`. Sex is `male` or `female`. Birth weight, when present, is a positive finite numeric.
- There is no client `DELETE` on children or memberships. Health tables need an explicit retention rule before they offer delete.
- `clinicName` is on the TypeScript `Child` and is intentionally absent from `children`. Appointment `clinicName` is the visit’s clinic, not the child’s home clinic. This contract does not add `children.clinic_name`.
- Profiles are not created automatically at sign-up. The nutrition function needs a valid JWT and a caregiver row, not a display name from `user_metadata`.
- `audit_logs` is named in the BRD and owned by neither branch. Previous vaccination dates should land there once an owner is agreed.

Health migrations, when written, are new files applied after Member 3’s two migrations. They do not edit `20261024071052_phase2_core_child_schema.sql` or `20261024073000_phase3_secure_row_level_security.sql`.

## 15. Integration notes for Member 2

Member 2 here is the owner of the vaccination, growth, nutrition, and appointment screens (`feature/frontend-health`). No page in those folders was edited.

- Keep importing `./vaccinationService`, `./growthService`, `./nutritionService`, and `./appointmentService`. The contract was written so those objects can be replaced later without a page rewrite.
- Keep showing schedule source, version, and the demonstration disclaimer from `EPI_SCHEDULE_METADATA`.
- Keep `completed_verified` unused for caregiver saves. Parent-reported and demo doses stay “Reported (unverified)”.
- Keep the growth banner on `synthetic_demo` / not assessed. Do not relabel `mockData.ts` curves as WHO.
- Keep assistant nutrition replies on `isDemo: true`, and keep the banner that no Gemini request was made. User bubbles with `isDemo: false` must not be described as model output.
- `complete` remains a mock-only method until `AppointmentService` includes it.
- The `[simulate-error]` nutrition hook and the appointment clinic name `[simulate-error]` hook stay demo features.
- Dashboard `EPI_MILESTONES` in `src/features/dashboard/dashboard-helpers.ts` is a second schedule list. The health contract uses `scheduleConfig.ts` as the research baseline. Those two lists can show different next-due dates. Aligning them is a frontend change, not part of this phase.

## 16. Test requirements

These tests are the acceptance checks for the later implementation. They are not added in this phase. Domain tests use Node’s test runner, the same style as `tests/*.test.ts`. Authorization tests follow Member 3’s PGlite runner and apply Member 3’s migrations before the health migration.

| ID | Case | Expected result |
|---|---|---|
| H-01 | Add calendar months for 31 January and for 29 February in a leap year | Clamp to the last day of the target month. Do not use a 30-day step. |
| H-02 | Birth-window dose | `dueDate` equals the child’s date of birth. `ageMonths` is null. |
| H-03 | Schedule builder given an empty dose list | Returns an empty milestone list. It does not invent antigens. |
| H-04 | Reported dose in the future, or before birth | `validation`. No row stored. |
| H-05 | Reported dose for a code absent from the active schedule | `validation`. |
| H-06 | Caregiver save | `source` is `parent_reported`. `verifiedBy` is absent. Status helper returns `completed_unverified`. |
| H-07 | Same vaccine code reported again | One current row. Previous date retained for audit. Source stays `parent_reported`. |
| H-08 | Weight 0, negative, or non-finite; the same for length and head circumference | `validation`. |
| H-09 | Measurement date in the future or before birth | `validation`. Today is the Colombo calendar date. |
| H-10 | `assessWeightForAge` with no pinned dataset | `not_assessed` / `reference_dataset_not_pinned`. No z-score field. |
| H-11 | Synthetic series passed to the assessor | `synthetic_reference_cannot_be_scored`. `provenance` is not rewritten to `who`. |
| H-12 | `getReferenceSeries` before a WHO pin | `provenance: "synthetic_demo"`, `clinicalStatus: "not_assessed"`. |
| H-13 | Appointment with a blank clinic name or an offset-less time | `validation`. |
| H-14 | Cancel and complete | Status changes. No reminder is marked sent. |
| H-15 | Nutrition text classified as emergency or medication | Fixed safe reply. `modelCalled` is false. Gemini is not invoked. |
| H-16 | Educational nutrition call | Only age in completed months, sex, and the question leave the server. A provider failure is `unavailable` with no substitute paragraph. |
| H-17 | Two caregivers, one child each | Each list returns only that caregiver’s child. A known UUID for the other child is `not_found`. |
| H-18 | Viewer membership | Select succeeds. Insert and update affect 0 rows or return `forbidden`. |
| H-19 | Direct client write of `source = health_worker_verified` | Rejected by column grants or a constraint. |
| H-20 | Service-role key | Absent from the Vite bundle and from any `VITE_` variable. |

Existing UI tests (`tests/vaccinations.test.ts`, `tests/growth.test.ts`, `tests/nutrition.test.ts`, `tests/appointments.test.ts`, `tests/calendarDate.test.ts`) remain the regression suite for the mocks. A domain test that imports those feature modules must tolerate their in-memory session state, or it must not import them.

## 17. Out of scope for this phase

- Editing `src/types`, `src/services/contracts`, feature pages, or auth files.
- SQL migrations, RLS policies, and the Gemini Edge Function.
- Vendoring WHO workbooks or editing `EPI_SCHEDULE_DEFINITIONS`.
- Catch-up schedules, z-score cutoffs, SMS delivery, and health-worker verification.

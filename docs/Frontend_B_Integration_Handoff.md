# Frontend B — Health Feature Integration Handoff

**Branch:** `feature/frontend-health`  
**Author:** Frontend B  
**Date:** 2026-10-24  
**Commit scope:** `chore(health-ui): scaffold typed child-specific health pages`

---

## Export paths for Frontend A

Frontend A's router already imports these paths. No changes to `src/app/router.tsx` are required.

| Feature | Named export | Import path |
|---|---|---|
| Vaccination Tracker | `VaccinationsPage` | `@/features/vaccinations/VaccinationsPage` |
| Growth Monitoring | `GrowthPage` | `@/features/growth/GrowthPage` |
| Nutrition Chat | `NutritionPage` | `@/features/nutrition/NutritionPage` |
| Appointments | `AppointmentsPage` | `@/features/appointments/AppointmentsPage` |

All four components accept exactly `{ childId: string }` via `ChildFeaturePageProps` from `@/types`.

---

## Files created by Frontend B

### Shared feature utility
- `src/features/childResolver.ts` — `resolveChild(childId)`, `ageInMonths()`, `formatAge()`

### Vaccinations feature (`src/features/vaccinations/`)
| File | Purpose |
|---|---|
| `VaccinationsPage.tsx` | **Main page** (replace stub) |
| `vaccinationService.ts` | Mock adapter (satisfies `VaccinationService` contract) |
| `vaccinationStatus.ts` | Pure status computation + label/color maps |
| `mockData.ts` | EPI schedule builder, fictional seeded records |

### Growth feature (`src/features/growth/`)
| File | Purpose |
|---|---|
| `GrowthPage.tsx` | **Main page** (replace stub) |
| `growthService.ts` | Mock adapter (satisfies `GrowthService` contract) |
| `mockData.ts` | Fictional measurements, synthetic reference series |

### Nutrition feature (`src/features/nutrition/`)
| File | Purpose |
|---|---|
| `NutritionPage.tsx` | **Main page** (replace stub) |
| `nutritionService.ts` | Mock adapter (satisfies `NutritionService` contract) |
| `mockData.ts` | Scripted responses, suggested prompts |

### Appointments feature (`src/features/appointments/`)
| File | Purpose |
|---|---|
| `AppointmentsPage.tsx` | **Main page** (replace stub) |
| `appointmentService.ts` | Mock adapter (satisfies `AppointmentService` contract) |
| `mockData.ts` | Fictional clinic appointments for Nethmi + Kavindu |

---

## Integration imports needed from Frontend A

When A's shared mock adapters land on `main`, replace the local calls inside these files:

| Frontend B file | Needs from A | Currently uses |
|---|---|---|
| `childResolver.ts` | `childService.get(childId)` | Local `demoChildren` lookup |
| `growthService.ts` | `childService.get(childId).sex` | Local `DEMO_CHILD_SEX` map |
| All four adapters | Potentially A's shared mock service barrel | Own local implementations |

The contract types (`@/types`, `@/services/contracts`) are **already** imported from A's paths — Frontend B never redeclared them.

---

## BRD compliance summary

| Requirement | Implementation |
|---|---|
| FR-020–026 Vaccine schedule | Calendar-month schedule from DOB; status badges; parent-reported only |
| FR-021 Source distinction | Milestone due date, administered date, and appointment displayed separately |
| FR-022 Status display | upcoming / due / overdue / completed_unverified; completed_verified never set in F0 |
| FR-023 Source attribution | Schedule version + source URL displayed in banner |
| FR-024 Record form | Inline report form with editable/cancellable state |
| FR-025 Reminder preview | Labeled "not sent"; no SMS/push claimed |
| FR-026 Date validation | Future dates rejected client-side and in service adapter |
| FR-030–036 Growth chart | Recharts chart + table alternative; tabular alternative for accessibility |
| FR-031 Reference labeling | "DEMONSTRATION ONLY — not official WHO data" in banner + chart legend |
| FR-035 Clinical status | Always `not_assessed`; no z-score computed |
| FR-040–043 Nutrition chat | Typing indicator, suggested prompts, demo disclaimer, safe referral for emergency keywords |
| FR-050–052 Appointments | Full CRUD; tabs; reminder preview; confirmation for cancel |
| BR-01 Date arithmetic | Calendar-month arithmetic via `addCalendarMonths()` |
| BR-02 Provenance | `parent_reported` only; `health_worker_verified` reserved |
| BR-03 Missed vaccine | Clinic/PHM contact suggestion; no catch-up plan generated |
| BR-07 Demo honesty | No "SMS sent", "Gemini replied", or "verified" claims anywhere |
| BR-08 Child context | Invalid childId → `AppError("not_found")` → safe error UI |
| NFR-03 Reliability | Loading/error/empty states on all four pages |
| NFR-04 TypeScript | Strict types; no `any`; all service adapters satisfy contracts |
| NFR-05 Accessibility | Tables as chart fallbacks; `role`, `aria-*`, visible focus, `sr-only` labels |
| T-05 Bogus child ID | Safe error panel with Dashboard link |
| T-09 Zero/negative weight | Validated in form and service; save prevented |
| T-10 Synthetic reference | Prominent "DEMONSTRATION ONLY" banner on growth chart |
| T-11 Emergency question | `safe_referral` response with professional-care message |
| T-12 Appointment CRUD | Create/edit/cancel all implemented |

---

## Notes for merge

1. Pull `main` after A's branch merges to pick up any shared utilities.
2. Run `npm run typecheck` and `npm run build` before opening the PR.
3. The child-sex lookup in `growthService.ts` uses a local map; swap to `childService.get().sex` once A exposes the real adapter.
4. All mock data is fictional (Nethmi, Kavindu from BRD Appendix A). No real health records, no contact details.

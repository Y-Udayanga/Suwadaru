# Frontend phased handoff

This note records the scaffold contract for parallel frontend work. Product requirements stay in `SuwaDaru_BRD_v1.0.md`. A separate phased-prompt document was not in the repository when the scaffold was created.

## Branches

- Scaffold: `chore/frontend-scaffold`
- Frontend A feature work: `feature/frontend-core`
- Frontend B feature work: `feature/frontend-health`

Both feature branches start from the reviewed scaffold commit. Frontend A merges the shell and contracts first. Frontend B then updates from `main`.

## Ownership

| Area | Owner |
| --- | --- |
| `src/app`, `src/components/layout`, `src/components/ui` | Frontend A |
| `src/types`, `src/services/contracts`, `src/styles` | Frontend A |
| Landing, auth, dashboard, child profile placeholders | Frontend A |
| `src/features/vaccinations`, `growth`, `nutrition`, `appointments` | Frontend B |

Frontend B may replace the body of a health page. Keep the file path and named export so the router does not need an uncoordinated edit.

## Page signature

The router reads `:childId` and passes it as a prop. It also remounts the page when that id changes, so a screen cannot keep another child's state. Export a named component:

```tsx
import type { ChildFeaturePageProps } from "@/types"

export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  return null
}
```

Use the same props type for `GrowthPage`, `NutritionPage`, and `AppointmentsPage`. A missing param renders the not-found placeholder. Do not substitute another child's id.

## Imports

- Domain types: `@/types`
- Service interfaces: `@/services/contracts`
- Route builders: `@/app/routes`
- Fictional ids: `@/data/mock`

Service functions are interfaces only. Adapters come later and must return Promises and throw `AppError`. Components should not import fixture arrays to render health data.

## F0 limits

Use fictional data only. Do not connect Supabase or Gemini. Do not store passwords, national identifiers, phone numbers, or real health records. Do not describe a placeholder as a sent reminder, a model reply, or a verified clinical result.

Dates are `YYYY-MM-DD` for birthdays and measurements. Appointment instants include an explicit UTC offset. Weight is kilograms and length is centimetres, stored as numbers.

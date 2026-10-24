# SuwaDaru

SuwaDaru is a mobile-first companion preview for caregivers. It is not a clinical record, a government service, or a substitute for the paper Child Health Development Record, a midwife, or a doctor.

This repository currently contains the shared frontend scaffold: the app shell, route map, design tokens, domain types, and service contracts. Screens are placeholders. No backend is connected.

## Setup

Use Node.js 22 and npm 10.

```bash
npm install
npm run dev
```

The dev server prints a local URL. These scripts are available:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and create the production build |
| `npm run typecheck` | Typecheck only |
| `npm run lint` | Run oxlint |
| `npm run preview` | Serve the production build |

Copy `.env.example` to `.env` only when a later phase needs configuration. F0 does not read environment variables. Do not put Gemini or service-role keys in any `VITE_` variable.

## Shared ownership

Frontend A owns the router, app shell, `src/types`, `src/services/contracts`, and global tokens. Frontend B owns the vaccination, growth, nutrition, and appointment screens and should replace the placeholder components without changing the exported names.

Child-scoped pages receive the route param as a prop:

```tsx
import type { ChildFeaturePageProps } from "@/types"

export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  return <section>{childId}</section>
}
```

The router reads `:childId` and passes it in. The page remounts when the id changes. The same signature is used for `GrowthPage`, `NutritionPage`, `AppointmentsPage`, and `ChildOverviewPage`.

Path helpers live in `src/app/routes.ts`. Fictional child ids live in `src/data/mock`. Feature code should call the Promise-based contracts in `src/services/contracts` once adapters exist, rather than reading fixture arrays inside components.

## Routes

| Path | Placeholder |
| --- | --- |
| `/` | Landing |
| `/login` | Demo sign in |
| `/register` | Demo registration |
| `/forgot-password` | Recovery preview |
| `/dashboard` | Parent home |
| `/children/new` | Add child |
| `/children/:childId` | Child overview |
| `/children/:childId/vaccinations` | Vaccinations |
| `/children/:childId/growth` | Growth |
| `/children/:childId/nutrition` | Nutrition |
| `/children/:childId/appointments` | Appointments |

Unknown addresses show a not-found page with links back to home and the dashboard.

## Design tokens

Brand colors are defined in `src/styles/tokens.css` and mapped into Tailwind from `src/index.css`.

- Teal `#0F766E` is `bg-primary` and `bg-teal`
- Mint `#E8F7F3` is `bg-mint`
- Canvas `#F8FAFC` is the page background
- Gold `#F4C95D` and coral `#E27D72` are available as `bg-gold` and `bg-coral`

The typeface is Inter, with a system-ui fallback.

## Data

Sample profiles use the fictional names from the requirements document: Demo Parent, Nethmi, and Kavindu. Do not add real people, contact details, or clinical records.

Requirements and the frontend handoff are in `docs/`.

import { Link } from "react-router"
import {
  CalendarClock,
  Plus,
  Salad,
  Syringe,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import { useChild, ChildSwitcher, calculateAge } from "@/features/children"
import { routes } from "@/app/routes"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { EmptyState } from "@/components/layout/FeedbackStates"
import { Button } from "@/components/ui/button"

export function DashboardPage() {
  const { children, selectedChild, isLoading } = useChild()

  // Empty state handling per FR-014 and T-02
  if (!isLoading && children.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <PageHeader
          title="Caregiver Dashboard"
          subtitle="Fictional companion for child health records and appointments."
        />
        <EmptyState
          title="No Child Profiles Registered"
          description="Register a fictional child profile to explore Sri Lanka National Immunization milestones, WHO growth curves, and feeding education."
          action={
            <Button asChild size="lg" className="min-h-11 gap-2">
              <Link to={routes.newChild}>
                <Plus aria-hidden className="size-4" />
                Add First Child Profile
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const activeChild = selectedChild || children[0]
  const age = activeChild ? calculateAge(activeChild.dateOfBirth) : null

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        title="Caregiver Dashboard"
        subtitle="Fictional companion for child health tracking and clinic schedules."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link to={routes.newChild}>
              <Plus aria-hidden className="size-4" />
              Add Child
            </Link>
          </Button>
        }
      />

      {/* Child Switcher Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Child:
          </span>
          <div className="w-64">
            <ChildSwitcher compact />
          </div>
        </div>

        {activeChild && (
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to={routes.child(activeChild.id)}>
              <UserCheck aria-hidden className="size-3.5" />
              View & Edit Profile
            </Link>
          </Button>
        )}
      </div>

      {activeChild && age && (
        <>
          {/* Demographic and Milestone Overview Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Child"
              value={activeChild.name}
              detail={`ID: ${activeChild.id}`}
            />
            <StatCard
              label="Current Age"
              value={age.text}
              detail={`Born on ${activeChild.dateOfBirth}`}
            />
            <StatCard
              label="WHO Growth Cohort"
              value={activeChild.sex === "female" ? "Girls (Female)" : "Boys (Male)"}
              detail="WHO Child Growth Reference"
            />
            <StatCard
              label="Birth Weight"
              value={
                activeChild.birthWeightKg !== undefined
                  ? `${activeChild.birthWeightKg} kg`
                  : "Not recorded"
              }
              detail={activeChild.clinicName || "Sample Clinic"}
            />
          </div>

          {/* Quick Actions for Selected Child */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Health Record Modules for {activeChild.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                All links map to {activeChild.name}&apos;s profile
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Vaccinations */}
              <Link
                to={routes.vaccinations(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    <Syringe aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Vaccinations
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    EPI immunization schedule timeline based on {activeChild.name}&apos;s birthdate.
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-primary">
                  View Timeline →
                </div>
              </Link>

              {/* Growth */}
              <Link
                to={routes.growth(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <TrendingUp aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Growth Tracking
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Weight records plotted against WHO sex-specific standards ({activeChild.sex}).
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-primary">
                  Open Tracker →
                </div>
              </Link>

              {/* Nutrition */}
              <Link
                to={routes.nutrition(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Salad aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Child Feeding
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Age-appropriate nutrition education and Sri Lankan complementary food guidance.
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-primary">
                  Nutrition Chat →
                </div>
              </Link>

              {/* Appointments */}
              <Link
                to={routes.appointments(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    <CalendarClock aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Appointments
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    MOH clinic visits and reminders preview for {activeChild.name}.
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-primary">
                  View Visits →
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

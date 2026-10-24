import { Link } from "react-router"
import {
  Activity,
  ArrowRight,
  Baby,
  CalendarClock,
  Clock,
  MessageSquare,
  Plus,
  Salad,
  Sparkles,
  Syringe,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import { useAuth } from "@/features/auth"
import { useChild, ChildSwitcher, calculateAge } from "@/features/children"
import { routes } from "@/app/routes"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { EmptyState } from "@/components/layout/FeedbackStates"
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getCaregiverGreeting,
  getNextEpiMilestone,
  getNutritionPromptTeaser,
  getSampleChildActivity,
} from "./dashboard-helpers"

export function DashboardPage() {
  const { session } = useAuth()
  const { children, selectedChild, isLoading } = useChild()

  // 1. Loading Skeleton State
  if (isLoading && children.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl" role="status" aria-live="polite">
        <PageHeader
          title="Loading Dashboard..."
          subtitle="Hydrating caregiver profile and child records."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
        </div>
      </div>
    )
  }

  // 2. Empty State Handling (FR-014 & T-02)
  if (!isLoading && children.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <PageHeader
          title="Caregiver Dashboard"
          subtitle="Fictional companion for child health records and appointments."
        />
        <EmptyState
          title="No Child Profiles Registered"
          description="Register a fictional child profile to explore Sri Lanka National Immunization milestones, WHO growth curves, and feeding education. No genuine health data is stored."
          action={
            <Button asChild size="lg" className="min-h-11 gap-2 shadow-sm">
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
  const caregiverName = session?.displayName || "Demo Parent"
  const greeting = getCaregiverGreeting(caregiverName)

  const age = activeChild ? calculateAge(activeChild.dateOfBirth) : null
  const milestoneTeaser = activeChild ? getNextEpiMilestone(activeChild.dateOfBirth) : null
  const totalMonths = age ? age.years * 12 + age.months : 0
  const nutritionTeaser = getNutritionPromptTeaser(totalMonths)
  const recentActivities = activeChild ? getSampleChildActivity(activeChild) : []

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* 1. Header with Personalized Greeting */}
      <PageHeader
        title={greeting}
        subtitle="Manage routine health timelines, WHO growth standards, and clinic appointments."
        actions={
          <Button asChild size="sm" className="gap-2 shadow-xs">
            <Link to={routes.newChild}>
              <Plus aria-hidden className="size-4" />
              Add Child
            </Link>
          </Button>
        }
      />

      {/* 2. Active Child Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
            Selected Child:
          </span>
          <div className="w-64 sm:w-72">
            <ChildSwitcher compact />
          </div>
        </div>

        {activeChild && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link to={routes.child(activeChild.id)}>
                <UserCheck aria-hidden className="size-3.5" />
                View & Edit Profile
              </Link>
            </Button>
          </div>
        )}
      </div>

      {activeChild && age && (
        <>
          {/* 3. Summary Stat Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Selected Child"
              value={activeChild.name}
              detail={`Fictional ID: ${activeChild.id}`}
              accent="teal"
            />
            <StatCard
              label="Current Age"
              value={age.text}
              detail={`Born on ${activeChild.dateOfBirth}`}
            />
            <StatCard
              label="WHO Reference"
              value={activeChild.sex === "female" ? "Girls (Female)" : "Boys (Male)"}
              detail="WHO Child Growth Standards"
            />
            <StatCard
              label="Birth Weight"
              value={
                activeChild.birthWeightKg !== undefined
                  ? `${activeChild.birthWeightKg} kg`
                  : "Not recorded"
              }
              detail={
                activeChild.birthWeightKg
                  ? "Recorded at birth (Sample)"
                  : "Add in growth tracker"
              }
            />
          </div>

          {/* 4. Core Teaser Cards Section (FR-013) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Upcoming Health Milestones for {activeChild.name}
              </h2>
              <span className="text-xs font-medium text-primary flex items-center gap-1">
                <Sparkles aria-hidden className="size-3" />
                Demonstration Previews
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card A: Next EPI Milestone Teaser */}
              <Card className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Syringe aria-hidden className="size-4 text-primary" />
                      <span>Next Scheduled EPI Milestone</span>
                    </div>

                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {milestoneTeaser ? milestoneTeaser.ageLabel : "EPI Baseline"}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {milestoneTeaser ? milestoneTeaser.name : "Schedule Complete"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {milestoneTeaser ? (
                      <span>
                        Target Due Date: <strong>{milestoneTeaser.dueDate}</strong>
                      </span>
                    ) : (
                      "All routine five-year milestones completed in demo."
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3 pb-2 text-xs text-muted-foreground space-y-2">
                  <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed">
                    <strong>Notice:</strong> Derived from the Sri Lanka 2023 National
                    Immunization schedule baseline. Final administration dates are verified
                    only by your Public Health Midwife.
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/40 pt-3">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs text-primary font-medium">
                    <Link to={routes.vaccinations(activeChild.id)}>
                      <span>View Full Vaccination Schedule</span>
                      <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Card B: Last Growth Point & Curve Status */}
              <Card className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <TrendingUp aria-hidden className="size-4 text-emerald-600" />
                      <span>Last Recorded Growth Measurement</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                      Weight-for-Age
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {activeChild.birthWeightKg !== undefined
                      ? `${activeChild.birthWeightKg} kg`
                      : "No Measurements Logged"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {activeChild.birthWeightKg !== undefined
                      ? `Recorded at birth on ${activeChild.dateOfBirth} (Sample Clinic)`
                      : "Record weight points in the growth tracker"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3 pb-2 text-xs text-muted-foreground space-y-2">
                  <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed">
                    <strong>WHO Standards:</strong> Matched with WHO Child Growth
                    reference tables for {activeChild.sex === "female" ? "girls" : "boys"}.
                    SuwaDaru does not diagnose or classify nutritional risk from toy data.
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/40 pt-3">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs text-primary font-medium">
                    <Link to={routes.growth(activeChild.id)}>
                      <span>Open Growth Monitoring Chart</span>
                      <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Card C: Upcoming Clinic Appointment */}
              <Card className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 dark:text-sky-300">
                      <CalendarClock aria-hidden className="size-4 text-sky-600" />
                      <span>Upcoming MOH Clinic Visit</span>
                    </div>
                    <span className="rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 px-2 py-0.5 text-[10px] font-semibold">
                      Scheduled
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Routine Well-Child Clinic
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Location: <strong>{activeChild.clinicName || "Local MOH Clinic"}</strong>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3 pb-2 text-xs text-muted-foreground space-y-2">
                  <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed">
                    <strong>Reminder Preview:</strong> Fictional appointment demonstration.
                    Reminders are simulated on-screen; no SMS or push notifications are sent.
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/40 pt-3">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs text-primary font-medium">
                    <Link to={routes.appointments(activeChild.id)}>
                      <span>Manage Clinic Appointments</span>
                      <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Card D: Age-Specific Nutrition Educational CTA */}
              <Card className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <Salad aria-hidden className="size-4 text-amber-600" />
                      <span>Feeding & Nutrition Education</span>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                      {age.text}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {nutritionTeaser.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    {nutritionTeaser.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3 pb-2 text-xs text-muted-foreground space-y-2">
                  <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2.5 text-[11px] text-amber-950 dark:text-amber-200">
                    <p className="font-medium flex items-center gap-1 mb-1">
                      <MessageSquare aria-hidden className="size-3 text-amber-600" />
                      Suggested topic:
                    </p>
                    <p className="italic">&ldquo;{nutritionTeaser.sampleQuestion}&rdquo;</p>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/40 pt-3">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs text-primary font-medium">
                    <Link to={routes.nutrition(activeChild.id)}>
                      <span>Open Nutrition Assistant</span>
                      <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* 5. Four Health Feature Modules Navigation */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-foreground">
              Direct Health Feature Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to={routes.vaccinations(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                    <Syringe aria-hidden className="size-4" />
                  </div>

                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    Vaccinations
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    National schedule milestones for {activeChild.name}.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Open Timeline →
                </div>
              </Link>

              <Link
                to={routes.growth(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <TrendingUp aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    Growth Tracking
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    WHO reference curves matched to {activeChild.sex}.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Open Tracker →
                </div>
              </Link>

              <Link
                to={routes.nutrition(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Salad aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    Child Nutrition
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Age-appropriate Sri Lankan food education.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Start Chat →
                </div>
              </Link>

              <Link
                to={routes.appointments(activeChild.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    <CalendarClock aria-hidden className="size-4" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    Appointments
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    MOH clinic visits and reminders preview.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  View Visits →
                </div>
              </Link>
            </div>
          </div>

          {/* 6. Recent Activity Timeline (FR-015) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity aria-hidden className="size-4 text-primary" />
                Recent Demonstration Activity
              </h2>
              <span className="text-xs text-muted-foreground">
                Attributed sample events
              </span>
            </div>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-3 p-3.5 text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                          {act.type === "vaccine" && <Syringe aria-hidden className="size-3.5" />}
                          {act.type === "growth" && <TrendingUp aria-hidden className="size-3.5" />}
                          {act.type === "appointment" && <CalendarClock aria-hidden className="size-3.5" />}
                          {act.type === "profile" && <Baby aria-hidden className="size-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{act.title}</p>
                          <p className="text-muted-foreground mt-0.5 leading-relaxed">
                            {act.detail}
                          </p>
                          <span className="mt-1 inline-block text-[10px] text-muted-foreground font-mono">
                            Source: {act.source}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock aria-hidden className="size-3" />
                        {act.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

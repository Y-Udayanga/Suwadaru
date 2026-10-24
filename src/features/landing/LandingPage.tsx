import { Link } from "react-router"
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Salad,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Syringe,
  TrendingUp,
} from "lucide-react"
import { routes } from "@/app/routes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LandingPage() {
  return (
    <div className="relative flex flex-col gap-16 py-4 md:py-8 overflow-hidden">
      {/* ── Ambient Background Glow Orbs (Visual Depth & Polish) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-6xl h-[600px] overflow-hidden"
      >
        <div className="absolute top-10 left-1/4 size-80 rounded-full bg-rose-400/20 blur-3xl animate-aura-glow" />
        <div
          className="absolute top-24 right-1/4 size-80 rounded-full bg-amber-400/15 blur-3xl animate-aura-glow"
          style={{ animationDelay: "2.5s" }}
        />
      </div>

      {/* 1. Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-4 gap-6 pt-4 sm:pt-8"
      >
        {/* Brand Emblem with Glowing Halo & Gentle Float Animation */}
        <div className="relative mx-auto flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-500/30 to-amber-400/30 blur-xl animate-aura-glow"
          />
          <div className="relative size-24 sm:size-28 rounded-3xl overflow-hidden shadow-xl ring-2 ring-primary/25 bg-white p-1 animate-float-gentle">
            <img
              src="/suwadaru-logo.jpg"
              alt="SuwaDaru Mother and Child Brand Logo"
              className="size-full object-cover rounded-2xl"
              loading="eager"
            />
          </div>
        </div>

        {/* Prototype & Scope Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs animate-pulse-subtle">
          <Sparkles aria-hidden className="size-3.5 text-primary" />
          <span>Caregiver Health Companion</span>
        </div>

        {/* Hero Title & Tagline with Radiant Sunset-Rose Gradient */}
        <div className="space-y-3">
          <h1
            id="hero-heading"
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance leading-tight"
          >
            Every Child. Every Milestone.{" "}
            <span className="gradient-heading block sm:inline">A Healthier Tomorrow.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
            A digital companion for caregivers in Sri Lanka alongside the physical
            Child Health Development Record (CHDR). Save vaccination records,
            track measurements, organize clinic visits, and keep nutrition notes.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto pt-2">
          <Button
            asChild
            size="lg"
            className="btn-premium w-full sm:w-auto min-h-12 px-7 text-base font-semibold gap-2.5 rounded-xl group shadow-lg"
          >
            <Link to={routes.register}>
              Get started
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-h-12 px-6 text-base font-medium rounded-xl border-border/80 hover:bg-accent/60 shadow-xs"
          >
            <Link to={routes.login}>Sign in</Link>
          </Button>
        </div>

        {/* Reassuring Context Note */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden className="size-4 text-primary" />
            Private caregiver accounts
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Smartphone aria-hidden className="size-4 text-primary" />
            Works on mobile & desktop
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <BookOpen aria-hidden className="size-4 text-primary" />
            Parent-reported records
          </span>
        </div>
      </section>

      {/* 2. Problem vs Solution Section */}
      <section
        aria-labelledby="problem-heading"
        className="glass-card rounded-2xl p-6 sm:p-10 max-w-5xl mx-auto w-full shadow-md"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <h2
            id="problem-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Why We Are Building SuwaDaru
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sri Lanka&apos;s physical CHDR is vital, but paper records face everyday challenges over five years of active handling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paper Challenges */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-5 space-y-4 shadow-xs interactive-card">
            <div className="flex items-center gap-2.5 text-base font-semibold text-foreground">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <FileText aria-hidden className="size-4" />
              </div>
              <span>Paper CHDR Realities</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Paper books can be misplaced, torn, or damaged during rain and travel.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Calculating exact immunization due dates from birthdates causes confusion.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Growth measurements are recorded across paper pages, making trends hard to visualize.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Generic online advice lacks Sri Lankan complementary feeding practices and cultural context.</span>
              </li>
            </ul>
          </div>

          {/* SuwaDaru Companion */}
          <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 space-y-4 shadow-xs interactive-card">
            <div className="flex items-center gap-2.5 text-base font-semibold text-primary">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <HeartHandshake aria-hidden className="size-4" />
              </div>
              <span>How SuwaDaru Supports Caregivers</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-foreground/90 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Always in your pocket alongside your family-held paper record.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Vaccination dose history saved from your child’s health record.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Growth charts from your child’s recorded measurements.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Nutrition notes and questions for your next clinic visit.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Key Feature Cards */}
      <section aria-labelledby="features-heading" className="max-w-5xl mx-auto w-full space-y-8 px-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2
            id="features-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Core Companion Modules
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Designed for simplicity, clear attribution, and zero medical guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1: Vaccines */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 text-primary border border-rose-200/50 shadow-2xs">
                <Syringe aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Vaccination Records
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Save parent-reported doses and their dates. Reviewed schedule milestones appear when a published schedule is available.
            </CardContent>
          </Card>

          {/* Feature 2: Growth */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 shadow-2xs">
                <TrendingUp aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Growth Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              View recorded measurements over time. Reference curves appear only when sourced data is available. No automated clinical diagnosis.
            </CardContent>
          </Card>

          {/* Feature 3: Nutrition */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-800 dark:text-amber-300 border border-amber-200/50 shadow-2xs">
                <Salad aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Nutrition Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Save feeding observations and questions for your clinic visit. AI advice is not connected.
            </CardContent>
          </Card>

          {/* Feature 4: Appointments */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 text-sky-800 dark:text-sky-300 border border-sky-200/50 shadow-2xs">
                <CalendarClock aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                MOH Clinic Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Manage scheduled clinic dates and locations. Clear reminder previews that never falsely claim SMS or push notifications were sent.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section aria-labelledby="steps-heading" className="max-w-4xl mx-auto w-full px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2
            id="steps-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            How SuwaDaru Works in 3 Steps
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create an account and save your child’s records securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card interactive-card flex flex-col items-center text-center p-5 rounded-2xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white font-extrabold text-sm shadow-md ring-2 ring-primary/20">
              1
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Select or Add a Profile</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add your child’s profile, then record measurements, doses and appointments.
            </p>
          </div>

          <div className="glass-card interactive-card flex flex-col items-center text-center p-5 rounded-2xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 text-white font-extrabold text-sm shadow-md ring-2 ring-primary/20">
              2
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Review Milestones & Health</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review vaccination history, track measurements, and save feeding observations for your clinic visit.
            </p>
          </div>

          <div className="glass-card interactive-card flex flex-col items-center text-center p-5 rounded-2xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-rose-600 text-white font-extrabold text-sm shadow-md ring-2 ring-amber-500/20">
              3
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Prepared for the PHM Clinic</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Arrive at clinic appointments with organized questions and dates ready to share with your Public Health Midwife.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Clinical & Regulatory Boundary Notice (No unsupported official endorsements) */}
      <section
        aria-label="Clinical and legal boundary disclaimer"
        className="max-w-4xl mx-auto w-full px-4"
      >
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-5 sm:p-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900 dark:bg-amber-900/70 dark:text-amber-300">
              <ShieldAlert aria-hidden className="size-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <h3 className="font-bold text-amber-950 dark:text-amber-200">
                Important Boundary & Privacy Notice
              </h3>
              <p className="text-amber-900/90 dark:text-amber-300/80 leading-relaxed">
                SuwaDaru is a student and hackathon demonstration companion. It is <strong>not</strong> an official government service, a certified medical device, an authorized clinical record, or an endorsement by the Ministry of Health or Epidemiology Unit.
              </p>
              <p className="text-amber-900/90 dark:text-amber-300/80 leading-relaxed">
                The physical, family-held <strong>Child Health Development Record (CHDR)</strong> and guidance from your Public Health Midwife (PHM) or medical doctor remain the sole authoritative clinical records. Records are saved to your authenticated account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section className="text-center max-w-xl mx-auto px-4 space-y-4 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Ready to get started?
        </h2>
        <p className="text-sm text-muted-foreground">
          Create your caregiver account and add your first child profile.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Button
            asChild
            size="lg"
            className="btn-premium w-full sm:w-auto min-h-12 px-7 text-base font-semibold gap-2.5 rounded-xl group shadow-lg"
          >
            <Link to={routes.register}>
              Get started
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-h-12 px-6 text-base font-medium rounded-xl border-border/80 hover:bg-accent/60 shadow-xs"
          >
            <Link to={routes.login}>Sign In</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

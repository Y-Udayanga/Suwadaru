import { useState } from "react"
import { Link } from "react-router"
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CalendarClock,
  Check,
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
  User,
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
  const [activeTab, setActiveTab] = useState<"vaccines" | "growth" | "ai" | "clinic">("vaccines")

  return (
    <div className="relative flex flex-col gap-16 md:gap-24 py-4 md:py-8 overflow-hidden">
      {/* ── Background Vibrant Ambient Mesh Glows (Eliminates Empty Space) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-[900px] overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-rose-400/25 via-pink-400/15 to-transparent blur-[110px] rounded-full animate-ambient-1" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-amber-400/30 to-orange-400/20 blur-[90px] rounded-full animate-ambient-2" />
        <div className="absolute top-36 right-10 w-80 h-80 bg-gradient-to-bl from-rose-500/30 via-purple-400/20 to-transparent blur-[95px] rounded-full animate-ambient-3" />
        <div className="absolute top-[480px] left-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-teal-400/10 blur-[100px] rounded-full animate-ambient-1" />
      </div>

      {/* 1. Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-4 gap-6 pt-4 sm:pt-8 z-10"
      >
          {/* Brand Emblem with Multi-layer Glow & Floating Micro-badges */}
          <div className="relative mx-auto flex items-center justify-center">
            {/* Spinning decorative aura ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-full bg-gradient-to-tr from-rose-500/40 via-amber-400/35 to-purple-500/35 blur-xl animate-spin-slow opacity-80"
            />
            {/* Logo container */}
            <div className="relative size-24 sm:size-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/90 dark:ring-rose-950 bg-white p-1 animate-float-gentle">
              <img
                src="/suwadaru-logo.jpg"
                alt="SuwaDaru Mother and Child Brand Logo"
                className="size-full object-cover rounded-2xl"
                loading="eager"
              />
            </div>
          </div>

          {/* Prototype & Scope Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/60 dark:border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-amber-400/10 to-rose-500/15 px-4 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm animate-pulse-subtle backdrop-blur-md">
            <Sparkles aria-hidden className="size-3.5 text-rose-600 dark:text-rose-400" />
            <span>Caregiver Health Companion • Prototype Demonstration</span>
          </div>

          {/* Hero Title & Tagline with Radiant Warm Gradient */}
          <div className="space-y-3">
            <h1
              id="hero-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]"
            >
              Every Child. Every Milestone.{" "}
              <span className="gradient-heading block sm:inline">A Healthier, Brighter Tomorrow.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
              A digital companion for caregivers in Sri Lanka alongside the physical
              Child Health Development Record (CHDR). View EPI immunization schedules,
              track WHO growth standards, organize MOH clinic visits, and explore practical
              child nutrition guidance.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-1">
            <Button
              asChild
              size="lg"
              className="btn-premium w-full sm:w-auto min-h-12 px-8 text-base font-semibold gap-2.5 rounded-xl group shadow-xl hover:shadow-rose-500/30"
            >
              <Link to={routes.register}>
                Explore Demo
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-h-12 px-7 text-base font-medium rounded-xl border-rose-200/80 dark:border-rose-800/80 bg-background/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-sm backdrop-blur-md"
            >
              <Link to={routes.login}>Sign In to Demo</Link>
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground pt-1 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
              Zero real PII collected
            </span>
            <span className="hidden sm:inline text-rose-300 dark:text-rose-800">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone aria-hidden className="size-4 text-rose-600 dark:text-rose-400" />
              Works on mobile & desktop
            </span>
            <span className="hidden sm:inline text-rose-300 dark:text-rose-800">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen aria-hidden className="size-4 text-amber-600 dark:text-amber-400" />
              EPI 2023 baseline schedule
            </span>
          </div>
      </section>

      {/* ── Key Live Stats Ribbon (Fills space with vibrant credibility) ── */}
      <section className="max-w-5xl mx-auto w-full px-4" aria-label="Key highlights">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Stat 1 */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center gap-1.5 border border-rose-200/60 dark:border-rose-900/40 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 text-rose-700 dark:text-rose-300">
              <Syringe className="size-5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">12+ Milestones</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Automated EPI Schedule from birth</div>
          </div>

          {/* Stat 2 */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center gap-1.5 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="size-5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">WHO Z-Scores</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Sex-specific Growth Curves</div>
          </div>

          {/* Stat 3 */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center gap-1.5 border border-purple-200/60 dark:border-purple-900/40 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 text-purple-700 dark:text-purple-300">
              <Bot className="size-5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">3 Languages</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Sinhala, Tamil & English AI</div>
          </div>

          {/* Stat 4 */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center gap-1.5 border border-amber-200/60 dark:border-amber-900/40 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-700 dark:text-amber-300">
              <CalendarClock className="size-5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">MOH Clinics</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Organized visit timelines</div>
          </div>
        </div>
      </section>

      {/* ── Interactive Live Feature Showcase (Mini interactive demo on the page) ── */}
      <section className="max-w-5xl mx-auto w-full px-4 space-y-6" aria-labelledby="showcase-heading">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Interactive Experience
          </div>
          <h2 id="showcase-heading" className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Explore How SuwaDaru Cares
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Click across the core modules below to preview how caregivers experience the platform.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl glass-card max-w-2xl mx-auto overflow-x-auto shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("vaccines")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "vaccines"
                ? "bg-rose-600 text-white shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-rose-50/50 dark:hover:bg-rose-950/30"
            }`}
          >
            <Syringe className="size-4" />
            Vaccinations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("growth")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "growth"
                ? "bg-emerald-600 text-white shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <TrendingUp className="size-4" />
            WHO Growth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "ai"
                ? "bg-purple-600 text-white shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-purple-50/50 dark:hover:bg-purple-950/30"
            }`}
          >
            <Bot className="size-4" />
            SuwaDaru AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clinic")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "clinic"
                ? "bg-amber-600 text-white shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
            }`}
          >
            <CalendarClock className="size-4" />
            Clinic Visits
          </button>
        </div>

        {/* Tab Showcase Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xl transition-all duration-300">
          {activeTab === "vaccines" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md">
                    <Syringe className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Sri Lanka National Immunization Timeline</h3>
                    <p className="text-xs text-muted-foreground">Automated EPI milestones derived from Nethmi&apos;s birthdate (2025-08-15)</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <Check className="size-3.5" />
                  EPI 2023 Guidelines
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">At Birth • Completed</span>
                  <div className="text-sm font-bold text-foreground">BCG Vaccine</div>
                  <div className="text-xs text-muted-foreground">Tuberculosis protection administered at maternity hospital.</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">2 Months • Completed</span>
                  <div className="text-sm font-bold text-foreground">Pentavalent 1 + OPV 1</div>
                  <div className="text-xs text-muted-foreground">DTP, HepB, Hib & Oral Polio dose recorded by caregiver.</div>
                </div>
                <div className="rounded-2xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/70 dark:bg-rose-950/40 p-4 space-y-1.5 ring-2 ring-rose-400/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
                    9 Months • Scheduled
                  </span>
                  <div className="text-sm font-bold text-foreground">MMR 1 Vaccine</div>
                  <div className="text-xs text-rose-700/80 dark:text-rose-300/80">Measles, Mumps & Rubella milestone due at Panadura MOH.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "growth" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">WHO Weight-for-Age Standards</h3>
                    <p className="text-xs text-muted-foreground">Transparent sex-specific reference curves (+2SD to -2SD)</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Female 0–24 Months
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 rounded-2xl border bg-card/60 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Birth (3.2kg)</span>
                    <span>2 Months (5.1kg)</span>
                    <span>4 Months (6.4kg)</span>
                    <span>6 Months (7.3kg)</span>
                    <span className="font-bold text-emerald-600">8 Months (8.4kg)</span>
                  </div>
                  {/* Visual SVG Mini Trajectory Curve */}
                  <div className="h-28 w-full bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl relative overflow-hidden flex items-end px-4 pb-3">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 90">
                      {/* Upper +2SD band */}
                      <path d="M 0,80 Q 200,45 400,20" fill="none" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="4 4" />
                      {/* Median line */}
                      <path d="M 0,85 Q 200,55 400,35" fill="none" stroke="#10B981" strokeWidth="2.5" />
                      {/* Lower -2SD band */}
                      <path d="M 0,90 Q 200,70 400,55" fill="none" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="4 4" />
                      {/* Child trajectory */}
                      <path d="M 0,84 L 80,68 L 180,53 L 280,45 L 390,34" fill="none" stroke="#BE123C" strokeWidth="3" />
                      {/* Current dot */}
                      <circle cx="390" cy="34" r="5" fill="#BE123C" className="animate-pulse" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> WHO Median</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-600" /> Nethmi&apos;s Trajectory</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Green Zone (Healthy)</span>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/60 p-4 space-y-2 text-xs">
                  <div className="text-xs font-bold text-foreground">No Automated Diagnosis</div>
                  <p className="text-muted-foreground leading-relaxed">
                    SuwaDaru strictly adheres to clinical safety: a single measurement is never diagnostic. Trends are discussed during regular PHM clinic visits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">SuwaDaru AI (සුවදරු AI) Companion</h3>
                    <p className="text-xs text-muted-foreground">Trilingual, culturally grounded Sri Lankan child nutrition education</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                  Educational Simulator
                </span>
              </div>
              <div className="space-y-3 max-w-xl mx-auto">
                {/* Simulated User Bubble */}
                <div className="flex items-start gap-2.5 ml-auto justify-end max-w-[85%]">
                  <div className="rounded-2xl rounded-tr-xs bg-rose-600 text-white p-3 text-xs leading-relaxed shadow-sm">
                    මාස 8 බබාට අඩු වියදමකින් හදන්න පුළුවන් පෝෂ්‍යදායී කෑම මොනවාද?
                  </div>
                  <div className="size-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                    <User className="size-4" />
                  </div>
                </div>
                {/* Simulated AI Bubble */}
                <div className="flex items-start gap-2.5 mr-auto justify-start max-w-[90%]">
                  <div className="size-7 rounded-full overflow-hidden ring-1 ring-rose-300">
                    <img src="/suwadaru-logo.jpg" alt="SuwaDaru AI" className="size-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs bg-muted/80 text-foreground p-3.5 text-xs leading-relaxed shadow-sm space-y-1.5 border border-border/60">
                    <div className="font-semibold text-rose-700 dark:text-rose-300">සුවදරු AI (SuwaDaru AI):</div>
                    <p>ආයුබෝවන්! මාස 8ක් වන බබාට ගෙදරදීම සකස් කළ හැකි පෝෂ්‍යදායී ආහාර:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      <li>රතු කැකුළු බත් + පරිප්පු පොඩි කර (යකඩ හා ප්‍රෝටීන්)</li>
                      <li>තැම්බූ වට්ටක්කා හෝ බතල (විටමින් A)</li>
                      <li>කටු ඉවත් කළ මාළු කැබැල්ලක් හෝ බිත්තර කහ මදය</li>
                    </ul>
                    <p className="text-[10px] text-muted-foreground italic">⚠️ අවුරුද්දට අඩු බබාලාට ලුණු, සීනි හෝ මී පැණි එකතු නොකරන්න.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clinic" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">MOH Clinic Appointments</h3>
                    <p className="text-xs text-muted-foreground">Schedule visits and prepare questions for your Public Health Midwife</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  Panadura MOH
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Upcoming 9-Month Well-Child Clinic</span>
                    <span className="rounded-md bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200">Confirmed</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><Calendar className="size-3.5 text-amber-600" /> Wednesday, 10 Nov 2026 • 09:00 AM</div>
                    <div>Location: <strong>Panadura MOH Clinic Grounds</strong></div>
                    <div>Purpose: Routine growth assessment, MMR 1 immunization review, and feeding check.</div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/60 p-4 space-y-2 text-xs">
                  <div className="text-xs font-bold text-foreground">Attribution & Honest Previews</div>
                  <p className="text-muted-foreground leading-relaxed">
                    SuwaDaru features clear reminder previews without falsely claiming SMS or push notifications were dispatched. Everything is designed to make paper CHDR clinic visits seamless.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                <span>Automated EPI schedule milestones derived accurately from the child&apos;s birthdate.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Transparent weight-for-age charts matched to official WHO reference standards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
                <span>Safe nutrition education focusing on age-appropriate local foods and red-flag referrals.</span>
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
                EPI Immunization Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Track scheduled national vaccines from birth through 5 years. Clearly separates scheduled milestone due dates from unverified parent-reported doses.
            </CardContent>
          </Card>

          {/* Feature 2: Growth */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 shadow-2xs">
                <TrendingUp aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                WHO Growth Curves
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Weight-for-age trajectory plotted alongside WHO sex-specific standards with visible reference legends (+2SD to -2SD). No automated clinical diagnosis.
            </CardContent>
          </Card>

          {/* Feature 3: Nutrition */}
          <Card className="glass-card interactive-card flex flex-col justify-between">
            <CardHeader className="gap-3 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-800 dark:text-amber-300 border border-amber-200/50 shadow-2xs">
                <Salad aria-hidden className="size-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Local Nutrition Education
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explore safe complementary feeding guidance, texture transitions, and local Sri Lankan food examples. Automatically refers emergency symptoms to clinics.
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
            A frictionless demonstration flow without backend delays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card interactive-card flex flex-col items-center text-center p-5 rounded-2xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white font-extrabold text-sm shadow-md ring-2 ring-primary/20">
              1
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Select or Add a Profile</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use seeded demo children (Nethmi or Kavindu) or register a new fictional child with birthdate and sex for WHO standards.
            </p>
          </div>

          <div className="glass-card interactive-card flex flex-col items-center text-center p-5 rounded-2xl space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 text-white font-extrabold text-sm shadow-md ring-2 ring-primary/20">
              2
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Review Milestones & Health</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inspect immunization due dates, track child weight, and review age-specific nutrition advice tailored to Sri Lankan families.
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
                The physical, family-held <strong>Child Health Development Record (CHDR)</strong> and guidance from your Public Health Midwife (PHM) or medical doctor remain the sole authoritative clinical records. All demo data is fictional and stored locally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section className="text-center max-w-xl mx-auto px-4 space-y-4 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Ready to experience the demo?
        </h2>
        <p className="text-sm text-muted-foreground">
          Start exploring with instant fictional accounts and pre-seeded child profiles.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Button
            asChild
            size="lg"
            className="btn-premium w-full sm:w-auto min-h-12 px-7 text-base font-semibold gap-2.5 rounded-xl group shadow-lg"
          >
            <Link to={routes.register}>
              Get Started with Demo
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

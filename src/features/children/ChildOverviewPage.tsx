import { useState, useEffect, type FormEvent } from "react"
import { Link } from "react-router"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Edit2,
  Loader2,
  Printer,
  Salad,
  ShieldAlert,
  Syringe,
  TrendingUp,
  X,
} from "lucide-react"
import type { ChildFeaturePageProps } from "@/types"
import { mockChildService } from "@/services/mock-child-service"
import { useLanguage } from "@/hooks/useLanguage"
import { ChildReportModal } from "@/features/reports/ChildReportModal"
import { useChild } from "./useChild"
import { routes } from "@/app/routes"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { NotFoundPage } from "@/components/layout/NotFoundPage"
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  calculateAge,
  getTodayIsoDate,
  validateBirthWeight,
  validateChildDob,
  validateChildName,
  validateChildSex,
  type ChildFormErrors,
  type ChildFormValues,
} from "./validation"

export function ChildOverviewPage({ childId }: ChildFeaturePageProps) {
  const { updateChild } = useChild()
  const { t } = useLanguage()

  const [child, setChild] = useState<Awaited<ReturnType<typeof mockChildService.get>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Edit form state
  const [form, setForm] = useState<ChildFormValues>({
    name: "",
    dateOfBirth: "",
    sex: "female",
    birthWeightKg: "",
    clinicName: "",
  })
  const [errors, setErrors] = useState<ChildFormErrors>({})

  // Fetch child record directly by id to guarantee zero stale data from other children
  useEffect(() => {
    let mounted = true

    mockChildService
      .get(childId)
      .then((data) => {
        if (mounted) {
          setChild(data)
          setNotFound(false)
          setIsEditing(false)
          setForm({
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            sex: data.sex,
            birthWeightKg:
              data.birthWeightKg !== undefined
                ? String(data.birthWeightKg)
                : "",
            clinicName: data.clinicName || "",
          })
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setNotFound(true)
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [childId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl" role="status" aria-live="polite">
        <PageHeader title="Loading child profile..." />
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  // Safe 404 handling per FR-011 and T-05
  if (notFound || !child) {
    return (
      <NotFoundPage
        title="Child profile not found"
        description={`The requested child profile "${childId}" does not exist in the fictional demo records.`}
        homeTo={routes.dashboard}
        homeLabel="Return to Dashboard"
      />
    )
  }

  const age = calculateAge(child.dateOfBirth)
  const todayIso = getTodayIsoDate()

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nameErr = validateChildName(form.name)
    const dobErr = validateChildDob(form.dateOfBirth)
    const sexErr = validateChildSex(form.sex)
    const weightErr = validateBirthWeight(form.birthWeightKg)

    if (nameErr || dobErr || sexErr || weightErr) {
      setErrors({
        name: nameErr || undefined,
        dateOfBirth: dobErr || undefined,
        sex: sexErr || undefined,
        birthWeightKg: weightErr || undefined,
      })
      return
    }

    setErrors({})
    setIsSaving(true)

    try {
      const parsedWeight =
        form.birthWeightKg.trim() !== ""
          ? Number(form.birthWeightKg)
          : undefined

      const updated = await updateChild(child.id, {
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        sex: form.sex,
        birthWeightKg: parsedWeight,
        clinicName: form.clinicName.trim() || undefined,
      })

      setChild(updated)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setErrors({ form: "Failed to update profile. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title={child.name}
        subtitle={`Child profile • Born ${child.dateOfBirth} (${age.text})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportModal(true)}
              className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
            >
              <Printer aria-hidden className="size-4" />
              {t("common.chdrReport")}
            </Button>

            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 aria-hidden className="size-4" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setErrors({})
                }}
                className="gap-2"
              >
                <X aria-hidden className="size-4" />
                Cancel Editing
              </Button>
            )}
          </div>
        }
      />

      <ChildReportModal
        childId={child.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Demo Warning Notice */}
      <div
        role="region"
        aria-label="Demo record notice"
        className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert aria-hidden className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span>
            <strong>Fictional Demo Profile:</strong> This record contains synthetic
            data for preview purposes. No real medical or identity data is stored.
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary"
        >
          <CheckCircle2 aria-hidden className="size-4 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Profile Overview Stats */}
      {!isEditing ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard
              label="Age"
              value={age.text}
              detail={`Born on ${child.dateOfBirth}`}
            />
            <StatCard
              label="Sex / Reference"
              value={child.sex === "female" ? "Female" : "Male"}
              detail={`WHO Standards: ${child.sex === "female" ? "Girls" : "Boys"}`}
            />
            <StatCard
              label="Birth Weight"
              value={
                child.birthWeightKg !== undefined
                  ? `${child.birthWeightKg} kg`
                  : "Not recorded"
              }
              detail="Measured at birth"
            />
            <StatCard
              label="MOH Clinic"
              value={child.clinicName || "Unassigned"}
              detail="Primary clinic"
            />
          </div>

          {/* Child Health Modules Navigation Grid */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-foreground">
              Health Record Modules for {child.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Immunization */}
              <Link
                to={routes.vaccinations(child.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    <Syringe aria-hidden className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Vaccination Timeline
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sri Lanka EPI schedule milestones derived from birthdate.
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  View Schedule →
                </div>
              </Link>

              {/* Growth */}
              <Link
                to={routes.growth(child.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <TrendingUp aria-hidden className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Growth Monitoring
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Weight-for-age charts matched with {child.sex} WHO standards.
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Open Growth Tracker →
                </div>
              </Link>

              {/* Nutrition */}
              <Link
                to={routes.nutrition(child.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Salad aria-hidden className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Feeding & Nutrition
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Age-appropriate feeding education and local Sri Lankan food guidance.
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Start Nutrition Chat →
                </div>
              </Link>

              {/* Appointments */}
              <Link
                to={routes.appointments(child.id)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    <CalendarClock aria-hidden className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Clinic Appointments
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Manage upcoming MOH clinic dates and reminders.
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs font-medium text-primary">
                  Manage Visits →
                </div>
              </Link>
            </div>
          </div>
        </>
      ) : (
        /* Edit Demographic Fields Form */
        <Card className="border-border/80 shadow-md">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-bold text-foreground">
              Edit Child Demographics
            </CardTitle>
            <CardDescription>
              Update demographic fields for {child.name}. Modifications persist in demo memory.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSaveEdit} noValidate>
            <CardContent className="space-y-4 pt-6">
              {errors.form && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertCircle aria-hidden className="size-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Child Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Child&apos;s Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }))
                    }
                  }}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-dob" className="text-sm font-medium">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-dob"
                  type="date"
                  max={todayIso}
                  value={form.dateOfBirth}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                    if (errors.dateOfBirth) {
                      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }))
                    }
                  }}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                />
                {errors.dateOfBirth && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Sex */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Sex (WHO Growth Standards) <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sex">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.sex === "female"}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, sex: "female" }))
                    }}
                    className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                      form.sex === "female"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    Female (WHO Girls)
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.sex === "male"}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, sex: "male" }))
                    }}
                    className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                      form.sex === "male"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    Male (WHO Boys)
                  </button>
                </div>
              </div>

              {/* Birth Weight */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-weight" className="text-sm font-medium">
                  Birth Weight (kg)
                </Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10.0"
                  placeholder="Optional"
                  value={form.birthWeightKg}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, birthWeightKg: e.target.value }))
                    if (errors.birthWeightKg) {
                      setErrors((prev) => ({ ...prev, birthWeightKg: undefined }))
                    }
                  }}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.birthWeightKg)}
                />
                {errors.birthWeightKg && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.birthWeightKg}
                  </p>
                )}
              </div>

              {/* Clinic Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-clinic" className="text-sm font-medium">
                  Assigned MOH Clinic
                </Label>
                <Input
                  id="edit-clinic"
                  type="text"
                  placeholder="Optional"
                  value={form.clinicName}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, clinicName: e.target.value }))
                  }}
                  disabled={isSaving}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setIsEditing(false)
                  setErrors({})
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}

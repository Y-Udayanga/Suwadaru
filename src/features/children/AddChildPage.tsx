import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import {
  AlertCircle,
  ArrowLeft,
  Baby,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react"
import { useChild } from "./useChild"
import { routes } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getTodayIsoDate,
  validateBirthWeight,
  validateChildDob,
  validateChildName,
  validateChildSex,
  type ChildFormErrors,
  type ChildFormValues,
} from "./validation"

import { useLanguage } from "@/hooks/useLanguage"

export function AddChildPage() {
  const navigate = useNavigate()
  const { addChild } = useChild()
  const { language } = useLanguage()
  const isSi = language === "si"

  const [form, setForm] = useState<ChildFormValues>({
    name: "",
    dateOfBirth: "",
    sex: "female",
    birthWeightKg: "",
    clinicName: "",
  })

  const [errors, setErrors] = useState<ChildFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedChildName, setSavedChildName] = useState<string | null>(null)

  const todayIso = getTodayIsoDate()


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate fields
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
    setIsSubmitting(true)

    try {
      const parsedWeight =
        form.birthWeightKg.trim() !== ""
          ? Number(form.birthWeightKg)
          : undefined

      const newChild = await addChild({
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        sex: form.sex,
        birthWeightKg: parsedWeight,
        clinicName: form.clinicName.trim() || undefined,
      })

      setSavedChildName(newChild.name)

      // Short delay for feedback before redirecting to child overview
      setTimeout(() => {
        void navigate(routes.child(newChild.id))
      }, 700)
    } catch {
      setErrors({
        form: "Failed to create child profile. Please check the entered fields.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <PageHeader
        title={isSi ? "නව ළමා පැතිකඩක් එක් කරන්න" : "Add Child Profile"}
        subtitle={
          isSi
            ? "එන්නත් කාලසටහන් සහ වර්ධන වක්‍ර සඳහා ඔබේ දරුවාගේ තොරතුරු සටහන් කරන්න."
            : "Record a child profile to track EPI immunization schedules and WHO growth curves."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate(routes.dashboard)}
            className="gap-2"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {isSi ? "ආපසු ප්‍රධාන පුවරුවට" : "Back to Dashboard"}
          </Button>
        }
      />

      {/* Prominent Sample Data Privacy Notice */}
      <div
        role="region"
        aria-label="Profile privacy notice"
        className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/60 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            <ShieldAlert aria-hidden className="size-4" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {isSi ? "ළමා පැතිකඩ රහස්‍යතාව" : "Child profile privacy"}
            </p>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              {isSi
                ? "මෙම පැතිකඩ සඳහා අවශ්‍ය තොරතුරු පමණක් ඇතුළත් කරන්න. සටහන් ඔබේ ගිණුම හා සම්බන්ධිතව සුරක්ෂිතව පවතී."
                : "Enter only the information needed for this profile. Records are accessible to authorized caregivers linked to the child."}
            </p>
          </div>
        </div>
      </div>

      {savedChildName ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <CheckCircle2 aria-hidden className="size-10 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">
            {isSi ? "ළමා පැතිකඩ සාර්ථකව සාදන ලදි!" : "Child Profile Created!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSi ? (
              <>
                <strong>{savedChildName}</strong> දරුවාගේ පැතිකඩ සුරකින ලදි. දළ විශ්ලේෂණය පූරණය වෙමින්...
              </>
            ) : (
              <>
                Profile for <strong>{savedChildName}</strong> has been saved. Loading child overview...
              </>
            )}
          </p>
        </div>
      ) : (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="gap-2 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Baby aria-hidden className="size-5 text-primary" />
                {isSi ? "ළමා තොරතුරු (Demographics)" : "Child Demographics"}
              </CardTitle>

            </div>
            <CardDescription>
              {isSi
                ? "උපන් දිනය සහ ස්ත්‍රී/පුරුෂ භාවය මත පදනම්ව WHO වර්ධන වක්‍ර සහ EPI එන්නත් කාලසටහන ස්වයංක්‍රීයව ගණනය කෙරේ."
                : "Birth date and sex determine WHO growth reference curves and EPI milestone calculations."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-5 pt-6">
              {errors.form && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertCircle aria-hidden className="size-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Fictional Child Name */}
              <div className="space-y-1.5">
                <Label htmlFor="child-name" className="text-sm font-medium">
                  Child&apos;s Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="child-name"
                  name="name"
                  type="text"
                  placeholder="Child’s name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }))
                    }
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "child-name-error" : undefined}
                />
                {errors.name && (
                  <p
                    id="child-name-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="child-dob" className="text-sm font-medium">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Must not be in the future
                  </span>
                </div>
                <Input
                  id="child-dob"
                  name="dateOfBirth"
                  type="date"
                  max={todayIso}
                  value={form.dateOfBirth}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                    if (errors.dateOfBirth) {
                      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }))
                    }
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  aria-describedby={
                    errors.dateOfBirth ? "child-dob-error" : "child-dob-hint"
                  }
                />
                <p id="child-dob-hint" className="text-xs text-muted-foreground">
                  ISO format YYYY-MM-DD. Drives the National Immunization Programme schedule.
                </p>
                {errors.dateOfBirth && (
                  <p
                    id="child-dob-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Sex Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Sex (for WHO Growth Reference Standards) <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Child sex">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.sex === "female"}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, sex: "female" }))
                      if (errors.sex) {
                        setErrors((prev) => ({ ...prev, sex: undefined }))
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      form.sex === "female"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent text-foreground"
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
                      if (errors.sex) {
                        setErrors((prev) => ({ ...prev, sex: undefined }))
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      form.sex === "male"
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent text-foreground"
                    }`}
                  >
                    Male (WHO Boys)
                  </button>
                </div>
                {errors.sex && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.sex}
                  </p>
                )}
              </div>

              {/* Birth Weight (optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="child-weight" className="text-sm font-medium">
                    Birth Weight (kg)
                  </Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Input
                  id="child-weight"
                  name="birthWeightKg"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10.0"
                  placeholder="e.g. 3.1"
                  value={form.birthWeightKg}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, birthWeightKg: e.target.value }))
                    if (errors.birthWeightKg) {
                      setErrors((prev) => ({ ...prev, birthWeightKg: undefined }))
                    }
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.birthWeightKg)}
                  aria-describedby={
                    errors.birthWeightKg ? "child-weight-error" : undefined
                  }
                />
                {errors.birthWeightKg && (
                  <p
                    id="child-weight-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.birthWeightKg}
                  </p>
                )}
              </div>

              {/* Clinic Name (optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="child-clinic" className="text-sm font-medium">
                    Assigned MOH Clinic / Hospital
                  </Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Input
                  id="child-clinic"
                  name="clinicName"
                  type="text"
                  placeholder="e.g. Maharagama MOH Clinic"
                  value={form.clinicName}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, clinicName: e.target.value }))
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void navigate(routes.dashboard)}
                className="w-full sm:w-auto"
              >
                {isSi ? "අවලංගු කරන්න" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-32 btn-premium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    {isSi ? "සුරැකෙමින්…" : "Saving profile..."}
                  </span>
                ) : (
                  isSi ? "දරුවාගේ පැතිකඩ සුරකින්න" : "Save Child Profile"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}

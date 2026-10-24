import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2 } from "lucide-react"
import { routes } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard } from "./components/AuthCard"
import { DemoBanner } from "./components/DemoBanner"
import { validateEmail, type ForgotPasswordFormErrors } from "./validation"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [simulatedFor, setSimulatedFor] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 350))

    setIsSubmitting(false)
    setSimulatedFor(email.trim())
  }

  return (
    <AuthCard
      title="Recovery Preview"
      description="Password recovery UI demonstration."
      footer={
        <div className="flex flex-col items-center gap-2 text-xs sm:text-sm">
          <div>
            Remembered your credentials?{" "}
            <Link
              to={routes.login}
              className="font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Back to Sign In
            </Link>
          </div>
          <div className="text-muted-foreground">
            <Link
              to={routes.home}
              className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Back to Home
            </Link>
          </div>
        </div>
      }
    >
      <DemoBanner />

      {/* Explicit No-Email Disclaimer */}
      <div
        role="note"
        aria-label="Recovery notice"
        className="rounded-lg border border-blue-200/80 bg-blue-50/80 p-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
      >
        <div className="flex items-start gap-2">
          <Info aria-hidden className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <p className="font-semibold">
              UI Preview Only — SuwaDaru does not send emails
            </p>
            <p className="text-blue-800/90 dark:text-blue-300/80 leading-relaxed">
              This screen demonstrates the password recovery interface. In this
              prototype, no real recovery emails or reset tokens are dispatched.
            </p>
          </div>
        </div>
      </div>

      {simulatedFor ? (
        /* Simulated Confirmation Card — Honesty Guarantee per FR-005 */
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <CheckCircle2 aria-hidden className="size-5" />
            <span>Simulated Request Recorded</span>
          </div>

          <p className="text-xs text-foreground/80 leading-relaxed">
            A recovery request was simulated for{" "}
            <strong className="font-mono text-foreground">{simulatedFor}</strong>.
          </p>

          <p className="text-xs text-muted-foreground leading-relaxed">
            As this is a prototype, <strong>no email was dispatched</strong>. In
            demo mode, you can sign in directly with any sample credentials on the
            sign-in screen.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              className="w-full min-h-11 gap-2"
              onClick={() => void navigate(routes.login)}
            >
              <ArrowLeft aria-hidden className="size-4" />
              Return to Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-11"
              onClick={() => {
                setSimulatedFor(null)
                setEmail("")
              }}
            >
              Test Another Address
            </Button>
          </div>
        </div>
      ) : (
        /* Form view */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-sm font-medium">
              Registered Email Address
            </Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "forgot-email-error" : undefined}
            />
            {errors.email && (
              <p
                id="forgot-email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>

          {errors.form && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle aria-hidden className="size-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-11 text-base font-medium shadow-sm transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Simulating reset preview...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Simulate Reset Preview
                <ArrowRight aria-hidden className="size-4" />
              </span>
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { routes } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard } from "./components/AuthCard"
import { DemoBanner } from "./components/DemoBanner"
import { PasswordInput } from "./components/PasswordInput"
import { useAuth } from "./useAuth"
import {
  validateConfirmPassword,
  validateDisplayName,
  validateEmail,
  validatePassword,
  type RegisterFormErrors,
} from "./validation"

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickFill = () => {
    setDisplayName("Priyantha Perera")
    setEmail("priyantha.demo@example.com")
    setPassword("suwadaru2026")
    setConfirmPassword("suwadaru2026")
    setErrors({})
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Run field validations
    const nameError = validateDisplayName(displayName)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(password, confirmPassword)

    if (nameError || emailError || passwordError || confirmError) {
      setErrors({
        displayName: nameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
        confirmPassword: confirmError || undefined,
      })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      // Create safe demo session with user-specified caregiver display name
      await register(displayName.trim())

      // Per User Journey J-01: First-time parent creates demo account and lands on dashboard
      void navigate(routes.dashboard, { replace: true })
    } catch {
      setErrors({
        form: "Could not create demo account. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Create Demo Account"
      description="Start exploring SuwaDaru child health records."
      footer={
        <div className="flex flex-col items-center gap-2 text-xs sm:text-sm">
          <div>
            Already have a demo account?{" "}
            <Link
              to={routes.login}
              className="font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Sign in
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

      {/* Quick Fill Button */}
      <button
        type="button"
        onClick={handleQuickFill}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2 px-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Sparkles aria-hidden className="size-3.5" />
        Fill sample registration details
      </button>

      {/* Form-level error */}
      {errors.form && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Caregiver Name */}
        <div className="space-y-1.5">
          <Label htmlFor="register-name" className="text-sm font-medium">
            Caregiver / Parent Name
          </Label>
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Priyantha Perera"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              if (errors.displayName) {
                setErrors((prev) => ({ ...prev, displayName: undefined }))
              }
            }}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "register-name-error" : undefined}
          />
          {errors.displayName && (
            <p
              id="register-name-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Fictional Email */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="register-email" className="text-sm font-medium">
              Email Address
            </Label>
            <span className="text-xs text-muted-foreground">Demo only</span>
          </div>
          <Input
            id="register-email"
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
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
          {errors.email && (
            <p
              id="register-email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="register-password" className="text-sm font-medium">
            Password
          </Label>
          <PasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            disabled={isSubmitting}
            error={errors.password}
            errorId="register-password-error"
          />
          {errors.password && (
            <p
              id="register-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="register-confirm-password" className="text-sm font-medium">
            Confirm Password
          </Label>
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }
            }}
            disabled={isSubmitting}
            error={errors.confirmPassword}
            errorId="register-confirm-error"
          />
          {errors.confirmPassword && (
            <p
              id="register-confirm-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-11 text-base font-medium shadow-sm transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Creating demo account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Demo Account
              <ArrowRight aria-hidden className="size-4" />
            </span>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}

import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { routes } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard } from "./components/AuthCard"
import { DemoBanner } from "./components/DemoBanner"
import { PasswordInput } from "./components/PasswordInput"
import { useAuth } from "./useAuth"
import { validateIdentifier, validatePassword, type LoginFormErrors } from "./validation"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, session, logout } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect destination after successful login
  const fromLocation =
    (location.state as { from?: string } | null)?.from || routes.dashboard

  // If already authenticated, offer instant navigation or switch
  if (isAuthenticated && session) {
    return (
      <AuthCard
        title="Welcome back"
        description="You have an active demo caregiver session."
      >
        <DemoBanner variant="compact" />

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="text-muted-foreground">Signed in as:</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {session.displayName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fictional Demo Account ({session.caregiverId})
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            className="w-full min-h-11 gap-2"
            onClick={() => void navigate(fromLocation)}
          >
            Continue to Dashboard
            <ArrowRight aria-hidden className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full min-h-11"
            onClick={() => void logout()}
          >
            Sign out of this demo
          </Button>
        </div>
      </AuthCard>
    )
  }

  const handleQuickFill = () => {
    setIdentifier("demo.parent@example.com")
    setPassword("demo1234")
    setErrors({})
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Run inline validations
    const identifierError = validateIdentifier(identifier)
    const passwordError = validatePassword(password)

    if (identifierError || passwordError) {
      setErrors({
        identifier: identifierError || undefined,
        password: passwordError || undefined,
      })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      // Derive a friendly display name from the entered identifier
      const cleanIdentifier = identifier.trim()
      const displayName = cleanIdentifier.includes("@")
        ? cleanIdentifier.split("@")[0].replace(/[._-]/g, " ")
        : cleanIdentifier

      // Capitalize first letters of words for a polished demo experience
      const formattedName = displayName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")

      await login(formattedName || "Demo Parent")
      void navigate(fromLocation, { replace: true })
    } catch {
      setErrors({
        form: "Could not initialize demo session. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Sign in to SuwaDaru"
      description="Enter any fictional credentials to explore the demo."
      footer={
        <div className="flex flex-col items-center gap-2 text-xs sm:text-sm">
          <div>
            Don&apos;t have a demo account?{" "}
            <Link
              to={routes.register}
              className="font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Create demo account
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

      {/* Quick Fill Preset Button */}
      <button
        type="button"
        onClick={handleQuickFill}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2 px-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Sparkles aria-hidden className="size-3.5" />
        Fill sample credentials (instant test)
      </button>

      {/* Form Error Banner */}
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
        {/* Email / Username Field */}
        <div className="space-y-1.5">
          <Label htmlFor="login-identifier" className="text-sm font-medium">
            Email or Demo Username
          </Label>
          <Input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="e.g. parent@example.com or Demo Parent"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value)
              if (errors.identifier) {
                setErrors((prev) => ({ ...prev, identifier: undefined }))
              }
            }}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
          />
          {errors.identifier && (
            <p
              id="login-identifier-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              to={routes.forgotPassword}
              tabIndex={0}
              className="text-xs text-muted-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter at least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            disabled={isSubmitting}
            error={errors.password}
            errorId="login-password-error"
          />
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password}
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
              Signing in to demo...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In to Demo
              <ArrowRight aria-hidden className="size-4" />
            </span>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}

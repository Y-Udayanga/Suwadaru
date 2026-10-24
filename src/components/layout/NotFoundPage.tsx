import { Link, useNavigate } from "react-router"
import { House, ArrowLeft, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/app/routes"

/**
 * NotFoundPage
 *
 * Displayed for any unmatched route (404 equivalent) and for child-scoped
 * routes where the childId param is missing or invalid.
 *
 * Provides three accessible return actions:
 *   1. Go back — browser back() if history exists
 *   2. Dashboard — jump to /dashboard
 *   3. Home — jump to /
 *
 * No clinical content. No health-status inference. Safe empty state.
 */
interface NotFoundPageProps {
  title?: string
  description?: string
  homeTo?: string
  homeLabel?: string
}

export function NotFoundPage({
  title = "Page not found",
  description = "The address you entered does not match a SuwaDaru screen. If you were looking for a child's record, check that the child ID in the URL is correct.",
  homeTo = routes.dashboard,
  homeLabel = "Dashboard",
}: NotFoundPageProps = {}) {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      void navigate(routes.home)
    }
  }

  return (
    <div className="flex min-h-[70svh] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        {/* Illustration */}
        <div className="relative flex size-28 items-center justify-center">
          {/* Outer decorative rings */}
          <span className="absolute inset-0 rounded-full bg-primary/5 animate-[ping_3s_ease-in-out_infinite] motion-reduce:animate-none" />
          <span className="absolute inset-3 rounded-full bg-primary/10" />
          {/* Inner icon */}
          <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/15">
            <svg
              aria-hidden="true"
              className="size-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <p className="text-5xl font-black tracking-tight text-primary/20 select-none">
            404
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground text-balance">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="lg"
            className="min-h-11 gap-2"
            id="not-found-back"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Go back
          </Button>

          <Button
            asChild
            size="lg"
            className="min-h-11 gap-2"
            id="not-found-dashboard"
          >
            <Link to={homeTo}>
              <LayoutDashboard aria-hidden className="size-4" />
              {homeLabel}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-11 gap-2"
            id="not-found-home"
          >
            <Link to={routes.home}>
              <House aria-hidden className="size-4" />
              Home
            </Link>
          </Button>
        </div>

        {/* Safety footnote */}
        <p className="text-xs text-muted-foreground/70">
          SuwaDaru is a fictional demonstration. No health records are stored
          at unrecognised addresses.
        </p>
      </div>
    </div>
  )
}

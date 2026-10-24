import { useNavigate } from "react-router"
import { LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { demoCaregiver } from "@/data/mock"
import { routes } from "@/app/routes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

/**
 * UserMenuButton
 *
 * A placeholder user menu that shows the demo caregiver's initials and a
 * sign-out action. In F0 there is no real session — sign-out redirects to
 * the login screen only.
 *
 * Props:
 *   collapsed?: boolean  — sidebar collapsed icon-only mode (default false)
 *   compact?:   boolean  — mobile top-bar compact variant (default false)
 *
 * Frontend B must not modify this component. When the real auth session
 * (B1) is integrated, a context provider will slot in here.
 */

interface UserMenuButtonProps {
  collapsed?: boolean
  compact?: boolean
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenuButton({
  collapsed = false,
  compact = false,
}: UserMenuButtonProps) {
  const navigate = useNavigate()
  const initials = getInitials(demoCaregiver.displayName)

  // Mobile compact: avatar only (no text) — sign out from drawer
  if (compact) {
    return (
      <div
        aria-label={`Signed in as ${demoCaregiver.displayName} (demo)`}
        role="img"
        className="flex size-9 items-center justify-center"
      >
        <Avatar size="default">
          <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  // Sidebar collapsed: avatar icon only
  if (collapsed) {
    return (
      <button
        type="button"
        aria-label={`Signed in as ${demoCaregiver.displayName} — sign out`}
        onClick={() => void navigate(routes.login)}
        className={cn(
          "flex size-11 items-center justify-center rounded-lg",
          "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "transition-colors",
        )}
      >
        <Avatar size="default">
          <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    )
  }

  // Full expanded state (desktop top bar / mobile drawer footer)
  return (
    <div className="flex w-full items-center gap-3">
      <Avatar size="default">
        <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {demoCaregiver.displayName}
        </span>
        <span className="text-xs text-muted-foreground">Demo account</span>
      </div>

      <button
        type="button"
        aria-label="Sign out of demo account"
        onClick={() => void navigate(routes.login)}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          "text-muted-foreground hover:bg-accent hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "transition-colors",
        )}
      >
        <LogOut aria-hidden className="size-4" />
      </button>
    </div>
  )
}

// Also export a standalone icon-only variant for the desktop top bar
export function UserIcon() {
  return <User aria-hidden className="size-4" />
}

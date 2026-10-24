import { useState, useRef, useEffect } from "react"
import { Link } from "react-router"
import { Baby, Check, ChevronDown, Plus, Sparkles } from "lucide-react"
import { useChild } from "../useChild"
import { routes } from "@/app/routes"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChildSwitcherProps {
  collapsed?: boolean
  compact?: boolean
  onSelect?: () => void
  className?: string
}

export function ChildSwitcher({
  collapsed = false,
  compact = false,
  onSelect,
  className,
}: ChildSwitcherProps) {
  const { children, selectedChildId, selectChild, isLoading } = useChild()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (isLoading && children.length === 0) {
    return (
      <div className="flex h-11 items-center gap-2 px-3 text-xs text-muted-foreground animate-pulse">
        <Baby aria-hidden className="size-4" />
        <span>Loading profiles...</span>
      </div>
    )
  }

  // Collapsed sidebar icon-only mode
  if (collapsed) {
    return (
      <div ref={dropdownRef} className="relative flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={`Current child: ${activeChild?.name || "None"}. Click to switch.`}
          aria-expanded={isOpen}
          className={cn(
            "flex size-11 items-center justify-center rounded-lg border border-border/80 bg-accent/40",
            "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "transition-colors",
            className,
          )}
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
              {activeChild?.name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-label="Select Child"
            className="absolute top-0 left-14 z-50 min-w-56 rounded-xl border border-border bg-card p-1 shadow-xl"
          >
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              Switch Child
            </div>
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  selectChild(child.id)
                  setIsOpen(false)
                  onSelect?.()
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                  child.id === activeChild?.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent text-foreground",
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                    {child.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="font-medium text-foreground">{child.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {child.sex} • {child.dateOfBirth}
                  </p>
                </div>
                {child.id === activeChild?.id && (
                  <Check aria-hidden className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <Link
              to={routes.newChild}
              onClick={() => {
                setIsOpen(false)
                onSelect?.()
              }}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus aria-hidden className="size-3.5" />
              Add Another Child
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Current child: ${activeChild?.name || "Select child"}. Click to switch child.`}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/80 p-2.5 text-left shadow-xs",
          "hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "transition-all",
          compact && "p-1.5",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar size={compact ? "sm" : "default"}>
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
              {activeChild?.name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">
                {activeChild?.name || "Select Child"}
              </span>
              <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {activeChild?.sex || ""}
              </span>
            </div>
            {!compact && (
              <p className="truncate text-xs text-muted-foreground">
                Born {activeChild?.dateOfBirth}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Select Child Profile"
          className="absolute top-full left-0 z-50 mt-1.5 w-full min-w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="font-semibold">Switch Child Profile</span>
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <Sparkles aria-hidden className="size-3" />
              Demo Records
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {children.map((child) => {
              const isSelected = child.id === activeChild?.id
              return (
                <button
                  key={child.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    selectChild(child.id)
                    setIsOpen(false)
                    onSelect?.()
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-foreground",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {child.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="font-semibold leading-tight text-foreground">
                      {child.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {child.sex} • Born {child.dateOfBirth}
                    </p>
                  </div>
                  {isSelected && (
                    <Check
                      aria-hidden
                      className="size-4 shrink-0 text-primary"
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="my-1.5 border-t border-border" />

          <Link
            to={routes.newChild}
            onClick={() => {
              setIsOpen(false)
              onSelect?.()
            }}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus aria-hidden className="size-3.5" />
            Add Another Child Profile
          </Link>
        </div>
      )}
    </div>
  )
}

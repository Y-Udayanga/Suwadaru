import { useState, useId, forwardRef, type ComponentProps } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PasswordInputProps extends Omit<ComponentProps<"input">, "type"> {
  error?: string
  errorId?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, errorId, disabled, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const generatedId = useId()
    const inputId = id || generatedId
    const resolvedErrorId = errorId || `${inputId}-error`

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          id={inputId}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? resolvedErrorId : undefined}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          tabIndex={0}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground",
            "hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
            "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {showPassword ? (
            <EyeOff aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = "PasswordInput"

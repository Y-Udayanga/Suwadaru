/**
 * AmbientBackground — Premium Pediatric Health Theme
 *
 * Visibly captivating, high-aesthetic animated ambient background:
 * - Visibly defined floating gradient spheres with smooth orbital drift.
 * - Gentle glowing healthcare & maternal stars / heart / sparkle dust.
 * - Perfectly balanced contrast and opacity for both Light & Dark modes.
 * - Respects prefers-reduced-motion and zero interaction interference.
 */

import { memo } from "react"
import { cn } from "@/lib/utils"

export const AmbientBackground = memo(function AmbientBackground({
  className,
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none",
        className,
      )}
    >
      {/* ── 1. Vibrant Floating Ambient Gradient Orbs ── */}
      {/* Primary Rose Aura (Top Left) */}
      <div
        className={cn(
          "absolute -top-16 -left-16 size-[380px] sm:size-[520px] rounded-full",
          "bg-gradient-to-br from-rose-400/40 via-pink-400/30 to-amber-300/20",
          "dark:from-rose-600/30 dark:via-rose-900/35 dark:to-purple-950/20",
          "blur-[50px] sm:blur-[75px]",
          "animate-ambient-1",
        )}
      />

      {/* Warm Golden Honey Aura (Top Right) */}
      <div
        className={cn(
          "absolute top-[5%] -right-20 size-[340px] sm:size-[480px] rounded-full",
          "bg-gradient-to-bl from-amber-400/35 via-orange-300/25 to-rose-300/20",
          "dark:from-amber-500/25 dark:via-amber-900/30 dark:to-transparent",
          "blur-[45px] sm:blur-[70px]",
          "animate-ambient-2",
        )}
      />

      {/* Calming Pediatric Teal Aura (Center / Left) */}
      <div
        className={cn(
          "absolute top-[45%] -left-24 size-[320px] sm:size-[450px] rounded-full",
          "bg-gradient-to-tr from-teal-400/30 via-emerald-300/20 to-transparent",
          "dark:from-teal-600/20 dark:via-emerald-950/25 dark:to-transparent",
          "blur-[50px] sm:blur-[80px]",
          "animate-ambient-3",
        )}
      />

      {/* Soft Violet & Rose Warmth (Bottom Right) */}
      <div
        className={cn(
          "absolute -bottom-20 -right-16 size-[400px] sm:size-[550px] rounded-full",
          "bg-gradient-to-tl from-rose-400/35 via-pink-300/25 to-teal-300/20",
          "dark:from-rose-700/25 dark:via-purple-950/30 dark:to-pink-900/20",
          "blur-[55px] sm:blur-[85px]",
          "animate-ambient-1",
        )}
      />

      {/* Floating Center Subtle Orb */}
      <div
        className={cn(
          "absolute top-[35%] left-[45%] size-[260px] sm:size-[380px] rounded-full",
          "bg-gradient-to-r from-pink-300/20 via-amber-200/25 to-rose-200/20",
          "dark:from-rose-900/20 dark:via-amber-900/15 dark:to-rose-950/15",
          "blur-[40px] sm:blur-[65px]",
          "animate-ambient-2",
        )}
      />

      {/* ── 2. Subtle Geometric Grid Pattern with Radial Vignette ── */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.045] dark:opacity-[0.08]",
          "[background-image:radial-gradient(currentColor_1.5px,transparent_1.5px)]",
          "[background-size:28px_28px]",
          "[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]",
        )}
      />

      {/* ── 3. Floating Sparkle / Care Icons (Floating Animation) ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft Health Sparkle 1 */}
        <div
          className="absolute top-[18%] left-[12%] animate-ambient-sparkle"
          style={{ animationDuration: "6s", animationDelay: "0s" }}
        >
          <svg className="size-5 text-rose-400 dark:text-rose-300 opacity-60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>

        {/* Soft Health Sparkle 2 */}
        <div
          className="absolute top-[28%] right-[15%] animate-ambient-sparkle"
          style={{ animationDuration: "7.5s", animationDelay: "2s" }}
        >
          <svg className="size-4 text-amber-400 dark:text-amber-300 opacity-60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>

        {/* Soft Heart Care Icon */}
        <div
          className="absolute top-[62%] right-[10%] animate-ambient-sparkle"
          style={{ animationDuration: "8s", animationDelay: "1s" }}
        >
          <svg className="size-5 text-rose-400 dark:text-rose-300 opacity-45" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        {/* Soft Sparkle 3 */}
        <div
          className="absolute bottom-[22%] left-[18%] animate-ambient-sparkle"
          style={{ animationDuration: "6.8s", animationDelay: "3.5s" }}
        >
          <svg className="size-4 text-teal-400 dark:text-teal-300 opacity-55" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>

        {/* Soft Medical Cross / Protection Motif */}
        <div
          className="absolute bottom-[35%] right-[25%] animate-ambient-sparkle"
          style={{ animationDuration: "9s", animationDelay: "4s" }}
        >
          <svg className="size-4 text-rose-400 dark:text-rose-400 opacity-40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
          </svg>
        </div>
      </div>
    </div>
  )
})

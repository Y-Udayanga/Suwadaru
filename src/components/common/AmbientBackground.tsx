/**
 * AmbientBackground
 *
 * A luxury animated ambient background featuring:
 * 1. Multi-layered organic floating mesh glowing orbs that drift and breathe.
 * 2. Automatic adaptation to Light and Dark modes.
 * 3. Subtle micro-dot matrix pattern with vignette fading.
 * 4. Ambient starlight/sparkle dust particles.
 * 5. Full support for prefers-reduced-motion (freezes animations).
 * 6. pointer-events-none and GPU-accelerated.
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
      {/* ── Layer 1: Animated Multi-Color Mesh Glow Orbs ── */}
      {/* Orb 1: Warm Vibrant Rose / Coral Aura (Top-Left) */}
      <div
        className={cn(
          "absolute -top-[10%] -left-[8%] h-[55vw] w-[55vw] max-h-[700px] max-w-[700px] rounded-full",
          "bg-gradient-to-br from-rose-500/35 via-pink-400/25 to-amber-300/20",
          "dark:from-rose-600/25 dark:via-rose-900/28 dark:to-transparent",
          "blur-[80px] md:blur-[110px]",
          "animate-ambient-1",
        )}
      />

      {/* Orb 2: Warm Sunshine Gold & Amber (Top-Right) */}
      <div
        className={cn(
          "absolute -top-[8%] -right-[6%] h-[52vw] w-[52vw] max-h-[650px] max-w-[650px] rounded-full",
          "bg-gradient-to-bl from-amber-400/35 via-orange-300/25 to-rose-300/20",
          "dark:from-amber-500/20 dark:via-amber-900/22 dark:to-transparent",
          "blur-[85px] md:blur-[115px]",
          "animate-ambient-2",
        )}
      />

      {/* Orb 3: Fresh Mint & Care Emerald (Mid-Left) */}
      <div
        className={cn(
          "absolute top-[40%] -left-[12%] h-[48vw] w-[48vw] max-h-[600px] max-w-[600px] rounded-full",
          "bg-gradient-to-tr from-emerald-400/25 via-teal-300/20 to-sky-300/15",
          "dark:from-emerald-700/18 dark:via-teal-950/20 dark:to-transparent",
          "blur-[80px] md:blur-[110px]",
          "animate-ambient-3",
        )}
      />

      {/* Orb 4: Rose Blush & Maternal Violet Center Warmth (Bottom-Right) */}
      <div
        className={cn(
          "absolute top-[50%] -right-[10%] h-[52vw] w-[52vw] max-h-[650px] max-w-[650px] rounded-full",
          "bg-gradient-to-tl from-purple-400/25 via-pink-300/25 to-rose-400/30",
          "dark:from-purple-800/18 dark:via-rose-950/22 dark:to-transparent",
          "blur-[85px] md:blur-[115px]",
          "animate-ambient-1",
        )}
      />

      {/* Orb 5: Honey Amber Center Hearth (Center-Bottom) */}
      <div
        className={cn(
          "absolute -bottom-[10%] left-[25%] h-[45vw] w-[45vw] max-h-[550px] max-w-[550px] rounded-full",
          "bg-gradient-to-t from-amber-400/25 via-rose-300/20 to-transparent",
          "dark:from-amber-600/15 dark:via-rose-900/15 dark:to-transparent",
          "blur-[75px] md:blur-[105px]",
          "animate-ambient-2",
        )}
      />

      {/* ── Layer 2: Subtle Micro-Dot Matrix Texture with Vignette Mask ── */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.035] dark:opacity-[0.055]",
          "[background-image:radial-gradient(currentColor_1px,transparent_1px)]",
          "[background-size:24px_24px]",
          "[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]",
        )}
      />

      {/* ── Layer 3: Floating Ambient Starlight Particles ── */}
      <div className="absolute inset-0">
        {/* Particle 1 */}
        <span
          className={cn(
            "absolute top-[20%] left-[15%] size-1.5 rounded-full",
            "bg-rose-400 dark:bg-rose-300 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
            "animate-ambient-sparkle",
          )}
          style={{ animationDelay: "0s", animationDuration: "5.5s" }}
        />
        {/* Particle 2 */}
        <span
          className={cn(
            "absolute top-[35%] right-[22%] size-1 rounded-full",
            "bg-amber-400 dark:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
            "animate-ambient-sparkle",
          )}
          style={{ animationDelay: "1.8s", animationDuration: "6.2s" }}
        />
        {/* Particle 3 */}
        <span
          className={cn(
            "absolute bottom-[28%] left-[25%] size-1 rounded-full",
            "bg-teal-400 dark:bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.8)]",
            "animate-ambient-sparkle",
          )}
          style={{ animationDelay: "3.2s", animationDuration: "7s" }}
        />
        {/* Particle 4 */}
        <span
          className={cn(
            "absolute bottom-[20%] right-[18%] size-1.5 rounded-full",
            "bg-rose-400 dark:bg-rose-300 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
            "animate-ambient-sparkle",
          )}
          style={{ animationDelay: "2.4s", animationDuration: "5.8s" }}
        />
        {/* Particle 5 */}
        <span
          className={cn(
            "absolute top-[55%] left-[8%] size-1 rounded-full",
            "bg-amber-400 dark:bg-amber-200 shadow-[0_0_6px_rgba(251,191,36,0.7)]",
            "animate-ambient-sparkle",
          )}
          style={{ animationDelay: "4.1s", animationDuration: "6.5s" }}
        />
      </div>
    </div>
  )
})

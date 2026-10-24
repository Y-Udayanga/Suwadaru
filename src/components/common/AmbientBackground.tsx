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
      {/* ── Layer 1: Animated Mesh Glow Orbs ── */}
      {/* Orb 1: Warm Rose / Coral Aura (Top-Left) */}
      <div
        className={cn(
          "absolute -top-[12%] -left-[10%] h-[55vw] w-[55vw] max-h-[650px] max-w-[650px] rounded-full",
          "bg-gradient-to-br from-rose-400/25 via-pink-300/18 to-transparent",
          "dark:from-rose-600/15 dark:via-rose-900/18 dark:to-transparent",
          "blur-[95px] md:blur-[130px]",
          "animate-ambient-1",
        )}
      />

      {/* Orb 2: Warm Amber / Honey Starlight (Top-Right) */}
      <div
        className={cn(
          "absolute -top-[10%] -right-[8%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full",
          "bg-gradient-to-bl from-amber-300/22 via-orange-200/15 to-transparent",
          "dark:from-amber-600/12 dark:via-amber-900/14 dark:to-transparent",
          "blur-[90px] md:blur-[120px]",
          "animate-ambient-2",
        )}
      />

      {/* Orb 3: Soft Mint / Turquoise Calming Care (Bottom-Left) */}
      <div
        className={cn(
          "absolute -bottom-[15%] -left-[5%] h-[48vw] w-[48vw] max-h-[580px] max-w-[580px] rounded-full",
          "bg-gradient-to-tr from-teal-300/16 via-emerald-200/12 to-transparent",
          "dark:from-teal-700/10 dark:via-emerald-950/15 dark:to-transparent",
          "blur-[85px] md:blur-[120px]",
          "animate-ambient-3",
        )}
      />

      {/* Orb 4: Rose Blush & Velvet Center Warmth (Bottom-Right) */}
      <div
        className={cn(
          "absolute -bottom-[12%] -right-[10%] h-[52vw] w-[52vw] max-h-[620px] max-w-[620px] rounded-full",
          "bg-gradient-to-tl from-rose-300/20 via-pink-200/15 to-transparent",
          "dark:from-rose-700/12 dark:via-purple-950/15 dark:to-transparent",
          "blur-[90px] md:blur-[125px]",
          "animate-ambient-1",
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

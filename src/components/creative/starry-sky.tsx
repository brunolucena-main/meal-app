import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/** Small deterministic PRNG so the sky looks random but renders identically on server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261004)

/** Three tiled layers of tiny stars with different tile sizes, so the repeat never lines up. */
function starLayer(tile: number, count: number, size: number, color: string) {
  const dots = Array.from({ length: count }, () => {
    const x = Math.round(rand() * tile)
    const y = Math.round(rand() * tile)
    return `radial-gradient(${size}px ${size}px at ${x}px ${y}px, ${color} 99%, transparent)`
  })
  return { images: dots, sizes: dots.map(() => `${tile}px ${tile}px`) }
}

const layers = [
  starLayer(173, 8, 1, "rgb(255 255 255 / 0.9)"),
  starLayer(233, 9, 1.2, "rgb(255 255 255 / 0.8)"),
  starLayer(317, 8, 1.6, "rgb(255 255 255 / 0.75)"),
  starLayer(419, 8, 1.8, "rgb(196 168 255 / 0.95)"),
]

const skyStyle: CSSProperties = {
  backgroundColor: "var(--night)",
  backgroundImage: [
    ...layers.flatMap((l) => l.images),
    "radial-gradient(ellipse 55% 45% at 85% 5%, rgb(124 77 255 / 0.38), transparent 70%)",
    "radial-gradient(ellipse 45% 40% at 5% 95%, rgb(168 85 247 / 0.28), transparent 70%)",
    "linear-gradient(180deg, transparent, rgb(60 30 120 / 0.35))",
  ].join(", "),
  backgroundSize: [...layers.flatMap((l) => l.sizes), "100% 100%", "100% 100%", "100% 100%"].join(", "),
}

/** Purple four-point sparkles and a few bright twinkling stars, placed once. */
const sparkles = Array.from({ length: 14 }, (_, i) => ({
  left: `${Math.round(rand() * 94 + 3)}%`,
  top: `${Math.round(rand() * 90 + 4)}%`,
  size: Math.round(8 + rand() * 12),
  color: i % 3 === 0 ? "#e4d8ff" : i % 3 === 1 ? "#b794ff" : "#8f63ff",
  delay: `${(rand() * -4.5).toFixed(2)}s`,
}))

const twinklers = Array.from({ length: 28 }, () => ({
  left: `${(rand() * 100).toFixed(1)}%`,
  top: `${(rand() * 100).toFixed(1)}%`,
  size: rand() > 0.7 ? 3 : 2,
  delay: `${(rand() * -4.5).toFixed(2)}s`,
}))

function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
      <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill={color} />
    </svg>
  )
}

export function StarrySky({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} style={skyStyle}>
      {twinklers.map((t, i) => (
        <span
          key={`t${i}`}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{ left: t.left, top: t.top, width: t.size, height: t.size, animationDelay: t.delay }}
        />
      ))}
      {sparkles.map((s, i) => (
        <span
          key={`s${i}`}
          className="animate-twinkle absolute"
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          <Sparkle size={s.size} color={s.color} />
        </span>
      ))}
    </div>
  )
}

/** Wrapper for creative pages: the same app components on a night sky. */
export function CreativeSurface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative isolate overflow-hidden text-on-night", className)}>
      <StarrySky />
      {children}
    </div>
  )
}

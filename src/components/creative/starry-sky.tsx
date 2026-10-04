import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/*
  Stylized night sky: flat dark purple (the same color the sidebar fades into) with a
  wallpaper-like pattern of sparkles, dots, rings and crosses. Two tiles of different sizes
  overlap so the repeat is less obvious.
*/

const sparkle = (x: number, y: number, r: number, fill: string) =>
  `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10 Z" fill="${fill}"/>`
const dot = (x: number, y: number, r: number, fill: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`
const ring = (x: number, y: number, r: number, stroke: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${stroke}" stroke-width="1.3"/>`
const cross = (x: number, y: number, len: number, stroke: string) =>
  `<path d="M${x - len} ${y}H${x + len}M${x} ${y - len}V${y + len}" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round"/>`

const tile = (size: number, shapes: string[]) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shapes.join("")}</svg>`
  )}")`

const lilac = "#b7a2f5"
const soft = "#7d68c4"
const faint = "#5a4796"

const small = tile(240, [
  sparkle(36, 44, 7, lilac),
  dot(96, 22, 1.6, soft),
  dot(196, 64, 1.4, soft),
  ring(112, 108, 3, faint),
  sparkle(168, 132, 4.5, soft),
  dot(58, 176, 1.6, soft),
  cross(214, 168, 4, faint),
  dot(132, 214, 1.3, faint),
])

const large = tile(380, [
  sparkle(290, 70, 10, lilac),
  dot(70, 120, 1.8, lilac),
  ring(220, 250, 4.5, soft),
  sparkle(90, 300, 6, soft),
  cross(330, 330, 5, soft),
])

const patternStyle: CSSProperties = {
  backgroundImage: `${large}, ${small}`,
  backgroundSize: "380px 380px, 240px 240px",
  backgroundPosition: "60px 20px, 0 0",
}

/**
 * `anchored` (default) uses the viewport-anchored gradient shared with the sidebar. Framed
 * previews pass `anchored={false}` so the gradient fits their own box instead.
 */
export function StarrySky({ className, anchored = true }: { className?: string; anchored?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 bg-night",
        anchored && "night-gradient",
        className
      )}
      style={
        anchored
          ? undefined
          : { backgroundImage: "linear-gradient(180deg, var(--creative) 0%, var(--night) 70%)" }
      }
    >
      <div className="absolute inset-0" style={patternStyle} />
    </div>
  )
}

/** Wrapper for creative pages: the same app components on the night sky. */
export function CreativeSurface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative isolate overflow-hidden text-on-night", className)}>
      <StarrySky anchored={false} />
      {children}
    </div>
  )
}

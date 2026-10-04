import type { CSSProperties } from "react"

export type BackdropKind = "field" | "market" | "rings"

export const backdropOptions: { value: BackdropKind; label: string; description: string }[] = [
  {
    value: "field",
    label: "Flavor field",
    description: "Soft washes of the ingredients' colors drifting slowly behind the page, with a fine paper grain.",
  },
  {
    value: "market",
    label: "Market paper",
    description: "A printed pattern of seeds and rounds in pale tones of the ingredients, like a grocer's wrapping paper.",
  },
  {
    value: "rings",
    label: "Aroma rings",
    description: "Fine contour rings spreading from each ingredient's color, after the aroma wheel used in flavor science.",
  },
]

const tone = (color: string, amount: number, base = "transparent") =>
  `color-mix(in oklab, ${color} ${amount}%, ${base})`

/**
 * Decorative background for creative pages. It takes its colors from the ingredients on screen,
 * so every page tints itself differently. Purely visual: hidden from assistive tech.
 */
export function CreativeBackdrop({ kind, colors }: { kind: BackdropKind; colors: string[] }) {
  const [c1, c2, c3, c4] = [0, 1, 2, 3].map((i) => colors[i % colors.length])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {kind === "field" ? <Field colors={[c1, c2, c3, c4]} /> : null}
      {kind === "market" ? <Market colors={[c1, c2, c3, c4]} /> : null}
      {kind === "rings" ? <Rings colors={[c1, c2, c3]} /> : null}
      <div className="grain absolute inset-0" />
    </div>
  )
}

function Field({ colors }: { colors: string[] }) {
  const blobs: CSSProperties[] = [
    { left: "-12%", top: "-25%", width: "62%", aspectRatio: "1", animationDelay: "0s" },
    { right: "-14%", top: "-5%", width: "55%", aspectRatio: "1", animationDelay: "-8s" },
    { left: "18%", bottom: "-38%", width: "60%", aspectRatio: "1", animationDelay: "-14s" },
    { right: "2%", bottom: "-30%", width: "42%", aspectRatio: "1", animationDelay: "-20s" },
  ]
  return (
    <>
      {blobs.map((style, i) => (
        <div
          key={i}
          className="animate-drift absolute rounded-full blur-3xl"
          style={{
            ...style,
            background: `radial-gradient(closest-side, ${tone(colors[i], 50)}, ${tone(colors[i], 18)} 55%, transparent)`,
          }}
        />
      ))}
    </>
  )
}

function Market({ colors }: { colors: string[] }) {
  const [a, b, c, d] = colors.map((color) => tone(color, 26, "var(--paper)"))
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: [
          `radial-gradient(circle at 18% 28%, ${a} 0 15px, transparent 16px)`,
          `radial-gradient(circle at 68% 18%, ${b} 0 7px, transparent 8px)`,
          `radial-gradient(circle at 58% 72%, ${c} 0 24px, transparent 25px)`,
          `radial-gradient(ellipse 16px 7px at 26% 82%, ${d} 0 99%, transparent)`,
          `radial-gradient(ellipse 7px 16px at 88% 52%, ${a} 0 99%, transparent)`,
          `radial-gradient(circle at 40% 45%, ${b} 0 3px, transparent 4px)`,
        ].join(", "),
        backgroundSize: "190px 190px",
        // Let the pattern breathe at the edges and stay quiet behind the headline.
        maskImage: "radial-gradient(ellipse 75% 70% at 30% 25%, transparent 0 35%, black 80%)",
      }}
    />
  )
}

function Rings({ colors }: { colors: string[] }) {
  const centers = ["88% 8%", "6% 92%", "70% 88%"]
  return (
    <>
      {centers.map((at, i) => (
        <div
          key={at}
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at ${at}, ${tone(colors[i], 40)} 0 1.5px, transparent 1.5px 16px)`,
            maskImage: `radial-gradient(circle at ${at}, black 0, transparent ${i === 0 ? 55 : 42}%)`,
          }}
        />
      ))}
      {centers.map((at, i) => (
        <div
          key={`glow-${at}`}
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at ${at}, ${tone(colors[i], 22)}, transparent 30%)` }}
        />
      ))}
    </>
  )
}

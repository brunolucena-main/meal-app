"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { StarrySky } from "@/components/creative/starry-sky"
import { cn } from "@/lib/utils"
import { creativeItems, navItems, toolItems, type NavItem } from "./nav-items"
import { ThemeToggle } from "./theme-toggle"

type Tone = "default" | "creative"

const toneStyles: Record<Tone, { link: string; active: string; disabled: string; badge: string }> = {
  default: {
    link: "hover:bg-muted",
    active: "bg-accent text-accent-foreground hover:bg-accent",
    disabled: "text-muted-foreground/60",
    badge: "bg-muted text-muted-foreground",
  },
  creative: {
    link: "text-creative-foreground hover:bg-white/10",
    active: "bg-white/20 text-creative-foreground hover:bg-white/20",
    disabled: "text-creative-foreground/65",
    badge: "bg-white/15 text-creative-foreground",
  },
}

function NavLink({ item, active, tone = "default" }: { item: NavItem; active: boolean; tone?: Tone }) {
  const Icon = item.icon
  const styles = toneStyles[tone]
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.comingIn ? (
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", styles.badge)}>
          S{item.comingIn}
        </span>
      ) : null}
    </>
  )
  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold"

  if (item.comingIn) {
    return (
      <span aria-disabled title={`Built in session ${item.comingIn}`} className={cn(base, "cursor-default", styles.disabled)}>
        {content}
      </span>
    )
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        "transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        styles.link,
        active && styles.active
      )}
    >
      {content}
    </Link>
  )
}

/** Routes that get the night-sky main area: the creative section plus its design preview. */
const creativeRoutes = [...creativeItems.map((item) => item.href), "/design/creative"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  const onCreative = creativeRoutes.some((href) => pathname.startsWith(href))

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col md:sticky md:top-0 md:h-dvh md:w-60">
        {/* Only the white part carries a divider; the purple part melts into the night sky. */}
        <div className="grid gap-6 border-b border-border bg-card px-4 py-5 md:border-r md:border-b-0">
          <Link href="/" className="flex items-center gap-2 px-3 text-base font-extrabold tracking-tight">
            <span aria-hidden className="size-6 rounded-[10px_10px_10px_3px] bg-primary" />
            Meal App
          </Link>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        </div>

        <div className="night-gradient flex flex-1 flex-col px-4 pt-4 pb-5">
          <nav aria-labelledby="creative-nav-h" className="flex flex-col gap-1">
            <span
              id="creative-nav-h"
              className="px-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-creative-muted uppercase"
            >
              Creative
            </span>
            {creativeItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} tone="creative" />
            ))}
          </nav>
          <nav aria-label="Tools" className="mt-auto flex flex-col gap-1 pt-6">
            {toolItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} tone="creative" />
            ))}
            <div className="px-1 pt-2">
              <ThemeToggle tone="creative" />
            </div>
          </nav>
        </div>
      </aside>
      <main className={cn("relative min-w-0 flex-1", onCreative && "isolate text-on-night")}>
        {onCreative ? <StarrySky /> : null}
        {children}
      </main>
    </div>
  )
}

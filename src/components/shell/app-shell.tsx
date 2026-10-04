"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { StarrySky } from "@/components/creative/starry-sky"
import { useT } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"
import { creativeItems, navItems, toolItems, type NavItem } from "./nav-items"
import { LanguageToggle } from "./language-toggle"
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
  const t = useT()
  const Icon = item.icon
  const styles = toneStyles[tone]
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1">{t(item.label)}</span>
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
      <span aria-disabled title={t("Built in session {n}", { n: item.comingIn })} className={cn(base, "cursor-default", styles.disabled)}>
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

/** Routes that get the night-sky main area. */
const creativeRoutes = creativeItems.map((item) => item.href)

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT()
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  const onCreative = creativeRoutes.some((href) => pathname.startsWith(href))
  // Narrow screens: the navigation folds behind a Menu button and closes after each navigation.
  const [menu, setMenu] = useState<{ open: boolean; path: string }>({ open: false, path: pathname })
  const menuOpen = menu.open && menu.path === pathname

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("Skip to content")}
      </a>
      {/*
        Where white meets purple the corner is rounded, and the aside's own background fills the
        curve. Creative pages: the aside is night, so the white block curves into the sky and no
        edge line shows. Other pages: the aside is white with a full-height edge line, so the
        purple section's corner curves inside the sidebar.
      */}
      <aside
        className={cn(
          "flex shrink-0 flex-col md:sticky md:top-0 md:h-dvh md:w-60 md:border-r",
          onCreative ? "night-gradient bg-night md:border-transparent" : "bg-card md:border-border"
        )}
      >
        <div
          className={cn(
            "grid gap-6 border-b border-border bg-card px-4 py-5 md:border-b-0",
            onCreative && "md:rounded-br-[28px]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 px-3 text-base font-extrabold tracking-tight">
              <span aria-hidden className="size-6 rounded-[10px_10px_10px_3px] bg-primary" />
              Meal App
            </Link>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="main-nav creative-nav tools-nav"
              onClick={() => setMenu({ open: !menuOpen, path: pathname })}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-bold md:hidden"
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
              {t("Menu")}
            </button>
          </div>
          <nav id="main-nav" aria-label={t("Main")} className={cn("flex-col gap-1 md:flex", menuOpen ? "flex" : "hidden")}>
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        </div>

        <div
          className={cn(
            "night-gradient flex-1 flex-col px-4 pt-4 pb-5 md:flex",
            menuOpen ? "flex" : "hidden",
            !onCreative && "md:rounded-tr-[28px]"
          )}
        >
          <nav id="creative-nav" aria-labelledby="creative-nav-h" className="flex flex-col gap-1">
            <span
              id="creative-nav-h"
              className="px-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-creative-muted uppercase"
            >
              {t("Creative")}
            </span>
            {creativeItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} tone="creative" />
            ))}
          </nav>
          <nav id="tools-nav" aria-label={t("Tools")} className="mt-auto flex flex-col gap-1 pt-6">
            {toolItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} tone="creative" />
            ))}
            <div className="grid gap-2 px-1 pt-2">
              <ThemeToggle tone="creative" />
              <LanguageToggle />
            </div>
          </nav>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className={cn("relative min-w-0 flex-1 outline-none", onCreative && "isolate text-on-night")}>
        {onCreative ? <StarrySky /> : null}
        {children}
      </main>
    </div>
  )
}

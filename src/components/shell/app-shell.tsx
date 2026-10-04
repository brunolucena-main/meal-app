"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { navItems, toolItems, type NavItem } from "./nav-items"
import { ThemeToggle } from "./theme-toggle"

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.comingIn ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          S{item.comingIn}
        </span>
      ) : null}
    </>
  )
  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold"

  if (item.comingIn) {
    return (
      <span
        aria-disabled
        title={`Built in session ${item.comingIn}`}
        className={cn(base, "cursor-default text-muted-foreground/70")}
      >
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
        "transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
        active && "bg-accent text-accent-foreground hover:bg-accent"
      )}
    >
      {content}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-border bg-card px-4 py-5 md:sticky md:top-0 md:h-dvh md:w-60 md:border-r md:border-b-0">
        <Link href="/" className="flex items-center gap-2 px-3 text-base font-extrabold tracking-tight">
          <span aria-hidden className="size-6 rounded-[10px_10px_10px_3px] bg-primary" />
          Meal App
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>
        <nav aria-label="Tools" className="flex flex-col gap-1 md:mt-auto">
          {toolItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          <div className="px-1 pt-2">
            <ThemeToggle />
          </div>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

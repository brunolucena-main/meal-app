"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { Input } from "@/components/ui/input"

/** Search field that updates ?q= as you type (debounced) so results render on the server. */
export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initialQuery)
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function go(next: string) {
    const q = next.trim()
    startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }))
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        clearTimeout(timer.current)
        go(value)
      }}
      className="relative max-w-xl"
    >
      <label htmlFor="food-search" className="sr-only">
        Search foods
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id="food-search"
        type="search"
        autoFocus
        autoComplete="off"
        value={value}
        placeholder="Search 8,000+ foods, e.g. spinach, lentils, salmon"
        onChange={(e) => {
          setValue(e.target.value)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => go(e.target.value), 250)
        }}
        className="h-12 rounded-full bg-card pr-24 pl-11 text-base"
      />
      {pending ? (
        <span className="absolute top-1/2 right-5 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
          Searching…
        </span>
      ) : null}
    </form>
  )
}

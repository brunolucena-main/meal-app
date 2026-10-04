"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

function subscribeNoop() {
  return () => {}
}

export function ThemeToggle({ tone = "default" }: { tone?: "default" | "creative" }) {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; render no selection on the server.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)

  return (
    <ToggleGroup
      aria-label="Theme"
      value={mounted && theme ? [theme] : []}
      onValueChange={(value) => {
        const next = value[0]
        if (next) setTheme(next)
      }}
      className="w-full"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className={cn(
            "flex-1",
            tone === "creative" &&
              "text-creative-foreground hover:bg-white/10 hover:text-creative-foreground aria-pressed:bg-white/20"
          )}
        >
          <Icon className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

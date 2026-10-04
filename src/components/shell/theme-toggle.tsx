"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useSyncExternalStore } from "react"

import { useT } from "@/components/i18n-provider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { applyTheme, THEME_KEY, type ThemeChoice } from "./theme"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const CHANGE = "themechange"

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function setChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice)
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  applyTheme(choice)
  window.dispatchEvent(new Event(CHANGE))
}

export function ThemeToggle({ tone = "default" }: { tone?: "default" | "creative" }) {
  const t = useT()
  // The saved choice only exists in the browser; render no selection on the server.
  const theme = useSyncExternalStore(subscribe, readChoice, () => null)

  // Follow the OS setting live while on "system".
  useEffect(() => {
    if (theme !== "system") return
    const media = matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  return (
    <ToggleGroup
      aria-label={t("Theme")}
      value={theme ? [theme] : []}
      onValueChange={(value) => {
        const next = value[0] as ThemeChoice | undefined
        if (next) setChoice(next)
      }}
      className="w-full"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(label)}
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

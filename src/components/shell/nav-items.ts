import {
  Apple,
  CalendarDays,
  ChefHat,
  Columns3,
  Contrast,
  Grape,
  Network,
  NotebookPen,
  Sun,
  SwatchBook,
  Waypoints,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Session in which this screen gets built; undefined once it exists. */
  comingIn?: number
}

export const navItems: NavItem[] = [
  { href: "/", label: "Today", icon: Sun, comingIn: 6 },
  { href: "/plan", label: "Plan", icon: CalendarDays, comingIn: 6 },
  { href: "/log", label: "Log", icon: NotebookPen, comingIn: 6 },
  { href: "/recipes", label: "Recipes", icon: ChefHat, comingIn: 5 },
  { href: "/foods", label: "Foods", icon: Apple },
  { href: "/compare", label: "Compare", icon: Columns3 },
]

/** Creative section: lives in the purple block of the sidebar. */
export const creativeItems: NavItem[] = [
  { href: "/pairings", label: "Pairings", icon: Grape, comingIn: 7 },
  { href: "/opposites", label: "Opposites", icon: Contrast, comingIn: 8 },
  { href: "/bridges", label: "Bridges", icon: Waypoints, comingIn: 8 },
  { href: "/flavor-map", label: "Flavor map", icon: Network, comingIn: 8 },
]

export const toolItems: NavItem[] = [{ href: "/design", label: "Design system", icon: SwatchBook }]

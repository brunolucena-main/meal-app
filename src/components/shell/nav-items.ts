import {
  Apple,
  CalendarDays,
  ChefHat,
  Columns3,
  Grape,
  NotebookPen,
  Sun,
  SwatchBook,
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
  { href: "/foods", label: "Foods", icon: Apple, comingIn: 2 },
  { href: "/compare", label: "Compare", icon: Columns3, comingIn: 3 },
  { href: "/pairings", label: "Pairings", icon: Grape, comingIn: 7 },
]

export const toolItems: NavItem[] = [{ href: "/design", label: "Design system", icon: SwatchBook }]

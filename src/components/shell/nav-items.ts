import {
  Apple,
  CalendarDays,
  ChefHat,
  Columns3,
  Contrast,
  Grape,
  Medal,
  Network,
  NotebookPen,
  ShoppingBasket,
  Sun,
  SwatchBook,
  Target,
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
  { href: "/", label: "Today", icon: Sun },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/shopping", label: "Shopping", icon: ShoppingBasket },
  { href: "/log", label: "Log", icon: NotebookPen },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/foods", label: "Foods", icon: Apple },
  { href: "/compare", label: "Compare", icon: Columns3 },
  { href: "/best", label: "Best sources", icon: Medal },
  { href: "/targets", label: "Targets", icon: Target },
]

/** Creative section: lives in the purple block of the sidebar. */
export const creativeItems: NavItem[] = [
  { href: "/pairings", label: "Pairings", icon: Grape, comingIn: 7 },
  { href: "/opposites", label: "Opposites", icon: Contrast, comingIn: 8 },
  { href: "/bridges", label: "Bridges", icon: Waypoints, comingIn: 8 },
  { href: "/flavor-map", label: "Flavor map", icon: Network, comingIn: 8 },
]

export const toolItems: NavItem[] = [{ href: "/design", label: "Design system", icon: SwatchBook }]

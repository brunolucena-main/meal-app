import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-16 md:px-10">
      <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Session 2 of 9</p>
      <h1 className="text-4xl font-extrabold tracking-tight">Nothing to plan yet</h1>
      <p className="max-w-[60ch] text-muted-foreground">
        The Today screen arrives in session 6, once comparison, recipes and the planner exist. For now you can search
        the USDA foods and open any of them for its full nutrient profile.
      </p>
      <div>
        <Link href="/foods" className={buttonVariants({ size: "lg" })}>
          Search foods
        </Link>
      </div>
    </div>
  )
}

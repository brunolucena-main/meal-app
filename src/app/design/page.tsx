import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { statusForGoal, statusForLimit, TargetBar } from "@/components/nutrition/target-bar"
import { IngredientChip } from "@/components/food/ingredient-chip"
import { CompareTable } from "@/components/nutrition/compare-table"
import { CreativeSpecimen } from "./creative-specimen"
import { chipExamples, compareFoods, compareGroups } from "./examples"
import { Swatch } from "./swatch"

export const metadata: Metadata = { title: "Design system · Meal App" }

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="grid gap-5">
      <div className="grid gap-1">
        <h2 id={`${id}-h`} className="text-xl font-extrabold tracking-tight">
          {title}
        </h2>
        {description ? <p className="max-w-[65ch] text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`surface rounded-3xl p-5 md:p-6 ${className}`}>{children}</div>
}

// Example day used to show the target bars. Not real data.
const exampleDay = {
  calories: { value: 1640, target: 2200 },
  protein: { value: 118, target: 130 },
  fiber: { value: 22, target: 30 },
  magnesium: { value: 280, target: 420 },
  sodium: { value: 2600, limit: 2300 },
}

export default function DesignPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Session 1 · work in progress</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Design system</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          The base look for planning, logging and comparing. Switch the theme at the bottom of the sidebar to check dark
          mode. The creative section is at the bottom.
        </p>
      </header>

      <Section id="color" title="Color" description="Every color is a token with a light and a dark value.">
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="grid content-start gap-4">
            <h3 className="text-sm font-bold text-muted-foreground">Base</h3>
            <Swatch name="Mist" token="background" note="Page ground" />
            <Swatch name="Card" token="card" />
            <Swatch name="Ink" token="foreground" />
            <Swatch name="Muted text" token="muted-foreground" />
            <Swatch name="Teal" token="primary" note="Actions, focus" />
            <Swatch name="Track" token="track" note="Empty part of bars" />
            <Swatch name="Teal tint" token="accent" note="Selected items, highlights" />
          </Panel>
          <Panel className="grid content-start gap-4">
            <h3 className="text-sm font-bold text-muted-foreground">Comparison series</h3>
            <Swatch name="Food 1" token="series-1" tint="tint-1" />
            <Swatch name="Food 2" token="series-2" tint="tint-2" />
            <Swatch name="Food 3" token="series-3" tint="tint-3" />
            <Swatch name="Food 4" token="series-4" tint="tint-4" />
            <p className="text-xs text-muted-foreground">
              Up to four foods side by side. Each has a soft tint for tiles and a darker &ldquo;ink&rdquo; shade for
              text.
            </p>
          </Panel>
          <Panel className="grid content-start gap-4">
            <h3 className="text-sm font-bold text-muted-foreground">Target status</h3>
            <Swatch name="On target" token="good" />
            <Swatch name="Watch" token="warn" />
            <Swatch name="Over limit" token="bad" />
            <p className="text-xs text-muted-foreground">
              Status always comes with a word as well as a color, so it reads without color vision.
            </p>
          </Panel>
        </div>
      </Section>

      <Section id="type" title="Type" description="Manrope everywhere in the base, with tabular numbers so figures line up.">
        <Panel className="grid gap-5">
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Page title · 36 / 800</span>
            <span className="text-4xl font-extrabold tracking-tight">Tuesday, 6 October</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Section · 20 / 800</span>
            <span className="text-xl font-extrabold tracking-tight">Spinach leads on 3 of 5 micronutrients</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Body · 15 / 500</span>
            <p className="max-w-[60ch] text-[15px] font-medium">
              Per 100 g raw, kale carries three times the vitamin C of spinach. Spinach has more iron and over twice the
              magnesium, for fewer calories.
            </p>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Big number · 40 / 800</span>
            <span className="tabular text-[40px] leading-none font-extrabold">
              1,640 <span className="text-base font-semibold text-muted-foreground">of 2,200 kcal</span>
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Label · 12 / 700 caps</span>
            <span className="text-xs font-bold tracking-[0.12em] uppercase">Micronutrients</span>
          </div>
        </Panel>
      </Section>

      <Section id="controls" title="Controls">
        <Panel className="grid gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Add to plan</Button>
            <Button variant="secondary">Compare</Button>
            <Button variant="outline">Swap food</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Remove</Button>
            <Button size="lg">Log as planned</Button>
          </div>
          <div className="grid max-w-md gap-2">
            <label htmlFor="demo-search" className="text-sm font-bold">
              Search foods
            </label>
            <Input id="demo-search" placeholder="e.g. spinach, lentils, oats" className="h-10 rounded-full px-4" />
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-bold">Compare by</span>
            <Tabs defaultValue="100g">
              <TabsList className="h-10 rounded-full bg-track p-1">
                <TabsTrigger value="100g" className="rounded-full px-4 text-muted-foreground data-active:text-foreground">
                  Per 100 g
                </TabsTrigger>
                <TabsTrigger value="100kcal" className="rounded-full px-4 text-muted-foreground data-active:text-foreground">
                  Per 100 kcal
                </TabsTrigger>
                <TabsTrigger value="serving" className="rounded-full px-4 text-muted-foreground data-active:text-foreground">
                  Per serving
                </TabsTrigger>
                <TabsTrigger value="target" className="rounded-full px-4 text-muted-foreground data-active:text-foreground">
                  % of my targets
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Panel>
      </Section>

      <Section
        id="targets"
        title="Target bars"
        description="Thick bars with a plain-language status. Example day, not real data."
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="grid content-start gap-4 rounded-3xl bg-tint-1 p-5 md:p-6">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.12em] text-accent-foreground uppercase">Today</span>
              <span className="tabular text-[40px] leading-none font-extrabold">
                1,640 <span className="text-base font-semibold text-muted-foreground">of 2,200 kcal</span>
              </span>
            </div>
            <div
              role="meter"
              aria-label="Calories"
              aria-valuenow={75}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-4 overflow-hidden rounded-full bg-card"
            >
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
            <p className="text-sm font-bold">
              560 kcal left <span className="font-medium text-muted-foreground">· dinner planned: 610 kcal</span>
            </p>
          </div>
          <Panel className="grid gap-5 sm:grid-cols-2">
            <TargetBar
              label="Protein"
              unit="g"
              {...exampleDay.protein}
              status={statusForGoal(exampleDay.protein.value, exampleDay.protein.target)}
            />
            <TargetBar
              label="Fiber"
              unit="g"
              {...exampleDay.fiber}
              status={statusForGoal(exampleDay.fiber.value, exampleDay.fiber.target)}
            />
            <TargetBar
              label="Magnesium"
              unit="mg"
              {...exampleDay.magnesium}
              status={statusForGoal(exampleDay.magnesium.value, exampleDay.magnesium.target)}
            />
            <TargetBar
              label="Sodium"
              unit="mg"
              value={exampleDay.sodium.value}
              target={exampleDay.sodium.limit}
              status={statusForLimit(exampleDay.sodium.value, exampleDay.sodium.limit)}
            />
          </Panel>
        </div>
      </Section>

      <Section
        id="chips"
        title="Ingredient chips"
        description="A representative color plus a texture per food group, so two green leaves still look different. Allergens are flagged in words."
      >
        <Panel className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            {chipExamples.map((food) => (
              <IngredientChip key={food.name} food={food} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {chipExamples.slice(0, 8).map((food) => (
              <IngredientChip key={food.name} food={food} size="sm" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Textures: leafy diagonal, vegetable vertical, fruit highlight, legume dots, grain lines, nut speckle, dairy
            ring, meat bands, fish crosshatch, herb fine dots, fat sheen.
          </p>
        </Panel>
      </Section>

      <Section
        id="compare"
        title="Comparison table"
        description="The compact view for many nutrients at once. Hover or focus a cell for the exact figure. Arrows mark the best value per row (lowest for limits). Missing data is shown as missing, never as zero."
      >
        <CompareTable
          foods={compareFoods}
          groups={compareGroups}
          basis="Per 100 g raw · % of Daily Value · example values"
        />
      </Section>

      <Section
        id="creative"
        title="Creative section"
        description="Where food is tasted, not counted. Serif type with room to breathe, cards tinted by each ingredient, big expressive numbers, and a background drawn from the colors on the page. Pick the background you like best."
      >
        <CreativeSpecimen />
      </Section>
    </div>
  )
}

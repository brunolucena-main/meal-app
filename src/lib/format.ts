/** Compact amount for nutrition figures: 1,640 · 23 · 2.9 · 0.73 */
export function formatAmount(value: number) {
  if (value >= 100) return Math.round(value).toLocaleString("en")
  if (value >= 10) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1).replace(/\.0$/, "")
  if (value === 0) return "0"
  return value.toFixed(2).replace(/0$/, "")
}

export const RECURRING_TYPE_ORDER = [
  "5m",
  "15m",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "annual",
] as const

export type RecurringType = (typeof RECURRING_TYPE_ORDER)[number]

const RECURRING_TYPE_SET = new Set<string>(RECURRING_TYPE_ORDER)

export function isRecurringType(value: string): value is RecurringType {
  return RECURRING_TYPE_SET.has(value)
}

export function recurringTypeLabel(value: RecurringType): string {
  switch (value) {
    case "5m":
      return "Every 5 min"
    case "15m":
      return "Every 15 min"
    case "hourly":
      return "Hourly"
    case "daily":
      return "Daily"
    case "weekly":
      return "Weekly"
    case "monthly":
      return "Monthly"
    case "annual":
      return "Annual"
  }
}

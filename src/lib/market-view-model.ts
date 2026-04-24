/** Normalized market shape for UI — do not use raw Polymarket types in components. */

export type MarketStatus = "open" | "closed"

export type MarketType = "binary" | "multi"

export type PricePoint = {
  timestamp: string
  /** Implied YES probability 0–1 at this time (demo series). */
  value: number
}

/** Single binary contract row within a market. */
export type ContractView = {
  id: string
  name: string
  /** Implied probability 0–1 */
  yesPrice: number
  /** Complementary side, always `1 - yesPrice` */
  noPrice: number
  /** Demo price path for charts — contract-specific, not market-wide. */
  history: PricePoint[]
}

export type MarketViewModel = {
  id: string
  slug: string
  question: string
  category: string
  marketType: MarketType
  /** Market is a collection of binary contracts. */
  contracts: ContractView[]
  volumeUsd: number
  expiresAt: string
  status: MarketStatus
  image?: string
  description?: string
  /** Optional copy for market detail — resolution / oracle rules */
  rules?: string
  /** Optional supporting narrative on the market detail page */
  context?: string
  recurringType?: import("@/lib/recurring").RecurringType
  recurringSeriesKey?: string
  recurringWindowLabel?: string
  /** Where this row was derived from (debug / future use) */
  source: "gamma-market" | "gamma-event"
}

export function isBinary(vm: MarketViewModel): boolean {
  return vm.marketType === "binary"
}

export function marketTypeFromContracts(
  contracts: readonly ContractView[]
): MarketType {
  return contracts.length <= 1 ? "binary" : "multi"
}

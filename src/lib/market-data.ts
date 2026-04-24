import { MARKETS_SNAPSHOT_RAW } from "@/data/markets-snapshot"
import { withContractHistory } from "@/lib/contract-demo-history"
import {
  marketTypeFromContracts,
  type ContractView,
  type MarketViewModel,
} from "@/lib/market-view-model"

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function toContracts(
  slug: string,
  marketType: "binary" | "multi",
  question: string,
  outcomes: readonly { label: string; price: number }[]
): ContractView[] {
  const base: Omit<ContractView, "history">[] =
    marketType === "binary"
      ? (() => {
          const yesPrice = clamp01(outcomes[0]?.price ?? 0)
          return [
            {
              id: "c-0",
              name: question.trim() || "Contract",
              yesPrice,
              noPrice: 1 - yesPrice,
            },
          ]
        })()
      : outcomes.map((o, i) => {
          const yesPrice = clamp01(o.price)
          return {
            id: `c-${i}`,
            name: o.label.trim() || `Contract ${i + 1}`,
            yesPrice,
            noPrice: 1 - yesPrice,
          }
        })

  return withContractHistory(slug, base)
}

const MARKETS_SNAPSHOT: readonly MarketViewModel[] = MARKETS_SNAPSHOT_RAW.map(
  (m) => {
    const marketType = m.marketType ?? "multi"
    const contracts = toContracts(m.slug, marketType, m.question, m.outcomes)
    return {
      id: m.id,
      slug: m.slug,
      question: m.question,
      category: m.category,
      marketType: marketType ?? marketTypeFromContracts(contracts),
      contracts,
      volumeUsd: m.volumeUsd,
      expiresAt: m.expiresAt,
      status: m.status,
      image: m.image,
      description: m.description,
      recurringType: m.recurringType,
      recurringSeriesKey: m.recurringSeriesKey,
      recurringWindowLabel: m.recurringWindowLabel,
      source: m.source,
    }
  }
)

const bySlug = new Map<string, MarketViewModel>()
for (const m of MARKETS_SNAPSHOT) {
  bySlug.set(m.slug, m)
}

/** Full discovery list — read-only snapshot, no network. */
export function getAllSnapshotMarkets(): MarketViewModel[] {
  return [...MARKETS_SNAPSHOT]
}

/** Detail by route slug — O(1) lookup on snapshot. */
export function getSnapshotMarketBySlug(
  slug: string
): MarketViewModel | undefined {
  const key = decodeURIComponent(slug).trim()
  if (!key) return undefined
  return bySlug.get(key)
}

export function getSnapshotRecurringSeriesMarkets(
  recurringSeriesKey: string
): MarketViewModel[] {
  if (!recurringSeriesKey.trim()) return []
  return MARKETS_SNAPSHOT.filter((m) => m.recurringSeriesKey === recurringSeriesKey)
}

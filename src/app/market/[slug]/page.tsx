import { notFound } from "next/navigation"

import { LegalFooter } from "@/components/legal-footer"
import { MarketPageClient } from "@/components/market/market-page-client"
import {
  getSnapshotMarketBySlug,
  getSnapshotRecurringSeriesMarkets,
} from "@/lib/market-data"
import {
  sideToOutcomeIndex,
  type BinarySide,
} from "@/lib/outcome-params"
import type { OutcomeLeg } from "@/lib/trading-context"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    side?: string | string[]
    outcome?: string | string[]
  }>
}

function parseInitialContractIndex(
  market: { contracts: { length: number } },
  sp: { side?: string | string[]; outcome?: string | string[] }
): number {
  if (market.contracts.length <= 1) return 0

  const rawOutcome =
    typeof sp.outcome === "string" ? sp.outcome.trim() : ""
  if (rawOutcome !== "") {
    const n = parseInt(rawOutcome, 10)
    if (
      Number.isFinite(n) &&
      n >= 0 &&
      n < market.contracts.length
    )
      return n
  }
  const rawSide = typeof sp.side === "string" ? sp.side.toLowerCase() : ""
  const side: BinarySide | undefined =
    rawSide === "yes" ? "yes" : rawSide === "no" ? "no" : undefined
  const fromSide = sideToOutcomeIndex(side)
  if (
    fromSide !== undefined &&
    fromSide >= 0 &&
    fromSide < market.contracts.length
  )
    return fromSide
  return 0
}

export default async function MarketPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const market = getSnapshotMarketBySlug(slug)
  if (!market) notFound()

  const initialContractIndex = parseInitialContractIndex(market, sp)
  const initialContractId =
    market.contracts[initialContractIndex]?.id ??
    market.contracts[0]?.id ??
    ""

  const rawSide = typeof sp.side === "string" ? sp.side.toLowerCase() : ""
  const initialOutcomeLeg: OutcomeLeg =
    market.marketType === "binary" && rawSide === "no" ? "no" : "yes"

  const recurringTabs = market.recurringSeriesKey
    ? getSnapshotRecurringSeriesMarkets(market.recurringSeriesKey)
        .filter((m) => m.recurringType === market.recurringType)
        .sort(
          (a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        )
        .map((m) => ({
          slug: m.slug,
          label: m.recurringWindowLabel ?? "Window",
        }))
    : []

  return (
    <>
      <MarketPageClient
        market={market}
        initialContractId={initialContractId}
        initialOutcomeLeg={initialOutcomeLeg}
        recurringTabs={recurringTabs}
      />
      <LegalFooter />
    </>
  )
}

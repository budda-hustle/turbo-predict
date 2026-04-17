"use client"

import * as React from "react"

import { MarketActivityBlock } from "@/components/market/market-activity-block"
import { MarketHero } from "@/components/market/market-hero"
import { MarketMultiOutcomeHeroChart } from "@/components/market/market-multi-outcome-hero-chart"
import { MarketPageLayout } from "@/components/market/market-page-layout"
import { OutcomeList } from "@/components/market/outcome-list"
import { MarketContextRulesTabs } from "@/components/market/sections/market-context-rules-tabs"
import { TradeTicket } from "@/components/market/trade-ticket/trade-ticket"
import { TradeTicketMobileSheet } from "@/components/market/trade-ticket/trade-ticket-mobile-sheet"
import { TradeTicketSidebar } from "@/components/market/trade-ticket/trade-ticket-sidebar"
import type { MarketViewModel } from "@/lib/market-view-model"
import { useMediaQuery } from "@/lib/use-media-query"
import type { OutcomeLeg } from "@/lib/trading-context"

type UiStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string }

export function MarketPageClient({
  market,
  initialContractId,
  initialOutcomeLeg,
}: {
  market: MarketViewModel
  initialContractId: string
  initialOutcomeLeg: OutcomeLeg
}) {
  const isLg = useMediaQuery("(min-width: 1024px)", false)

  const [selectedContractId, setSelectedContractId] = React.useState(() => {
    if (
      initialContractId &&
      market.contracts.some((c) => c.id === initialContractId)
    )
      return initialContractId
    return market.contracts[0]?.id ?? ""
  })
  /** Grouped markets only: accordion open row; never auto-set from selection. */
  const [expandedContractId, setExpandedContractId] = React.useState<string | null>(
    null
  )
  const [outcomeLeg, setOutcomeLeg] = React.useState<OutcomeLeg>(initialOutcomeLeg)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const [shares, setShares] = React.useState("10")
  const [ui, setUi] = React.useState<UiStatus>({ kind: "idle" })

  React.useEffect(() => {
    const next =
      initialContractId &&
      market.contracts.some((c) => c.id === initialContractId)
        ? initialContractId
        : market.contracts[0]?.id ?? ""
    setSelectedContractId(next)
    setOutcomeLeg(initialOutcomeLeg)
    setExpandedContractId(null)
  }, [initialContractId, initialOutcomeLeg, market.slug, market.contracts])

  React.useEffect(() => {
    if (
      selectedContractId &&
      !market.contracts.some((c) => c.id === selectedContractId)
    ) {
      setSelectedContractId(market.contracts[0]?.id ?? "")
    }
  }, [market.contracts, selectedContractId])

  React.useEffect(() => {
    if (
      expandedContractId &&
      !market.contracts.some((c) => c.id === expandedContractId)
    ) {
      setExpandedContractId(null)
    }
  }, [market.contracts, expandedContractId])

  const selectedContract = React.useMemo(
    () =>
      market.contracts.find((c) => c.id === selectedContractId) ??
      market.contracts[0]!,
    [market.contracts, selectedContractId]
  )

  function selectContract(contractId: string) {
    setSelectedContractId(contractId)
    setOutcomeLeg("yes")
    setUi({ kind: "idle" })
  }

  function tradeFromContractSide(contractId: string, leg: OutcomeLeg) {
    setSelectedContractId(contractId)
    setOutcomeLeg(leg)
    setUi({ kind: "idle" })
    if (!isLg) setSheetOpen(true)
  }

  function toggleExpandContract(contractId: string) {
    setExpandedContractId((cur) => (cur === contractId ? null : contractId))
  }

  const ticket = (
    <TradeTicket
      market={market}
      selectedContract={selectedContract}
      outcomeLeg={outcomeLeg}
      onOutcomeLegChange={setOutcomeLeg}
      shares={shares}
      onSharesChange={setShares}
      ui={ui}
      onUiChange={setUi}
      onOrderFilled={() => setSheetOpen(false)}
    />
  )

  const main = (
    <>
      <MarketHero market={market} />
      {market.marketType === "multi" ? (
        <MarketMultiOutcomeHeroChart market={market} />
      ) : null}
      <MarketContextRulesTabs market={market} />
      <OutcomeList
        market={market}
        selectedContractId={selectedContractId}
        selectedLeg={outcomeLeg}
        expandedContractId={expandedContractId}
        onSelectContract={selectContract}
        onToggleExpandContract={toggleExpandContract}
        onTradeSide={tradeFromContractSide}
      />
      <MarketActivityBlock market={market} />
    </>
  )

  const sidebar = (
    <TradeTicketSidebar>
      {isLg ? ticket : null}
    </TradeTicketSidebar>
  )

  return (
    <>
      <MarketPageLayout main={main} sidebar={sidebar} />
      {!isLg ? (
        <TradeTicketMobileSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Bet"
        >
          {ticket}
        </TradeTicketMobileSheet>
      ) : null}
    </>
  )
}

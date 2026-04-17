"use client"

import * as React from "react"
import Link from "next/link"

import { PositionCard } from "@/components/position-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatUsd } from "@/lib/markets"
import type { Position } from "@/lib/trading-context"

const DEMO_POSITIONS: readonly Position[] = [
  {
    id: "demo-active-1",
    marketId: "democratic-presidential-nominee-2028",
    outcomeIndex: 0,
    outcomeLeg: "yes",
    outcomeLabel: "Gavin Newsom · Yes",
    costBasisUsd: 620,
    shares: 2000,
    avgPrice: 0.31,
    openedAt: "2026-04-10T13:40:00.000Z",
    question: "Democratic Presidential Nominee 2028",
    markPrice: 0.36,
  },
  {
    id: "demo-active-2",
    marketId: "republican-presidential-nominee-2028",
    outcomeIndex: 2,
    outcomeLeg: "no",
    outcomeLabel: "Ron DeSantis · No",
    costBasisUsd: 930,
    shares: 3000,
    avgPrice: 0.31,
    openedAt: "2026-04-11T09:20:00.000Z",
    question: "Republican Presidential Nominee 2028",
    markPrice: 0.26,
  },
  {
    id: "demo-closed-1",
    marketId: "fed-rate-cut-by-july-2026",
    outcomeIndex: 0,
    outcomeLeg: "yes",
    outcomeLabel: "Fed rate cut by July 2026? · Yes",
    costBasisUsd: 800,
    shares: 0,
    avgPrice: 0.4,
    openedAt: "2026-03-18T08:10:00.000Z",
    closedAt: "2026-04-01T18:00:00.000Z",
    settledPnlUsd: 420,
    question: "Fed rate cut by July 2026?",
    markPrice: 0.61,
  },
  {
    id: "demo-closed-2",
    marketId: "btc-100k-2026",
    outcomeIndex: 0,
    outcomeLeg: "yes",
    outcomeLabel: "Will BTC close above $100k before 2027? · Yes",
    costBasisUsd: 540,
    shares: 0,
    avgPrice: 0.45,
    openedAt: "2026-03-22T11:32:00.000Z",
    closedAt: "2026-04-08T16:10:00.000Z",
    settledPnlUsd: 55,
    question: "Will BTC close above $100k before 2027?",
    markPrice: 0.5,
  },
  {
    id: "demo-closed-3",
    marketId: "ukraine-ceasefire-2026",
    outcomeIndex: 0,
    outcomeLeg: "yes",
    outcomeLabel: "Official Ukraine–Russia ceasefire announced before 2027? · Yes",
    costBasisUsd: 700,
    shares: 0,
    avgPrice: 0.35,
    openedAt: "2026-03-20T14:22:00.000Z",
    closedAt: "2026-04-09T10:05:00.000Z",
    settledPnlUsd: -125,
    question: "Official Ukraine–Russia ceasefire announced before 2027?",
    markPrice: 0.29,
  },
]

type SettledMeta = {
  result: "Won" | "Lost" | "Cashed out"
  claimed: boolean
}

const DEMO_SETTLED_META: Record<string, SettledMeta> = {
  "demo-closed-1": { result: "Won", claimed: false },
  "demo-closed-2": { result: "Cashed out", claimed: true },
  "demo-closed-3": { result: "Lost", claimed: true },
}

const segmentedTriggerClass =
  "flex-1 text-xs text-muted-foreground data-[state=active]:border data-[state=active]:border-[#d2a63a] data-[state=active]:text-[#f2bb2e] data-[state=active]:bg-[linear-gradient(180deg,rgba(255,215,100,0.18)_0%,rgba(255,200,60,0.12)_40%,rgba(180,120,0,0.18)_100%)]"

export default function PositionsPage() {
  const balanceUsd = 4_825
  const [tab, setTab] = React.useState<"active" | "settled">("active")

  const allPnl = React.useMemo(
    () =>
      DEMO_POSITIONS.reduce((acc, p) => {
        const currentPrice = p.closedAt ? null : p.markPrice
        const pnl = p.closedAt
          ? (p.settledPnlUsd ?? 0)
          : currentPrice != null
            ? p.shares * currentPrice - p.costBasisUsd
            : 0
        return acc + pnl
      }, 0),
    []
  )
  const todayPnl = React.useMemo(() => allPnl * 0.28, [allPnl])
  const activeBetsValueUsd = React.useMemo(
    () => DEMO_POSITIONS.reduce((acc, p) => acc + p.costBasisUsd, 0),
    []
  )
  const positionsValueUsd = React.useMemo(
    () =>
      DEMO_POSITIONS.reduce((acc, p) => {
        if (p.closedAt) return acc + p.costBasisUsd + (p.settledPnlUsd ?? 0)
        return acc + p.shares * p.markPrice
      }, 0),
    []
  )
  const totalValueUsd = balanceUsd + positionsValueUsd
  const activeCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => !p.closedAt).length,
    []
  )
  const settledCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => Boolean(p.closedAt)).length,
    []
  )

  const list = React.useMemo(
    () =>
      DEMO_POSITIONS.filter((p) =>
        tab === "settled" ? Boolean(p.closedAt) : !p.closedAt
      ),
    [tab]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <Link
              href="/"
              className="button-md text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back
            </Link>
            <h1 className="heading-display-sm text-xl sm:text-2xl">
              My Bets
            </h1>
          </div>
        </header>

        <section className="surface-card space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="label-md text-[11px] text-muted-foreground">
                Total value
              </p>
              <p className="heading-display-sm text-2xl text-foreground">
                {formatUsd(totalValueUsd)}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums text-muted-foreground">
                <span>
                  Available balance{" "}
                  <span className="title-md text-foreground">
                    {formatUsd(balanceUsd)}
                  </span>
                </span>
                <span>
                  Active bets{" "}
                  <span className="title-md text-foreground">
                    {formatUsd(activeBetsValueUsd)}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-surface-alt/60 p-3">
              <p className="label-md text-[11px] text-muted-foreground">Today P&amp;L</p>
              <p
                className={
                  "title-md mt-1 text-sm tabular-nums " +
                  (todayPnl > 0 ? "text-yes" : todayPnl < 0 ? "text-no" : "text-foreground")
                }
              >
                {todayPnl > 0 ? "+" : ""}
                {formatUsd(todayPnl)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-surface-alt/60 p-3">
              <p className="label-md text-[11px] text-muted-foreground">Total P&amp;L</p>
              <p
                className={
                  "title-md mt-1 text-sm tabular-nums " +
                  (allPnl > 0 ? "text-yes" : allPnl < 0 ? "text-no" : "text-foreground")
                }
              >
                {allPnl > 0 ? "+" : ""}
                {formatUsd(allPnl)}
              </p>
            </div>
          </div>
        </section>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "active" | "settled")}
          className="w-full"
        >
          <TabsList className="h-9 w-full max-w-none bg-muted/40 sm:max-w-xs">
            <TabsTrigger value="active" className={segmentedTriggerClass}>
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="settled" className={segmentedTriggerClass}>
              Settled ({settledCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3">
          {list.map((p) => {
            const settledMeta = p.closedAt ? DEMO_SETTLED_META[p.id] : undefined
            return (
              <PositionCard
                key={p.id}
                position={p}
                settledResult={settledMeta?.result}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

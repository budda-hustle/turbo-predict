"use client"

import * as React from "react"

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

export default function PositionsPage() {
  const balanceUsd = 4_825
  const [tab, setTab] = React.useState<"active" | "closed">("active")

  const list = React.useMemo(
    () =>
      DEMO_POSITIONS.filter((p) =>
        tab === "closed" ? Boolean(p.closedAt) : !p.closedAt
      ),
    [tab]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Portfolio
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Positions
            </h1>
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              Balance{" "}
              <span className="font-medium text-foreground">
                {formatUsd(balanceUsd)}
              </span>
            </p>
          </div>
        </header>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "active" | "closed")}
          className="w-full"
        >
          <TabsList className="h-9 w-full max-w-xs bg-muted/40">
            <TabsTrigger value="active" className="flex-1 text-xs">
              Active
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1 text-xs">
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3">
          {list.map((p) => (
            <PositionCard key={p.id} position={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

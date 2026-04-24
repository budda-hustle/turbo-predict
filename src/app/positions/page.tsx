"use client"

import * as React from "react"
import Link from "next/link"
import { GemIcon, TrophyIcon } from "lucide-react"

import { LegalFooter } from "@/components/legal-footer"
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
  const [tab, setTab] = React.useState<"active" | "settled">("active")

  const activePredictionsValueUsd = React.useMemo(
    () =>
      DEMO_POSITIONS.filter((p) => !p.closedAt).reduce(
        (acc, p) => acc + p.costBasisUsd,
        0
      ),
    []
  )
  const totalWonUsd = React.useMemo(
    () =>
      DEMO_POSITIONS.filter((p) => (p.settledPnlUsd ?? 0) > 0).reduce(
        (acc, p) => acc + (p.settledPnlUsd ?? 0),
        0
      ),
    []
  )
  const activeCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => !p.closedAt).length,
    []
  )
  const wonCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => (p.settledPnlUsd ?? 0) > 0).length,
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
              My Predictions
            </h1>
          </div>
        </header>

        <section className="surface-card p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-xl border border-transparent bg-[linear-gradient(180deg,rgba(0,196,140,0.05)_0%,rgba(0,0,0,0.24)_100%),linear-gradient(135deg,rgba(0,196,140,0.22),rgba(0,196,140,0.06)_45%,rgba(255,255,255,0.06))] [background-clip:padding-box,border-box] px-3 py-2.5">
              <div
                className="pointer-events-none absolute -left-8 top-1/2 size-28 -translate-y-1/2 rounded-full bg-yes/25 blur-2xl"
                aria-hidden
              />
              <div className="flex items-center gap-2.5">
                <div className="inline-flex size-9 items-center justify-center rounded-full border border-yes/35 bg-yes/10 text-yes shadow-[0_0_18px_-6px_rgba(0,196,140,0.85)]">
                  <GemIcon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="label-md text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                    Active predictions
                  </p>
                  <p className="title-md mt-0.5 text-[27px] leading-none tabular-nums text-foreground">
                    {formatUsd(activePredictionsValueUsd)}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-md bg-yes/10 px-2 py-0.5 text-xs font-medium text-yes">
                    • {activeCount} predictions
                  </span>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-transparent bg-[linear-gradient(180deg,rgba(255,192,64,0.06)_0%,rgba(0,0,0,0.24)_100%),linear-gradient(135deg,rgba(255,192,64,0.24),rgba(255,192,64,0.08)_45%,rgba(255,255,255,0.06))] [background-clip:padding-box,border-box] px-3 py-2.5">
              <div
                className="pointer-events-none absolute -left-8 top-1/2 size-28 -translate-y-1/2 rounded-full bg-amber-300/20 blur-2xl"
                aria-hidden
              />
              <div className="flex items-center gap-2.5">
                <div className="inline-flex size-9 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-[0_0_18px_-6px_rgba(255,192,64,0.85)]">
                  <TrophyIcon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="label-md text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                    Total won
                  </p>
                  <p className="title-md mt-0.5 text-[27px] leading-none tabular-nums text-foreground">
                    {formatUsd(totalWonUsd)}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-md bg-amber-300/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                    • {wonCount} won
                  </span>
                </div>
              </div>
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
              Resolved ({settledCount})
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
      <LegalFooter />
    </div>
  )
}

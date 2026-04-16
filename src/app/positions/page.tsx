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

type DemoOrder = {
  id: string
  marketId: string
  marketName: string
  outcomeSide: "YES" | "NO"
  actionSide: "Buy" | "Sell"
  orderType: "Limit"
  price: number
  shares: number
  createdAt: string
  status: "Open" | "Partially filled"
}

type DemoHistoryItem = {
  id: string
  marketId: string
  marketName: string
  outcomeSide: "YES" | "NO"
  action: "Bought" | "Sold" | "Redeemed" | "Order cancelled"
  price: number
  shares: number
  at: string
  result?: "Win" | "Loss" | "Neutral"
}

const DEMO_OPEN_ORDERS: readonly DemoOrder[] = [
  {
    id: "ord-1",
    marketId: "democratic-presidential-nominee-2028",
    marketName: "Democratic Presidential Nominee 2028",
    outcomeSide: "YES",
    actionSide: "Buy",
    orderType: "Limit",
    price: 0.34,
    shares: 1200,
    createdAt: "2026-04-15T10:42:00.000Z",
    status: "Open",
  },
  {
    id: "ord-2",
    marketId: "republican-presidential-nominee-2028",
    marketName: "Republican Presidential Nominee 2028",
    outcomeSide: "NO",
    actionSide: "Sell",
    orderType: "Limit",
    price: 0.29,
    shares: 850,
    createdAt: "2026-04-15T12:18:00.000Z",
    status: "Partially filled",
  },
]

const DEMO_HISTORY: readonly DemoHistoryItem[] = [
  {
    id: "hist-1",
    marketId: "fed-rate-cut-by-july-2026",
    marketName: "Fed rate cut by July 2026?",
    outcomeSide: "YES",
    action: "Redeemed",
    price: 1,
    shares: 1000,
    at: "2026-04-11T09:05:00.000Z",
    result: "Win",
  },
  {
    id: "hist-2",
    marketId: "btc-100k-2026",
    marketName: "Will BTC close above $100k before 2027?",
    outcomeSide: "YES",
    action: "Sold",
    price: 0.5,
    shares: 400,
    at: "2026-04-10T16:25:00.000Z",
    result: "Neutral",
  },
  {
    id: "hist-3",
    marketId: "ukraine-ceasefire-2026",
    marketName: "Official Ukraine–Russia ceasefire announced before 2027?",
    outcomeSide: "YES",
    action: "Order cancelled",
    price: 0.31,
    shares: 900,
    at: "2026-04-09T10:15:00.000Z",
  },
  {
    id: "hist-4",
    marketId: "democratic-presidential-nominee-2028",
    marketName: "Democratic Presidential Nominee 2028",
    outcomeSide: "YES",
    action: "Bought",
    price: 0.31,
    shares: 2000,
    at: "2026-04-08T13:32:00.000Z",
  },
]

const segmentedTriggerClass =
  "flex-1 text-xs text-muted-foreground data-[state=active]:border data-[state=active]:border-[#d2a63a] data-[state=active]:text-[#f2bb2e] data-[state=active]:bg-[linear-gradient(180deg,rgba(255,215,100,0.18)_0%,rgba(255,200,60,0.12)_40%,rgba(180,120,0,0.18)_100%)]"

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function PositionsPage() {
  const balanceUsd = 4_825
  const [section, setSection] = React.useState<"portfolio" | "orders" | "history">(
    "portfolio"
  )
  const [tab, setTab] = React.useState<"active" | "closed">("active")

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
  const investedUsd = React.useMemo(
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
  const portfolioValueUsd = balanceUsd + positionsValueUsd
  const activeCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => !p.closedAt).length,
    []
  )
  const closedCount = React.useMemo(
    () => DEMO_POSITIONS.filter((p) => Boolean(p.closedAt)).length,
    []
  )

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
            <Link
              href="/"
              className="button-md text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back
            </Link>
            <h1 className="heading-display-sm text-xl sm:text-2xl">
              Portfolio
            </h1>
          </div>
        </header>

        <section className="surface-card space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="label-md text-[11px] text-muted-foreground">
                Portfolio value
              </p>
              <p className="heading-display-sm text-2xl text-foreground">
                {formatUsd(portfolioValueUsd)}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums text-muted-foreground">
                <span>
                  Available to trade{" "}
                  <span className="title-md text-foreground">
                    {formatUsd(balanceUsd)}
                  </span>
                </span>
                <span>
                  Invested{" "}
                  <span className="title-md text-foreground">
                    {formatUsd(investedUsd)}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button-md rounded-md border border-border-subtle bg-surface-alt px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Deposit
              </button>
              <button
                type="button"
                className="button-md rounded-md border border-border-subtle bg-surface-alt px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
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
          value={section}
          onValueChange={(v) => setSection(v as "portfolio" | "orders" | "history")}
          className="w-full"
        >
          <TabsList className="h-9 w-full max-w-md bg-muted/40">
            <TabsTrigger value="portfolio" className={segmentedTriggerClass}>
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="orders" className={segmentedTriggerClass}>
              Open orders ({DEMO_OPEN_ORDERS.length})
            </TabsTrigger>
            <TabsTrigger value="history" className={segmentedTriggerClass}>
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {section === "portfolio" ? (
          <>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "active" | "closed")}
              className="w-full"
            >
              <TabsList className="h-9 w-full max-w-xs bg-muted/40">
                <TabsTrigger value="active" className={segmentedTriggerClass}>
                  Active ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="closed" className={segmentedTriggerClass}>
                  Closed ({closedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-3">
              {list.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>
          </>
        ) : section === "orders" ? (
          <div className="flex flex-col gap-3">
            {DEMO_OPEN_ORDERS.map((o) => {
              const total = o.price * o.shares
              return (
                <div key={o.id} className="surface-card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/market/${encodeURIComponent(o.marketId)}`}
                        className="title-md block truncate text-sm text-foreground transition-opacity hover:underline hover:underline-offset-4"
                      >
                        {o.marketName}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span
                          className={
                            "label-md rounded-full border px-2 py-0.5 " +
                            (o.outcomeSide === "YES"
                              ? "border-yes/35 bg-yes/15 text-yes-foreground"
                              : "border-no/35 bg-no/15 text-no-foreground")
                          }
                        >
                          {o.outcomeSide}
                        </span>
                        <span>{o.actionSide}</span>
                        <span>•</span>
                        <span>{o.orderType}</span>
                        <span>•</span>
                        <span>{o.status}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button-md shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums text-muted-foreground">
                    <span>
                      Price <span className="title-md text-foreground">{Math.round(o.price * 100)}¢</span>
                    </span>
                    <span>
                      Shares <span className="title-md text-foreground">{o.shares.toFixed(2)}</span>
                    </span>
                    <span>
                      Total <span className="title-md text-foreground">{formatUsd(total)}</span>
                    </span>
                    <span>
                      Created{" "}
                      <span className="title-md text-foreground">{formatDateTime(o.createdAt)}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {DEMO_HISTORY.map((h) => {
              const total = h.price * h.shares
              return (
                <div key={h.id} className="surface-card space-y-3 p-4">
                  <div className="space-y-1">
                    <Link
                      href={`/market/${encodeURIComponent(h.marketId)}`}
                      className="title-md block truncate text-sm text-foreground transition-opacity hover:underline hover:underline-offset-4"
                    >
                      {h.marketName}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span
                        className={
                          "label-md rounded-full border px-2 py-0.5 " +
                          (h.outcomeSide === "YES"
                            ? "border-yes/35 bg-yes/15 text-yes-foreground"
                            : "border-no/35 bg-no/15 text-no-foreground")
                        }
                      >
                        {h.outcomeSide}
                      </span>
                      <span>{h.action}</span>
                      {h.result ? (
                        <>
                          <span>•</span>
                          <span>{h.result}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums text-muted-foreground">
                    <span>
                      Price <span className="title-md text-foreground">{Math.round(h.price * 100)}¢</span>
                    </span>
                    <span>
                      Shares <span className="title-md text-foreground">{h.shares.toFixed(2)}</span>
                    </span>
                    <span>
                      Total <span className="title-md text-foreground">{formatUsd(total)}</span>
                    </span>
                    <span>
                      Time <span className="title-md text-foreground">{formatDateTime(h.at)}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

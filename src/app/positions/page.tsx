"use client"

import * as React from "react"
import Link from "next/link"
import { GemIcon, ShieldCheckIcon, TrophyIcon } from "lucide-react"

import { LegalFooter } from "@/components/legal-footer"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatUsd } from "@/lib/markets"
import type { Position } from "@/lib/trading-context"

type DemoPosition = Position & { cashoutAmount?: number }

const INITIAL_DEMO_POSITIONS: readonly DemoPosition[] = [
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
    cashoutAmount: 740,
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
    cashoutAmount: 1020,
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
  const [positions, setPositions] = React.useState<DemoPosition[]>([
    ...INITIAL_DEMO_POSITIONS,
  ])
  const [settledMetaById, setSettledMetaById] = React.useState(DEMO_SETTLED_META)
  const [cashoutTargetId, setCashoutTargetId] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{
    title: string
    description: string
  } | null>(null)

  const activePredictionsValueUsd = React.useMemo(
    () =>
      positions.filter((p) => !p.closedAt).reduce(
        (acc, p) => acc + p.costBasisUsd,
        0
      ),
    [positions]
  )
  const totalWonUsd = React.useMemo(
    () =>
      positions
        .filter((p) => Boolean(p.closedAt))
        .filter((p) => settledMetaById[p.id]?.result === "Won")
        .reduce((acc, p) => acc + (p.settledPnlUsd ?? 0), 0),
    [positions, settledMetaById]
  )
  const activeCount = React.useMemo(
    () => positions.filter((p) => !p.closedAt).length,
    [positions]
  )
  const wonCount = React.useMemo(
    () =>
      positions
        .filter((p) => Boolean(p.closedAt))
        .filter((p) => settledMetaById[p.id]?.result === "Won").length,
    [positions, settledMetaById]
  )
  const settledCount = React.useMemo(
    () => positions.filter((p) => Boolean(p.closedAt)).length,
    [positions]
  )

  const list = React.useMemo(
    () =>
      positions.filter((p) =>
        tab === "settled" ? Boolean(p.closedAt) : !p.closedAt
      ),
    [tab, positions]
  )
  const cashoutTarget = React.useMemo(
    () => positions.find((p) => p.id === cashoutTargetId) ?? null,
    [positions, cashoutTargetId]
  )
  const cashoutAmount = cashoutTarget?.cashoutAmount ?? 0

  React.useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  function confirmCashout() {
    if (!cashoutTarget) return
    const amount = cashoutTarget.cashoutAmount ?? 0
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== cashoutTarget.id) return p
        return {
          ...p,
          shares: 0,
          closedAt: new Date().toISOString(),
          settledPnlUsd: amount - p.costBasisUsd,
          cashoutAmount: undefined,
        }
      })
    )
    setSettledMetaById((prev) => ({
      ...prev,
      [cashoutTarget.id]: { result: "Cashed out", claimed: true },
    }))
    setCashoutTargetId(null)
    setToast({
      title: "Cashout successful",
      description: `${formatUsd(amount)} has been added to your balance.`,
    })
  }

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
            const settledMeta = p.closedAt ? settledMetaById[p.id] : undefined
            return (
              <PositionCard
                key={p.id}
                position={p}
                settledResult={settledMeta?.result}
                cashoutAmount={!p.closedAt ? p.cashoutAmount : undefined}
                onCashout={
                  !p.closedAt && p.cashoutAmount != null
                    ? () => setCashoutTargetId(p.id)
                    : undefined
                }
              />
            )
          })}
        </div>
      </div>
      <LegalFooter />
      <Dialog
        open={cashoutTarget != null}
        onOpenChange={(open) => !open && setCashoutTargetId(null)}
      >
        <DialogContent className="max-w-md border border-white/12 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,215,0,0.05)_0%,rgba(255,255,255,0.01)_42%,rgba(0,0,0,0.4)_100%)] shadow-[0_20px_60px_-40px_rgba(0,0,0,0.95)] [background-clip:padding-box]">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2 text-lg font-semibold tracking-[0.02em] text-foreground">
              <ShieldCheckIcon className="size-4 text-primary/65" />
              Cash out prediction?
            </DialogTitle>
          </DialogHeader>
          <div className="mx-auto my-1 w-full max-w-xs rounded-xl border border-[#c89b2c]/40 bg-[linear-gradient(180deg,rgba(243,213,105,0.12)_0%,rgba(223,182,47,0.07)_52%,rgba(184,134,6,0.12)_100%)] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
              You receive now
            </p>
            <p className="mt-1 text-4xl leading-none font-semibold tabular-nums text-[#f3d569]">
              {formatUsd(cashoutAmount)}
            </p>
          </div>
          <DialogDescription className="mx-auto max-w-[34ch] text-center text-sm leading-relaxed text-muted-foreground">
            This will close your position. You won&apos;t receive the full payout
            if the prediction resolves in your favor.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashoutTargetId(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmCashout}
              className="h-10 min-w-[11rem] border border-[#c89b2c] bg-[linear-gradient(180deg,#f3d569_0%,#dfb62f_52%,#b88606_100%)] text-sm font-semibold text-[#1f1500] shadow-[0_8px_24px_-14px_rgba(223,182,47,0.85)] transition-all hover:brightness-105 hover:shadow-[0_10px_28px_-14px_rgba(223,182,47,0.95)]"
            >
              Cash out {formatUsd(cashoutAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {toast ? (
        <div className="fixed right-4 bottom-4 z-[100] w-[min(92vw,360px)] rounded-xl border border-border-subtle bg-surface-alt p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {toast.description}
          </p>
        </div>
      ) : null}
    </div>
  )
}

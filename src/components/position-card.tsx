"use client"

import Link from "next/link"

import { formatUsd } from "@/lib/markets"
import type { Position } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

type SettledResult = "Won" | "Lost" | "Cashed out"

export function PositionCard({
  position,
  settledResult,
}: {
  position: Position
  settledResult?: SettledResult
}) {
  const question = position.question || "Market"
  const currentPrice = position.closedAt ? null : position.markPrice

  const pnlUsd = position.closedAt
    ? (position.settledPnlUsd ?? 0)
    : currentPrice != null
      ? position.shares * currentPrice - position.costBasisUsd
      : 0
  const pnlPct =
    position.costBasisUsd > 0 ? (pnlUsd / position.costBasisUsd) * 100 : 0

  const leg = position.outcomeLeg ?? "yes"
  const chipIsYes = leg === "yes"
  const chipIsNo = leg === "no"
  const binaryChip = chipIsYes || chipIsNo
  const sideLabel = chipIsNo ? "NO" : "YES"

  const toWinUsd =
    position.closedAt && position.settledPnlUsd != null
      ? position.costBasisUsd + Math.max(position.settledPnlUsd, 0)
      : position.shares

  const isResolved = Boolean(position.closedAt)
  const resultLabel: SettledResult | undefined = isResolved
    ? settledResult ?? ((position.settledPnlUsd ?? 0) > 0 ? "Won" : "Lost")
    : undefined
  const metricItemClass = "text-xs font-medium tabular-nums text-muted-foreground"
  const metricValueClass = "text-xs font-medium text-foreground"

  return (
    <div
      className={cn(
        "surface-card flex cursor-default flex-col gap-3 p-4 text-left transition-colors duration-150"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "label-md shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
              binaryChip && chipIsYes
                ? "border-yes/35 bg-yes/15 text-yes-foreground"
                : binaryChip && chipIsNo
                  ? "border-no/35 bg-no/15 text-no-foreground"
                  : "border-border-subtle bg-surface-alt text-muted-foreground"
            )}
          >
            {binaryChip ? sideLabel : position.outcomeLabel}
          </span>
          {!binaryChip ? null : (
            <span className="body-sm truncate text-xs text-muted-foreground">
              {position.outcomeLabel}
            </span>
          )}
        </div>
        {isResolved && resultLabel === "Won" ? (
          <span className="shrink-0 rounded-full border border-yes/35 bg-yes/15 px-2 py-0.5 text-xs font-medium text-yes-foreground">
            WON
          </span>
        ) : null}
        {isResolved && resultLabel === "Lost" ? (
          <span className="shrink-0 rounded-full border border-no/35 bg-no/15 px-2 py-0.5 text-xs font-medium text-no-foreground">
            LOST
          </span>
        ) : null}
        {isResolved && resultLabel === "Cashed out" ? (
          <span className="shrink-0 rounded-full border border-border-subtle bg-surface-alt px-2 py-0.5 text-xs font-medium text-muted-foreground">
            CASHED OUT
          </span>
        ) : null}
      </div>

      <Link
        href={`/market/${encodeURIComponent(position.marketId)}`}
        className="title-md text-sm text-foreground transition-opacity hover:underline hover:decoration-border-strong hover:underline-offset-4"
      >
        {question}
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 body-sm text-xs tabular-nums text-muted-foreground lg:flex-nowrap">
        <span className={metricItemClass}>
          Bet{" "}
          <span className={metricValueClass}>
            {formatUsd(position.costBasisUsd)}
          </span>
        </span>
        <span className={metricItemClass}>
          Entry{" "}
          <span className={metricValueClass}>
            {Math.round(position.avgPrice * 100)}%
          </span>
        </span>
        {!isResolved ? (
          <span className={metricItemClass}>
            Current probability{" "}
            <span className={metricValueClass}>
              {currentPrice == null
                ? "—"
                : `${Math.round(currentPrice * 100)}%`}
            </span>
          </span>
        ) : null}
        <span className={metricItemClass}>
          P&amp;L{" "}
          <span
            className={cn(
              "text-xs font-medium",
              pnlUsd > 0 && "text-yes",
              pnlUsd < 0 && "text-no",
              pnlUsd === 0 && "text-foreground"
            )}
          >
            {pnlUsd > 0 ? "+" : ""}
            {formatUsd(pnlUsd)}
            {" · "}
            {pnlPct > 0 ? "+" : ""}
            {pnlPct.toFixed(1)}%
          </span>
        </span>
        {!isResolved ? (
          <span className={metricItemClass}>
            Payout <span className={metricValueClass}>{formatUsd(toWinUsd)}</span>
          </span>
        ) : null}
        {isResolved && position.closedAt ? (
          <span className={metricItemClass}>
            Settled{" "}
            <span className={metricValueClass}>
              {new Date(position.closedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  )
}

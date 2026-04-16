"use client"

import Link from "next/link"

import { formatUsd } from "@/lib/markets"
import type { Position } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

export function PositionCard({ position }: { position: Position }) {
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
  const valueUsd =
    currentPrice != null
      ? position.shares * currentPrice
      : position.costBasisUsd + (position.settledPnlUsd ?? 0)

  const isResolved = Boolean(position.closedAt)
  const isWinningResolved = isResolved && (position.settledPnlUsd ?? 0) > 0

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
        {isResolved ? (
          isWinningResolved ? (
            <button
              type="button"
              className="button-md shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              Redeem
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="button-md shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-[11px] text-muted-foreground/50"
            >
              Redeem
            </button>
          )
        ) : null}
      </div>

      <Link
        href={`/market/${encodeURIComponent(position.marketId)}`}
        className="title-md text-sm text-foreground transition-opacity hover:underline hover:decoration-border-strong hover:underline-offset-4"
      >
        {question}
      </Link>

      <div className="flex flex-wrap gap-x-6 gap-y-1 body-sm text-xs tabular-nums text-muted-foreground">
        <span>
          Avg price{" "}
          <span className="title-md text-foreground">
            {Math.round(position.avgPrice * 100)}¢
          </span>
        </span>
        <span>
          Now{" "}
          <span className="title-md text-foreground">
            {currentPrice == null
              ? "—"
              : `${Math.round(currentPrice * 100)}¢`}
          </span>
        </span>
        <span>
          P&amp;L{" "}
          <span
            className={cn(
              "title-md",
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
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 body-sm text-[11px] tabular-nums text-muted-foreground/85">
        <span>
          Traded <span className="text-foreground/90">{formatUsd(position.costBasisUsd)}</span>
        </span>
        <span>
          To win <span className="text-foreground/90">{formatUsd(toWinUsd)}</span>
        </span>
        <span>
          Value <span className="text-foreground/90">{formatUsd(valueUsd)}</span>
        </span>
      </div>
    </div>
  )
}

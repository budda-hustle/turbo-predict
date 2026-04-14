"use client"

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
  const labelLower = position.outcomeLabel.toLowerCase()
  const chipIsYes =
    leg === "yes" && (labelLower === "yes" || labelLower.endsWith(" · yes"))
  const chipIsNo =
    leg === "no" || labelLower === "no" || labelLower.endsWith(" · no")
  const binaryChip = chipIsYes || chipIsNo

  return (
    <div
      className={cn(
        "surface-card flex cursor-default flex-col gap-3 p-4 text-left transition-colors duration-150"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "max-w-[70%] truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
            binaryChip && chipIsYes
              ? "border-yes/40 bg-yes-muted/30 text-yes-foreground"
              : binaryChip && chipIsNo
                ? "border-no/40 bg-no-muted/30 text-no-foreground"
                : "border-border/70 bg-muted/30 text-muted-foreground"
          )}
        >
          {position.outcomeLabel}
        </span>
        {position.closedAt && (
          <span className="text-[11px] text-muted-foreground">Closed</span>
        )}
      </div>
      <p className="text-sm font-medium leading-snug text-foreground">{question}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
        <span>
          Avg{" "}
          <span className="text-foreground">
            {Math.round(position.avgPrice * 100)}¢
          </span>
        </span>
        <span>
          {position.closedAt ? "Exit" : "Now"}{" "}
          <span className="text-foreground">
            {currentPrice == null
              ? "—"
              : `${Math.round(currentPrice * 100)}¢`}
          </span>
        </span>
        <span>
          P&amp;L{" "}
          <span
            className={cn(
              "font-medium",
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
    </div>
  )
}

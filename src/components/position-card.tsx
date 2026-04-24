"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, CopyIcon } from "lucide-react"

import { formatUsd } from "@/lib/markets"
import { formatDecimalOdds } from "@/lib/odds"
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
  const [copied, setCopied] = React.useState(false)
  const question = position.question || "Market"

  const leg = position.outcomeLeg ?? "yes"
  const chipIsYes = leg === "yes"
  const chipIsNo = leg === "no"
  const binaryChip = chipIsYes || chipIsNo
  const sideLabel = chipIsNo ? "NO" : "YES"

  const toWinUsd =
    position.closedAt && position.settledPnlUsd != null
      ? Math.max(position.costBasisUsd + position.settledPnlUsd, 0)
      : position.shares

  const isResolved = Boolean(position.closedAt)
  const resultLabel: SettledResult | undefined = isResolved
    ? settledResult ?? ((position.settledPnlUsd ?? 0) > 0 ? "Won" : "Lost")
    : undefined
  const metricItemClass = "text-xs font-medium tabular-nums text-muted-foreground"
  const metricValueClass = "text-xs font-medium text-foreground"
  const predictionId = position.id
  const betTimeLabel = new Date(position.openedAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  })
  const resolvedTimeLabel =
    isResolved && position.closedAt
      ? new Date(position.closedAt).toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })
      : null
  const priceOdds = formatDecimalOdds(position.avgPrice)

  async function copyPredictionId() {
    try {
      await navigator.clipboard.writeText(predictionId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={cn(
        "surface-card flex cursor-default flex-col gap-2 p-4 text-left transition-colors duration-150"
      )}
    >
      <div className="flex items-center justify-between gap-1.5 leading-none">
        <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
          ID: <span>{predictionId}</span>
          <button
            type="button"
            onClick={copyPredictionId}
            aria-label="Copy ID"
            className="inline-flex cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
          </button>
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{betTimeLabel}</span>
      </div>
      <div className="border-t border-border/50" />

      <div className="flex items-start justify-between gap-3">
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
        <div className="flex items-center gap-2">
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
      </div>

      <Link
        href={`/market/${encodeURIComponent(position.marketId)}`}
        className="title-md text-sm text-foreground transition-opacity hover:underline hover:decoration-border-strong hover:underline-offset-4"
      >
        {question}
      </Link>

      <div className="flex items-end justify-between gap-3 pt-0.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 body-sm text-xs tabular-nums text-muted-foreground">
          <span className={metricItemClass}>
            Price <span className={metricValueClass}>{priceOdds}</span>
          </span>
          <span aria-hidden className="text-muted-foreground/60">
            ·
          </span>
          <span className={metricItemClass}>
            Amount invested{" "}
            <span className={metricValueClass}>
              {formatUsd(position.costBasisUsd)}
            </span>
          </span>
          {isResolved && resolvedTimeLabel ? (
            <>
              <span aria-hidden className="text-muted-foreground/60">
                ·
              </span>
              <span className={metricItemClass}>
                Resolved <span className={metricValueClass}>{resolvedTimeLabel}</span>
              </span>
            </>
          ) : null}
        </div>
        <div className="ml-auto shrink-0 text-right tabular-nums">
          <p className="text-[11px] font-medium text-muted-foreground">Possible win:</p>
          <p className="text-base font-semibold text-yes sm:text-lg">
            {formatUsd(toWinUsd)}
          </p>
        </div>
      </div>
    </div>
  )
}

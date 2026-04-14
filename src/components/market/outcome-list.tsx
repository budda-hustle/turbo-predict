"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { ContractPriceChart } from "@/components/market/contract-price-chart"
import type { MarketViewModel } from "@/lib/market-view-model"
import type { OutcomeLeg } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

/** Demo-only intraday-style delta (stable per slug + index). */
function demoDeltaPercent(slug: string, outcomeIndex: number): number {
  const s = `${slug}#${outcomeIndex}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (Math.abs(h) % 11) - 5
}

function deltaStr(delta: number): string {
  if (delta === 0) return "0%"
  return `${delta > 0 ? "+" : ""}${delta}%`
}

/**
 * Fixed width so every row aligns; fits "100¢ Buy Yes" / "100¢ Buy No" at 11px mono
 * without truncate (see home `chipBase` for card chips only).
 */
const tradeOutcomeChip =
  "inline-flex h-8 w-[10.75rem] shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-md border px-2.5 font-mono text-xs tabular-nums transition-colors duration-150"

export function OutcomeList({
  market,
  selectedContractId,
  selectedLeg,
  expandedContractId,
  onSelectContract,
  onToggleExpandContract,
  onTradeSide,
  disabled,
}: {
  market: MarketViewModel
  selectedContractId: string
  selectedLeg: OutcomeLeg
  expandedContractId: string | null
  onSelectContract: (contractId: string) => void
  onToggleExpandContract: (contractId: string) => void
  /** Buy Yes / Buy No for this contract (Yes = `yesPrice`, No = `noPrice`). */
  onTradeSide: (contractId: string, leg: OutcomeLeg) => void
  disabled?: boolean
}) {
  const rowDisabled = Boolean(disabled || market.status !== "open")
  const isGrouped = market.marketType === "multi"
  const contractRows =
    market.marketType === "binary"
      ? market.contracts.slice(0, 1)
      : market.contracts

  return (
    <section className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Contracts
      </p>
      <ul className="space-y-1.5">
        {contractRows.map((c, i) => {
          const active = c.id === selectedContractId
          const yesSelected = active && selectedLeg === "yes"
          const noSelected = active && selectedLeg === "no"
          const expanded = expandedContractId === c.id
          const pct = Math.round(c.yesPrice * 100)
          const yesCents = Math.round(c.yesPrice * 100)
          const noCents = Math.round(c.noPrice * 100)
          const delta = demoDeltaPercent(market.slug, i)
          const dStr = deltaStr(delta)

          const tone = active
            ? "border-border/50 bg-primary/10 text-foreground"
            : isGrouped
              ? "border-border/50 bg-card/40"
              : "border-border/50 bg-card/40 hover:bg-muted/40"

          const rowSelectClass =
            "flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md py-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"

          function rowSelectKey(e: React.KeyboardEvent) {
            if (rowDisabled) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onSelectContract(c.id)
            }
          }

          return (
            <li key={`${c.id}-${i}`}>
              <div
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                  tone
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <button
                    type="button"
                    disabled={rowDisabled}
                    aria-label={expanded ? "Collapse chart" : "Expand chart"}
                    aria-expanded={expanded}
                    className={cn(
                      "pressable shrink-0 cursor-pointer rounded-md border border-transparent p-1 text-muted-foreground/80 outline-none transition-colors",
                      "hover:text-foreground/80",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      rowDisabled && "pointer-events-none opacity-50"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (rowDisabled) return
                      onToggleExpandContract(c.id)
                    }}
                  >
                    <ChevronRightIcon
                      className={cn(
                        "size-4 transition-transform duration-200",
                        expanded && "rotate-90"
                      )}
                      aria-hidden
                    />
                  </button>

                  <div
                    role="button"
                    tabIndex={rowDisabled ? -1 : 0}
                    aria-pressed={active}
                    aria-disabled={rowDisabled}
                    onClick={() => {
                      if (rowDisabled) return
                      onSelectContract(c.id)
                    }}
                    onKeyDown={rowSelectKey}
                    className={cn(rowSelectClass, "-mx-0.5 px-0.5")}
                  >
                    <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
                      {c.name.trim()}
                    </span>
                    <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                      {pct}%
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium tabular-nums",
                        delta > 0 && "text-yes",
                        delta < 0 && "text-no",
                        delta === 0 && "text-muted-foreground"
                      )}
                    >
                      {dStr}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "ml-auto flex shrink-0 flex-wrap justify-end gap-1.5",
                      rowDisabled && "pointer-events-none opacity-50"
                    )}
                  >
                    <button
                      type="button"
                      disabled={rowDisabled}
                      className={cn(
                        tradeOutcomeChip,
                        "pressable text-muted-foreground",
                        yesSelected
                          ? "border-yes/20 bg-yes text-background hover:bg-yes/90 active:bg-yes/85"
                          : "border-yes/25 bg-transparent hover:border-yes/30 hover:bg-yes-muted/15 active:border-yes/20 active:bg-yes-muted/22"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "yes")
                      }}
                    >
                      <span className="font-medium text-yes-foreground">
                        {yesCents}¢
                      </span>{" "}
                      <span className={cn(yesSelected ? "text-background" : "text-muted-foreground")}>
                        Buy Yes
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={rowDisabled}
                      className={cn(
                        tradeOutcomeChip,
                        "pressable text-muted-foreground",
                        noSelected
                          ? "border-no/20 bg-no text-background hover:bg-no/90 active:bg-no/85"
                          : "border-no/25 bg-transparent hover:border-no/30 hover:bg-no-muted/15 active:border-no/20 active:bg-no-muted/22"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "no")
                      }}
                    >
                      <span className="font-medium text-no-foreground">
                        {noCents}¢
                      </span>{" "}
                      <span className={cn(noSelected ? "text-background" : "text-muted-foreground")}>
                        Buy No
                      </span>
                    </button>
                  </div>

                </div>

                {expanded ? (
                  <div className="border-t border-border/40 pt-3">
                    <ContractPriceChart contract={c} embedded />
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

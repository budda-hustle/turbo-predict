"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { ContractPriceChart } from "@/components/market/contract-price-chart"
import type { MarketViewModel } from "@/lib/market-view-model"
import { formatDecimalOdds } from "@/lib/odds"
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
 * Fixed width so every row aligns; fits "YES 100%" / "NO 100%" at 11px mono
 * without truncate (see home `chipBase` for card chips only).
 */
const tradeOutcomeChip =
  "button-md inline-flex h-8 w-[10.75rem] shrink-0 items-center justify-between whitespace-nowrap rounded-md border px-2.5 text-xs tabular-nums transition-colors duration-150"

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
      <p className="label-md text-muted-foreground">
        Contracts
      </p>
      <ul className="space-y-1.5">
        {contractRows.map((c, i) => {
          const active = c.id === selectedContractId
          const yesSelected = active && selectedLeg === "yes"
          const noSelected = active && selectedLeg === "no"
          const expanded = expandedContractId === c.id
          const pct = Math.round(c.yesPrice * 100)
          const yesOdds = formatDecimalOdds(c.yesPrice)
          const noOdds = formatDecimalOdds(c.noPrice)
          const delta = demoDeltaPercent(market.slug, i)
          const dStr = deltaStr(delta)

          const tone = active
            ? "border-white/14 bg-card bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] text-content-primary shadow-[0_8px_20px_-16px_rgba(0,0,0,0.6)]"
            : isGrouped
              ? "border-white/8 bg-card bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)]"
              : "border-white/8 bg-card bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] hover:border-white/14"

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
                  "flex flex-col gap-1.5 rounded-lg border px-3 py-2 transition-all duration-200 ease-out",
                  tone
                )}
              >
                <div className="space-y-2 md:hidden">
                  <div className="flex min-w-0 items-center gap-2">
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
                      className={cn(
                        "flex min-w-0 flex-1 cursor-pointer items-center gap-x-2 rounded-md py-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                        "-mx-0.5 px-0.5"
                      )}
                    >
                      <span className="title-md min-w-0 truncate text-[13px] text-foreground">
                        {c.name.trim()}
                      </span>
                      <span className="title-xl text-lg tabular-nums text-foreground">
                        {pct}%
                      </span>
                      <span
                        className={cn(
                          "title-md text-[11px] tabular-nums",
                          delta > 0 && "text-yes",
                          delta < 0 && "text-no",
                          delta === 0 && "text-muted-foreground"
                        )}
                      >
                        {dStr}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid grid-cols-2 gap-1.5",
                      rowDisabled && "pointer-events-none opacity-50"
                    )}
                  >
                    <button
                      type="button"
                      disabled={rowDisabled}
                      className={cn(
                        tradeOutcomeChip,
                        "pressable min-w-0 w-full text-muted-foreground",
                        yesSelected
                          ? "border-yes/45 bg-[linear-gradient(180deg,rgba(0,122,102,0.3),rgba(0,122,102,0.2))] text-yes-foreground shadow-[0_0_10px_rgba(0,122,102,0.18)] hover:brightness-105"
                          : "border-yes/30 bg-transparent hover:border-yes/45 hover:bg-[linear-gradient(90deg,rgba(0,122,102,0.08),rgba(0,122,102,0.16),rgba(0,122,102,0.08))] active:border-yes/40"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "yes")
                      }}
                    >
                      <span className={cn(yesSelected ? "text-yes-foreground" : "text-muted-foreground")}>
                        YES
                      </span>
                      <span className="title-md text-yes-foreground">{yesOdds}</span>
                    </button>
                    <button
                      type="button"
                      disabled={rowDisabled}
                      className={cn(
                        tradeOutcomeChip,
                        "pressable min-w-0 w-full text-muted-foreground",
                        noSelected
                          ? "border-no/45 bg-[linear-gradient(180deg,rgba(255,64,80,0.3),rgba(255,64,80,0.2))] text-no-foreground shadow-[0_0_10px_rgba(255,64,80,0.16)] hover:brightness-105"
                          : "border-no/30 bg-transparent hover:border-no/45 hover:bg-[linear-gradient(90deg,rgba(255,64,80,0.08),rgba(255,64,80,0.16),rgba(255,64,80,0.08))] active:border-no/40"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "no")
                      }}
                    >
                      <span className={cn(noSelected ? "text-no-foreground" : "text-muted-foreground")}>
                        NO
                      </span>
                      <span className="title-md text-no-foreground">{noOdds}</span>
                    </button>
                  </div>
                </div>

                <div className="hidden flex-wrap items-center gap-x-2 gap-y-2 md:flex">
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
                    <span className="title-md min-w-0 truncate text-[13px] text-foreground">
                      {c.name.trim()}
                    </span>
                    <span className="title-xl text-lg tabular-nums text-foreground">
                      {pct}%
                    </span>
                    <span
                      className={cn(
                        "title-md text-[11px] tabular-nums",
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
                          ? "border-yes/45 bg-[linear-gradient(180deg,rgba(0,122,102,0.3),rgba(0,122,102,0.2))] text-yes-foreground shadow-[0_0_10px_rgba(0,122,102,0.18)] hover:brightness-105"
                          : "border-yes/30 bg-transparent hover:border-yes/45 hover:bg-[linear-gradient(90deg,rgba(0,122,102,0.08),rgba(0,122,102,0.16),rgba(0,122,102,0.08))] active:border-yes/40"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "yes")
                      }}
                    >
                      <span className={cn(yesSelected ? "text-yes-foreground" : "text-muted-foreground")}>
                        YES
                      </span>
                      <span className="title-md text-yes-foreground">{yesOdds}</span>
                    </button>
                    <button
                      type="button"
                      disabled={rowDisabled}
                      className={cn(
                        tradeOutcomeChip,
                        "pressable text-muted-foreground",
                        noSelected
                          ? "border-no/45 bg-[linear-gradient(180deg,rgba(255,64,80,0.3),rgba(255,64,80,0.2))] text-no-foreground shadow-[0_0_10px_rgba(255,64,80,0.16)] hover:brightness-105"
                          : "border-no/30 bg-transparent hover:border-no/45 hover:bg-[linear-gradient(90deg,rgba(255,64,80,0.08),rgba(255,64,80,0.16),rgba(255,64,80,0.08))] active:border-no/40"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (rowDisabled) return
                        onTradeSide(c.id, "no")
                      }}
                    >
                      <span className={cn(noSelected ? "text-no-foreground" : "text-muted-foreground")}>
                        NO
                      </span>
                      <span className="title-md text-no-foreground">{noOdds}</span>
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

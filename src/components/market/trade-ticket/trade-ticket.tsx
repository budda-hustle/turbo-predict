"use client"

import * as React from "react"
import { CircleHelpIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatUsd } from "@/lib/markets"
import type { ContractView, MarketViewModel } from "@/lib/market-view-model"
import { formatDecimalOdds } from "@/lib/odds"
import {
  useTrading,
  type OutcomeLeg,
  type PlaceOrderQuote,
} from "@/lib/trading-context"
import { cn } from "@/lib/utils"

type UiStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string }

function parsePositiveNumber(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) && n > 0 ? n : 0
}

function previewExecPrice(
  marketPrice: number
): { ok: true; price: number } | { ok: false } {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0 || marketPrice >= 1)
    return { ok: false }
  return { ok: true, price: marketPrice }
}

/** Stored on positions / sent in quotes — disambiguates Yes vs No leg on the same row. */
function quoteOutcomeLabel(
  market: MarketViewModel,
  index: number,
  leg: OutcomeLeg
): string {
  const c = market.contracts[index]
  const base = (c?.name ?? "").trim()
  return `${base} · ${leg === "no" ? "No" : "Yes"}`
}

const controlRadius = "rounded-lg"
const controlInnerRadius = "rounded-md"

export function TradeTicket({
  market,
  selectedContract,
  outcomeLeg,
  onOutcomeLegChange,
  shares,
  onSharesChange,
  ui,
  onUiChange,
  onClose,
  onOrderFilled,
}: {
  market: MarketViewModel
  selectedContract: ContractView
  outcomeLeg: OutcomeLeg
  onOutcomeLegChange: (v: OutcomeLeg) => void
  shares: string
  onSharesChange: (v: string) => void
  ui: UiStatus
  onUiChange: React.Dispatch<React.SetStateAction<UiStatus>>
  onClose?: () => void
  onOrderFilled?: () => void
}) {
  const { placeOrder, balanceUsd, openDeposit } = useTrading()

  const selectedContractIndex = React.useMemo(
    () =>
      Math.max(
        0,
        market.contracts.findIndex((c) => c.id === selectedContract.id)
      ),
    [market.contracts, selectedContract.id]
  )

  const basePrice =
    Number.isFinite(selectedContract?.yesPrice) ? selectedContract.yesPrice : 0
  const marketPrice = outcomeLeg === "no" ? 1 - basePrice : basePrice
  const outcomeLabel = quoteOutcomeLabel(
    market,
    selectedContractIndex,
    outcomeLeg
  )
  const outcomePrices = market.contracts.map((c) => c.yesPrice)

  const px = previewExecPrice(marketPrice)
  const betAmount = parsePositiveNumber(shares)
  const execPrice = px.ok ? px.price : 0
  const estPayout =
    betAmount > 0 && px.ok && Number.isFinite(execPrice)
      ? betAmount / Math.max(execPrice, 1e-9)
      : 0
  const estProfit = estPayout - betAmount

  const disabled =
    market.status !== "open" ||
    ui.kind === "loading" ||
    betAmount <= 0 ||
    !px.ok

  const directionWord = outcomeLeg === "yes" ? "YES" : "NO"
  const headingFull = `${selectedContract.name} — ${directionWord}`
  const ctaSide = outcomeLeg === "yes" ? "YES" : "NO"
  const priceOdds = formatDecimalOdds(marketPrice)

  async function onSubmit() {
    onUiChange({ kind: "idle" })
    if (market.status !== "open") return
    if (betAmount <= 0) {
      onUiChange({ kind: "error", message: "Enter a positive bet amount." })
      return
    }
    if (!px.ok) {
      onUiChange({
        kind: "error",
        message: "Invalid probability.",
      })
      return
    }
    if (betAmount > balanceUsd) {
      onUiChange({
        kind: "error",
        message: "Insufficient balance. Deposit to continue.",
      })
      return
    }
    const orderShares = betAmount / Math.max(execPrice, 1e-9)

    const quote: PlaceOrderQuote = {
      marketKey: market.slug,
      question: market.question,
      status: market.status,
      outcomeIndex: selectedContractIndex,
      outcomeLabel,
      outcomeLeg,
      outcomePrices,
      shares: orderShares,
      flow: "buy",
      orderType: "market",
    }

    onUiChange({ kind: "loading" })
    const res = await placeOrder(quote)
    if (!res.ok) {
      if (res.reason === "insufficient") {
        onUiChange({
          kind: "error",
          message: "Insufficient balance. Deposit to continue.",
        })
        return
      }
      if (res.reason === "closed") {
        onUiChange({ kind: "error", message: "This market is closed." })
        return
      }
      if (res.reason === "no_position" || res.reason === "too_many_shares") {
        onUiChange({ kind: "error", message: "Unable to place bet." })
        return
      }
      onUiChange({ kind: "error", message: "Unable to place order." })
      return
    }
    onUiChange({ kind: "success" })
    onOrderFilled?.()
  }

  React.useEffect(() => {
    if (ui.kind !== "success") return
    const t = window.setTimeout(() => onUiChange({ kind: "idle" }), 2400)
    return () => window.clearTimeout(t)
  }, [ui.kind, onUiChange])

  const ctaLabel =
    ui.kind === "loading"
      ? `Buying ${ctaSide}…`
      : `Buy ${ctaSide}`

  return (
    <div
      className={cn(
        "surface-card relative flex flex-col gap-5 border border-white/8 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,215,0,0.02)_0%,transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.24)_100%)] p-5 shadow-lg sm:p-6"
      )}
    >
      {onClose ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close betslip"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}

      {market.status === "closed" && (
        <p className="body-sm rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-muted-foreground">
          This market is closed.
        </p>
      )}

      <header className="space-y-1">
        <h2 className="title-lg text-lg font-semibold tracking-[0.04em] text-foreground uppercase sm:text-xl">
          {headingFull}
        </h2>
        <p
          className={cn(
            "title-md inline-flex items-center gap-1.5 text-sm tabular-nums",
            outcomeLeg === "yes" ? "text-yes-foreground" : "text-no-foreground"
          )}
        >
          <span className="text-muted-foreground">Price</span>
          <span className="text-foreground">{priceOdds}</span>
          <span
            className="inline-flex items-center text-muted-foreground/60"
            title={"Price\nPrice represents the odds for this outcome."}
            aria-label="Price tooltip: Price represents the odds for this outcome."
          >
            <CircleHelpIcon className="size-3.5" />
          </span>
        </p>
      </header>

      <div className="flex items-stretch gap-2">
        <div className={cn("flex min-w-0 flex-1 gap-0.5 border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.2)_100%)] p-0.5", controlRadius)}>
          <button
            type="button"
            disabled={market.status !== "open"}
            onClick={() => {
              onOutcomeLegChange("yes")
              onUiChange({ kind: "idle" })
            }}
            className={cn(
              `button-md h-7 flex-1 px-2 text-[10px] transition-colors ${controlInnerRadius}`,
              outcomeLeg === "yes"
                ? "bg-[linear-gradient(180deg,rgba(0,122,102,0.3),rgba(0,122,102,0.2))] text-yes-foreground shadow-[inset_0_0_0_1px_rgba(0,122,102,0.22)]"
                : "bg-transparent text-muted-foreground/85 hover:bg-white/[0.02] hover:text-foreground/75"
            )}
          >
            YES
          </button>
          <button
            type="button"
            disabled={market.status !== "open"}
            onClick={() => {
              onOutcomeLegChange("no")
              onUiChange({ kind: "idle" })
            }}
            className={cn(
              `button-md h-7 flex-1 px-2 text-[10px] transition-colors ${controlInnerRadius}`,
              outcomeLeg === "no"
                ? "bg-[linear-gradient(180deg,rgba(255,64,80,0.28),rgba(255,64,80,0.18))] text-no-foreground shadow-[inset_0_0_0_1px_rgba(255,64,80,0.2)]"
                : "bg-transparent text-muted-foreground/85 hover:bg-white/[0.02] hover:text-foreground/75"
            )}
          >
            NO
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="trade-shares">
          Amount to invest
        </Label>
        <Input
          id="trade-shares"
          inputMode="decimal"
          value={shares}
          readOnly={market.status !== "open"}
          onChange={(e) => {
            onSharesChange(e.target.value)
            onUiChange({ kind: "idle" })
          }}
          className={cn("h-10 title-md text-base tabular-nums", controlRadius)}
          placeholder="0"
        />
        <p className="field-helper">
          Available{" "}
          <span className="title-md text-foreground">
            {formatUsd(balanceUsd)}
          </span>
        </p>
      </div>

      <div className={cn("grid gap-1.5 border border-border-subtle bg-surface-alt px-3 py-2.5 tabular-nums", controlRadius)}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground sm:text-[15px]">
            Profit
          </span>
          <span
            className={cn(
              "text-right text-2xl leading-none font-bold sm:text-[26px]",
              estProfit > 0 && "text-yes",
              estProfit < 0 && "text-no",
              estProfit === 0 && "text-foreground"
            )}
          >
            {betAmount > 0 && px.ok ? `${estProfit > 0 ? "+" : ""}${formatUsd(estProfit)}` : "—"}
          </span>
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground sm:text-[13px]">
          <span>Amount to invest</span>
          <span className="text-sm text-foreground sm:text-[15px]">
            {betAmount > 0 && px.ok ? formatUsd(betAmount) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-xs text-muted-foreground sm:text-[13px]">
          <span>Possible Payout</span>
          <span className="text-sm text-foreground sm:text-[15px]">
            {betAmount > 0 && px.ok ? formatUsd(estPayout) : "—"}
          </span>
        </div>
      </div>

      {ui.kind === "error" && (
        <p className="body-sm text-sm text-danger" role="alert">
          {ui.message}
          {ui.message.includes("Deposit") && (
            <>
              {" "}
              <button
                type="button"
                className="button-md text-xs underline underline-offset-2 hover:text-foreground"
                onClick={() => openDeposit()}
              >
                Deposit
              </button>
            </>
          )}
        </p>
      )}
      {ui.kind === "success" && (
        <p className="body-sm text-sm text-yes" role="status">
          Bet placed — demo execution.
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={() => void onSubmit()}
        className={cn(
          "pressable w-full border-0 shadow-[0_2px_8px_rgba(255,215,0,0.18)] hover:shadow-[0_3px_10px_rgba(255,215,0,0.22)] active:shadow-[0_1px_5px_rgba(255,215,0,0.14)]"
        )}
      >
        {ctaLabel}
      </Button>

    </div>
  )
}

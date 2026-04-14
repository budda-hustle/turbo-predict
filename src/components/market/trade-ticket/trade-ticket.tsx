"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatUsd, formatUsdCompact } from "@/lib/markets"
import type { ContractView, MarketViewModel } from "@/lib/market-view-model"
import {
  useTrading,
  type OrderExecutionType,
  type OrderFlow,
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
  marketPrice: number,
  flow: OrderFlow,
  orderType: OrderExecutionType,
  limitPrice: number | undefined
): { ok: true; price: number } | { ok: false } {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0 || marketPrice >= 1)
    return { ok: false }
  if (orderType === "market") return { ok: true, price: marketPrice }
  if (
    limitPrice == null ||
    !Number.isFinite(limitPrice) ||
    limitPrice <= 0 ||
    limitPrice >= 1
  )
    return { ok: false }
  if (flow === "buy") {
    if (marketPrice > limitPrice) return { ok: false }
    return { ok: true, price: marketPrice }
  }
  if (marketPrice < limitPrice) return { ok: false }
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

const flowBar =
  "flex flex-1 gap-0.5 rounded-lg border border-border/40 bg-muted/15 p-0.5"
const controlHeight = "h-7"
const dropdownControlHeight = "h-8"
const controlRadius = "rounded-lg"
const controlInnerRadius = "rounded-md"
const flowBtn =
  `${controlHeight} flex-1 ${controlInnerRadius} px-2 text-[10px] font-medium transition-colors`
const flowInactive = "text-muted-foreground/90 hover:text-foreground/70"
const flowActive =
  "bg-background/90 text-foreground shadow-sm ring-1 ring-border/30"

export function TradeTicket({
  market,
  selectedContract,
  outcomeLeg,
  onOutcomeLegChange,
  shares,
  onSharesChange,
  flow,
  onFlowChange,
  orderType,
  onOrderTypeChange,
  limitPriceStr,
  onLimitPriceStrChange,
  ui,
  onUiChange,
  onOrderFilled,
}: {
  market: MarketViewModel
  selectedContract: ContractView
  outcomeLeg: OutcomeLeg
  onOutcomeLegChange: (v: OutcomeLeg) => void
  shares: string
  onSharesChange: (v: string) => void
  flow: OrderFlow
  onFlowChange: (v: OrderFlow) => void
  orderType: OrderExecutionType
  onOrderTypeChange: (v: OrderExecutionType) => void
  limitPriceStr: string
  onLimitPriceStrChange: (v: string) => void
  ui: UiStatus
  onUiChange: React.Dispatch<React.SetStateAction<UiStatus>>
  onOrderFilled?: () => void
}) {
  const { placeOrder, balanceUsd, getOpenPosition, openDeposit } = useTrading()

  const selectedContractIndex = React.useMemo(
    () =>
      Math.max(
        0,
        market.contracts.findIndex((c) => c.id === selectedContract.id)
      ),
    [market.contracts, selectedContract.id]
  )

  const basePrice = selectedContract.yesPrice
  const marketPrice =
    outcomeLeg === "no" ? 1 - basePrice : basePrice
  const outcomeLabel = quoteOutcomeLabel(
    market,
    selectedContractIndex,
    outcomeLeg
  )
  const outcomePrices = market.contracts.map((c) => c.yesPrice)
  const limitNum = parsePositiveNumber(limitPriceStr)
  const limitPrice =
    orderType === "limit" ? (limitNum > 0 && limitNum < 1 ? limitNum : undefined) : undefined

  const px = previewExecPrice(marketPrice, flow, orderType, limitPrice)
  const sharesNum = parsePositiveNumber(shares)
  const execPrice = px.ok ? px.price : 0
  const estCost = sharesNum > 0 && px.ok ? sharesNum * execPrice : 0
  const maxPayout = sharesNum
  const sellCostPortion =
    flow === "sell" && openPos && openPos.shares > 0
      ? (sharesNum / openPos.shares) * openPos.costBasisUsd
      : 0
  const youPay = flow === "buy" ? estCost : 0
  const youWin = flow === "buy" ? maxPayout : estCost
  const estProfit = flow === "buy" ? maxPayout - estCost : estCost - sellCostPortion

  const openPos = getOpenPosition(market.slug, selectedContractIndex, outcomeLeg)
  const canSell = Boolean(openPos && openPos.shares > 0 && !openPos.closedAt)

  const disabled =
    market.status !== "open" ||
    ui.kind === "loading" ||
    sharesNum <= 0 ||
    !px.ok ||
    (flow === "sell" && (!canSell || sharesNum > (openPos?.shares ?? 0)))

  const directionWord = outcomeLeg === "yes" ? "YES" : "NO"
  const headingFull = `${flow === "buy" ? "Buying" : "Selling"} ${directionWord} — ${selectedContract.name}`
  const ctaSide = outcomeLeg === "yes" ? "YES" : "NO"
  const cents = Math.round(marketPrice * 100)

  async function onSubmit() {
    onUiChange({ kind: "idle" })
    if (market.status !== "open") return
    if (sharesNum <= 0) {
      onUiChange({ kind: "error", message: "Enter a positive share count." })
      return
    }
    if (!px.ok) {
      onUiChange({
        kind: "error",
        message:
          orderType === "limit"
            ? flow === "buy"
              ? "Limit below market — raise limit or use market order."
              : "Limit above market — lower limit or use market order."
            : "Invalid price.",
      })
      return
    }
    if (flow === "buy" && estCost > balanceUsd) {
      onUiChange({
        kind: "error",
        message: "Insufficient balance. Deposit to continue.",
      })
      return
    }
    if (flow === "sell") {
      if (!openPos || sharesNum > openPos.shares) {
        onUiChange({ kind: "error", message: "Not enough shares to sell." })
        return
      }
    }

    const quote: PlaceOrderQuote = {
      marketKey: market.slug,
      question: market.question,
      status: market.status,
      outcomeIndex: selectedContractIndex,
      outcomeLabel,
      outcomeLeg,
      outcomePrices,
      shares: sharesNum,
      flow,
      orderType,
      limitPrice: orderType === "limit" ? limitPrice : undefined,
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
      if (res.reason === "limit") {
        onUiChange({
          kind: "error",
          message:
            flow === "buy"
              ? "Limit below market."
              : "Limit above market.",
        })
        return
      }
      if (res.reason === "no_position" || res.reason === "too_many_shares") {
        onUiChange({ kind: "error", message: "Cannot sell that many shares." })
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
      ? flow === "buy"
        ? `Buying ${ctaSide}…`
        : `Selling ${ctaSide}…`
      : flow === "buy"
        ? `Buy ${ctaSide}`
        : `Sell ${ctaSide}`

  return (
    <div
      className={cn(
        "surface-card flex flex-col gap-5 border-border/45 bg-card/95 p-5 shadow-[0_22px_55px_-28px_rgba(0,0,0,0.55)] sm:p-6"
      )}
    >
      {market.status === "closed" && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This market is closed.
        </p>
      )}

      <header className="space-y-1">
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
          {headingFull}
        </h2>
        <p
          className={cn(
            "font-mono text-sm tabular-nums",
            outcomeLeg === "yes" ? "text-yes-foreground" : "text-no-foreground"
          )}
        >
          {cents}¢
        </p>
      </header>

      <div className="flex items-stretch gap-2">
        <div className={cn("flex min-w-0 flex-1 gap-0.5 border border-border/40 bg-muted/15 p-0.5", controlRadius)}>
          <button
            type="button"
            disabled={market.status !== "open"}
            onClick={() => {
              onOutcomeLegChange("yes")
              onUiChange({ kind: "idle" })
            }}
            className={cn(
              `h-7 flex-1 px-2 text-[10px] font-semibold tracking-wide transition-colors ${controlInnerRadius}`,
              outcomeLeg === "yes"
                ? "bg-yes text-background"
                : "text-muted-foreground/85 hover:text-foreground/75"
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
              `h-7 flex-1 px-2 text-[10px] font-semibold tracking-wide transition-colors ${controlInnerRadius}`,
              outcomeLeg === "no"
                ? "bg-no text-background"
                : "text-muted-foreground/85 hover:text-foreground/75"
            )}
          >
            NO
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="trade-shares" className="text-xs text-muted-foreground">
          Shares
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
          className={cn("h-10 font-mono text-base tabular-nums", controlRadius)}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Available{" "}
          <span className="font-medium text-foreground">
            {formatUsd(balanceUsd)}
          </span>
        </p>
      </div>

      <div className="flex items-stretch gap-2">
        <div className={cn(flowBar, "min-w-0 flex-[1.15]")}>
          <button
            type="button"
            disabled={market.status !== "open"}
            onClick={() => {
              onFlowChange("buy")
              onUiChange({ kind: "idle" })
            }}
            className={cn(
              flowBtn,
              flow === "buy" ? flowActive : flowInactive
            )}
          >
            Buy
          </button>
          <button
            type="button"
            disabled={market.status !== "open" || !canSell}
            onClick={() => {
              onFlowChange("sell")
              onUiChange({ kind: "idle" })
            }}
            className={cn(
              flowBtn,
              flow === "sell" ? flowActive : flowInactive
            )}
          >
            Sell
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            disabled={market.status !== "open"}
            className={cn(
              `inline-flex ${dropdownControlHeight} min-w-[5.8rem] shrink-0 items-center justify-center gap-1 border border-border/65 bg-muted/28 px-3 text-[10px] leading-none font-medium text-muted-foreground transition-colors ${controlRadius}`,
              "cursor-pointer hover:border-border/80 hover:bg-muted/40 hover:text-foreground/90 disabled:cursor-default disabled:opacity-50"
            )}
          >
            {orderType === "market" ? "Market" : "Limit"}
            <ChevronDownIcon className="size-3 opacity-60" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[7rem]">
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                onOrderTypeChange("market")
                onUiChange({ kind: "idle" })
              }}
            >
              Market
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                onOrderTypeChange("limit")
                onUiChange({ kind: "idle" })
              }}
            >
              Limit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {orderType === "limit" && (
        <div className="grid gap-2">
          <Label
            htmlFor="trade-limit"
            className="text-xs text-muted-foreground"
          >
            Limit price (0–1, e.g. 0.42)
          </Label>
          <Input
            id="trade-limit"
            inputMode="decimal"
            value={limitPriceStr}
            disabled={market.status !== "open"}
            onChange={(e) => {
              onLimitPriceStrChange(e.target.value)
              onUiChange({ kind: "idle" })
            }}
            className="h-9 font-mono text-sm tabular-nums"
            placeholder="0.42"
          />
        </div>
      )}

      <div className={cn("grid gap-2 border border-border/50 bg-muted/15 px-3 py-2.5 font-mono text-xs tabular-nums sm:text-sm", controlRadius)}>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>You pay</span>
          <span className="font-medium text-foreground">
            {sharesNum > 0 && px.ok ? formatUsd(youPay) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>You win</span>
          <span className="font-medium text-foreground">
            {sharesNum > 0 && px.ok ? formatUsd(youWin) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>Profit</span>
          <span
            className={cn(
              "font-medium",
              estProfit > 0 && "text-yes",
              estProfit < 0 && "text-no",
              estProfit === 0 && "text-foreground"
            )}
          >
            {sharesNum > 0 && px.ok ? `${estProfit > 0 ? "+" : ""}${formatUsd(estProfit)}` : "—"}
          </span>
        </div>
      </div>

      {ui.kind === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {ui.message}
          {ui.message.includes("Deposit") && (
            <>
              {" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => openDeposit()}
              >
                Deposit
              </button>
            </>
          )}
        </p>
      )}
      {ui.kind === "success" && (
        <p className="text-sm font-medium text-yes" role="status">
          Order filled — demo execution.
        </p>
      )}

      <Button
        type="button"
        size="lg"
        disabled={disabled}
        onClick={() => void onSubmit()}
        className={cn(
          `pressable h-10 w-full px-3 text-sm font-medium ${controlRadius}`,
          "border border-transparent bg-foreground text-background",
          "hover:bg-foreground/92 active:bg-foreground/88"
        )}
      >
        {ctaLabel}
      </Button>

      {openPos && !openPos.closedAt ? <Separator className="bg-border/60" /> : null}

      {openPos && !openPos.closedAt ? (
        <div className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Your position ({outcomeLabel})
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground sm:text-sm">
            <span>
              Avg{" "}
              <span className="text-foreground">
                {Math.round(openPos.avgPrice * 100)}¢
              </span>
            </span>
            <span>
              Cost{" "}
              <span className="text-foreground">
                {formatUsd(openPos.costBasisUsd)}
              </span>
            </span>
            <span>
              Shares{" "}
              <span className="text-foreground">
                {openPos.shares.toFixed(2)}
              </span>
            </span>
          </div>
          <Link
            href="/positions"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View in Positions
          </Link>
        </div>
      ) : null}

      {market.volumeUsd != null && (
        <p className="text-center text-[11px] text-muted-foreground">
          Vol. {formatUsdCompact(market.volumeUsd)} · Snapshot · session demo
        </p>
      )}
    </div>
  )
}

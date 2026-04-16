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
  "flex flex-1 gap-0.5 rounded-lg border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.2)_100%)] p-0.5"
const controlHeight = "h-7"
const dropdownControlHeight = "h-8"
const controlRadius = "rounded-lg"
const controlInnerRadius = "rounded-md"
const flowBtn =
  `button-md ${controlHeight} flex-1 ${controlInnerRadius} px-2 text-[10px] transition-colors`
const flowInactive =
  "border border-transparent bg-transparent text-muted-foreground/90 hover:bg-white/[0.02] hover:text-foreground/70"
const flowActive =
  "border border-[hsl(var(--primary)/0.22)] bg-[linear-gradient(180deg,rgba(255,215,0,0.08)_0%,rgba(255,215,0,0.04)_100%)] text-foreground"

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

  const basePrice =
    Number.isFinite(selectedContract?.yesPrice) ? selectedContract.yesPrice : 0
  const marketPrice = outcomeLeg === "no" ? 1 - basePrice : basePrice
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
  const estCost =
    sharesNum > 0 && px.ok && Number.isFinite(execPrice) ? sharesNum * execPrice : 0
  const maxPayout = sharesNum > 0 ? sharesNum : 0

  const openPos = getOpenPosition(market.slug, selectedContractIndex, outcomeLeg)
  const openPosShares = openPos?.shares ?? 0
  const openPosCostBasis = openPos?.costBasisUsd ?? 0
  const canSell = Boolean(openPos && openPosShares > 0 && !openPos?.closedAt)

  const sellCostPortion =
    flow === "sell" && openPosShares > 0 && Number.isFinite(openPosCostBasis)
      ? (sharesNum / openPosShares) * openPosCostBasis
      : 0
  const youPay = flow === "buy" ? estCost : 0
  const youWin = flow === "buy" ? maxPayout : estCost
  const estProfit = flow === "buy" ? maxPayout - estCost : estCost - sellCostPortion

  const disabled =
    market.status !== "open" ||
    ui.kind === "loading" ||
    sharesNum <= 0 ||
    !px.ok ||
    (flow === "sell" && (!canSell || sharesNum > openPosShares))

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
      if (!openPos || sharesNum > openPosShares) {
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
        "surface-card flex flex-col gap-5 border border-white/8 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,215,0,0.02)_0%,transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.24)_100%)] p-5 shadow-lg sm:p-6"
      )}
    >
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
            "title-md text-sm tabular-nums",
            outcomeLeg === "yes" ? "text-yes-foreground" : "text-no-foreground"
          )}
        >
          {cents}¢
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
              `button-md inline-flex ${dropdownControlHeight} min-w-[5.8rem] shrink-0 items-center justify-center gap-1 border border-border px-3 text-[10px] leading-none text-muted-foreground transition-colors ${controlRadius} bg-surface-alt`,
              "cursor-pointer bg-transparent hover:border-white/20 hover:text-foreground/90 disabled:cursor-default disabled:opacity-50"
            )}
          >
            {orderType === "market" ? "Market" : "Limit"}
            <ChevronDownIcon className="size-3 opacity-60" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[7rem]">
            <DropdownMenuItem
              className="button-md text-xs"
              onClick={() => {
                onOrderTypeChange("market")
                onUiChange({ kind: "idle" })
              }}
            >
              Market
            </DropdownMenuItem>
            <DropdownMenuItem
              className="button-md text-xs"
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
            className="field-label"
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
            className="h-9 field-input text-sm tabular-nums"
            placeholder="0.42"
          />
        </div>
      )}

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
            {sharesNum > 0 && px.ok ? `${estProfit > 0 ? "+" : ""}${formatUsd(estProfit)}` : "—"}
          </span>
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground sm:text-[13px]">
          <span>You pay</span>
          <span className="text-sm text-foreground sm:text-[15px]">
            {sharesNum > 0 && px.ok ? formatUsd(youPay) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-xs text-muted-foreground sm:text-[13px]">
          <span>You win</span>
          <span className="text-sm text-foreground sm:text-[15px]">
            {sharesNum > 0 && px.ok ? formatUsd(youWin) : "—"}
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
          Order filled — demo execution.
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

      {openPos && !openPos.closedAt ? <Separator className="bg-border/60" /> : null}

      {openPos && !openPos.closedAt ? (
        <div className="grid gap-1.5 text-sm">
          <span className="label-md text-muted-foreground">
            Your position ({outcomeLabel})
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-1 body-sm text-xs tabular-nums text-muted-foreground sm:text-sm">
            <span>
              Avg{" "}
              <span className="title-md text-foreground">
                {Math.round(openPos.avgPrice * 100)}¢
              </span>
            </span>
            <span>
              Cost{" "}
              <span className="title-md text-foreground">
                {formatUsd(openPos.costBasisUsd)}
              </span>
            </span>
            <span>
              Shares{" "}
              <span className="title-md text-foreground">
                {openPos.shares.toFixed(2)}
              </span>
            </span>
          </div>
          <Link
            href="/positions"
            className="button-md text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View in Portfolio
          </Link>
        </div>
      ) : null}

      {market.volumeUsd != null && (
        <p className="body-sm text-center text-[11px] text-muted-foreground">
          Vol. {formatUsdCompact(market.volumeUsd)} · Snapshot · session demo
        </p>
      )}
    </div>
  )
}

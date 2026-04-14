"use client"

import * as React from "react"

import type { MarketStatus } from "@/lib/market-view-model"

export type OrderFlow = "buy" | "sell"

export type OrderExecutionType = "market" | "limit"

/** Per-outcome contract: Yes = outcome wins at `p`; No = complementary at `1 − p`. */
export type OutcomeLeg = "yes" | "no"

export type Position = {
  id: string
  /** Polymarket slug — `/market/[slug]` */
  marketId: string
  outcomeIndex: number
  /** Which side of this outcome row (yes = wins, no = does not win). */
  outcomeLeg: OutcomeLeg
  outcomeLabel: string
  costBasisUsd: number
  shares: number
  avgPrice: number
  openedAt: string
  closedAt?: string
  settledPnlUsd?: number
  question: string
  markPrice: number
}

/** Session-only audit trail for activity UI (not persisted). */
export type DemoFill = {
  id: string
  at: string
  marketKey: string
  question: string
  outcomeIndex: number
  outcomeLabel: string
  flow: OrderFlow
  shares: number
  price: number
}

export type PlaceOrderQuote = {
  marketKey: string
  question: string
  status: MarketStatus
  outcomeIndex: number
  outcomeLabel: string
  /** Same order as `market.contracts` — base `p` at `outcomeIndex`; No leg uses `1 − p`. */
  outcomePrices: readonly number[]
  /** Default yes — prices against `outcomePrices[outcomeIndex]` vs complement. */
  outcomeLeg?: OutcomeLeg
  shares: number
  flow: OrderFlow
  orderType: OrderExecutionType
  /** Required when `orderType === "limit"` — implied probability 0–1. */
  limitPrice?: number
}

const EXEC_DELAY_MS = 320

const INITIAL_BALANCE = 2500

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export type PlaceOrderResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | "insufficient"
        | "closed"
        | "invalid"
        | "limit"
        | "no_position"
        | "too_many_shares"
    }

type TradingContextValue = {
  balanceUsd: number
  positions: Position[]
  /** Latest fills in this session (newest first). */
  recentFills: DemoFill[]
  depositOpen: boolean
  setDepositOpen: (open: boolean) => void
  openDeposit: () => void
  deposit: (amountUsd: number) => void
  placeOrder: (quote: PlaceOrderQuote) => Promise<PlaceOrderResult>
  /** Clears positions, fills, and resets balance — demo session only (no persistence). */
  resetDemo: () => void
  logout: () => void
  getOpenPosition: (
    marketKey: string,
    outcomeIndex: number,
    outcomeLeg?: OutcomeLeg
  ) => Position | undefined
}

const TradingContext = React.createContext<TradingContextValue | null>(null)

function spotPriceForQuote(q: PlaceOrderQuote): number | undefined {
  const { outcomeIndex, outcomePrices, outcomeLeg } = q
  if (
    !Number.isInteger(outcomeIndex) ||
    outcomeIndex < 0 ||
    outcomeIndex >= outcomePrices.length
  )
    return undefined
  const base = outcomePrices[outcomeIndex]!
  if (!Number.isFinite(base) || base <= 0 || base >= 1) return undefined
  const leg = outcomeLeg ?? "yes"
  const spot = leg === "no" ? 1 - base : base
  if (!Number.isFinite(spot) || spot <= 0 || spot >= 1) return undefined
  return spot
}

function executionPrice(q: PlaceOrderQuote): PlaceOrderResult & { price?: number } {
  const { flow, orderType, limitPrice } = q
  const marketPrice = spotPriceForQuote(q)
  if (marketPrice == null) return { ok: false, reason: "invalid" }

  if (orderType === "market") return { ok: true, price: marketPrice }

  const lim = limitPrice
  if (!Number.isFinite(lim) || lim == null || lim <= 0 || lim >= 1)
    return { ok: false, reason: "invalid" }

  /*
   * Demo limit crossing (single mid price):
   * - Buy: fill only if market <= limit.
   * - Sell: fill only if market >= limit.
   */
  if (flow === "buy") {
    if (marketPrice > lim) return { ok: false, reason: "limit" }
    return { ok: true, price: marketPrice }
  }
  if (marketPrice < lim) return { ok: false, reason: "limit" }
  return { ok: true, price: marketPrice }
}

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [balanceUsd, setBalanceUsd] = React.useState(INITIAL_BALANCE)
  const [positions, setPositions] = React.useState<Position[]>([])
  const [recentFills, setRecentFills] = React.useState<DemoFill[]>([])
  const [depositOpen, setDepositOpen] = React.useState(false)
  const balanceRef = React.useRef(balanceUsd)
  React.useEffect(() => {
    balanceRef.current = balanceUsd
  }, [balanceUsd])

  const openDeposit = React.useCallback(() => setDepositOpen(true), [])

  const deposit = React.useCallback((amountUsd: number) => {
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) return
    setBalanceUsd((b) => b + amountUsd)
  }, [])

  const resetDemo = React.useCallback(() => {
    setBalanceUsd(INITIAL_BALANCE)
    setPositions([])
    setRecentFills([])
    setDepositOpen(false)
  }, [])

  const logout = React.useCallback(() => {
    resetDemo()
  }, [resetDemo])

  const getOpenPosition = React.useCallback(
    (marketKey: string, outcomeIndex: number, outcomeLeg: OutcomeLeg = "yes") =>
      positions.find(
        (p) =>
          p.marketId === marketKey &&
          p.outcomeIndex === outcomeIndex &&
          (p.outcomeLeg ?? "yes") === outcomeLeg &&
          !p.closedAt
      ),
    [positions]
  )

  const placeOrder = React.useCallback(
    async (quote: PlaceOrderQuote): Promise<PlaceOrderResult> => {
      const leg: OutcomeLeg = quote.outcomeLeg ?? "yes"
      const { marketKey, question, status, outcomeIndex, outcomeLabel, shares, flow } =
        quote
      if (status !== "open") return { ok: false, reason: "closed" }
      if (!Number.isFinite(shares) || shares <= 0)
        return { ok: false, reason: "invalid" }

      const px = executionPrice(quote)
      if (!px.ok) return px
      const execPrice = px.price!

      if (flow === "buy") {
        const costUsd = shares * execPrice
        if (!Number.isFinite(costUsd) || costUsd <= 0)
          return { ok: false, reason: "invalid" }
        if (costUsd > balanceRef.current)
          return { ok: false, reason: "insufficient" }
      } else {
        const pos = positions.find(
          (p) =>
            !p.closedAt &&
            p.marketId === marketKey &&
            p.outcomeIndex === outcomeIndex &&
            (p.outcomeLeg ?? "yes") === leg
        )
        if (!pos) return { ok: false, reason: "no_position" }
        if (shares > pos.shares) return { ok: false, reason: "too_many_shares" }
      }

      await new Promise((r) => setTimeout(r, EXEC_DELAY_MS))

      const fill: DemoFill = {
        id: randomId("f"),
        at: new Date().toISOString(),
        marketKey,
        question,
        outcomeIndex,
        outcomeLabel,
        flow,
        shares,
        price: execPrice,
      }

      if (flow === "buy") {
        const costUsd = shares * execPrice
        setBalanceUsd((b) => b - costUsd)
        setPositions((prev) => {
          const idx = prev.findIndex(
            (p) =>
              !p.closedAt &&
              p.marketId === marketKey &&
              p.outcomeIndex === outcomeIndex &&
              (p.outcomeLeg ?? "yes") === leg
          )
          if (idx === -1) {
            return [
              ...prev,
              {
                id: randomId("p"),
                marketId: marketKey,
                outcomeIndex,
                outcomeLeg: leg,
                outcomeLabel,
                costBasisUsd: costUsd,
                shares,
                avgPrice: execPrice,
                openedAt: new Date().toISOString(),
                question,
                markPrice: execPrice,
              },
            ]
          }
          const cur = prev[idx]!
          const newShares = cur.shares + shares
          const newCost = cur.costBasisUsd + costUsd
          const newAvg =
            (cur.avgPrice * cur.shares + execPrice * shares) / newShares
          const next = [...prev]
          next[idx] = {
            ...cur,
            shares: newShares,
            costBasisUsd: newCost,
            avgPrice: newAvg,
            question,
            markPrice: execPrice,
          }
          return next
        })
      } else {
        const proceeds = shares * execPrice
        setBalanceUsd((b) => b + proceeds)
        setPositions((prev) => {
          const idx = prev.findIndex(
            (p) =>
              !p.closedAt &&
              p.marketId === marketKey &&
              p.outcomeIndex === outcomeIndex &&
              (p.outcomeLeg ?? "yes") === leg
          )
          if (idx === -1) return prev
          const cur = prev[idx]!
          if (shares > cur.shares) return prev
          const newShares = cur.shares - shares
          const costPortion = (shares / cur.shares) * cur.costBasisUsd
          const next = [...prev]
          if (newShares <= 1e-9) {
            next[idx] = {
              ...cur,
              shares: 0,
              costBasisUsd: 0,
              closedAt: new Date().toISOString(),
              settledPnlUsd: proceeds - costPortion,
              markPrice: execPrice,
              question,
            }
            return next
          }
          next[idx] = {
            ...cur,
            shares: newShares,
            costBasisUsd: cur.costBasisUsd - costPortion,
            markPrice: execPrice,
            question,
          }
          return next
        })
      }

      setRecentFills((prev) => [fill, ...prev].slice(0, 100))
      return { ok: true }
    },
    [positions]
  )

  const value = React.useMemo(
    () => ({
      balanceUsd,
      positions,
      recentFills,
      depositOpen,
      setDepositOpen,
      openDeposit,
      deposit,
      placeOrder,
      resetDemo,
      logout,
      getOpenPosition,
    }),
    [
      balanceUsd,
      positions,
      recentFills,
      depositOpen,
      openDeposit,
      deposit,
      placeOrder,
      resetDemo,
      logout,
      getOpenPosition,
    ]
  )

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  )
}

export function useTrading(): TradingContextValue {
  const ctx = React.useContext(TradingContext)
  if (!ctx) throw new Error("useTrading must be used within TradingProvider")
  return ctx
}

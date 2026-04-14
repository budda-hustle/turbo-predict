"use client"

import * as React from "react"

import { formatUsdCompact } from "@/lib/markets"
import type { MarketViewModel } from "@/lib/market-view-model"
import { useTrading } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

/** Shares at or above this count are shown as LARGE BUY / LARGE SELL. */
const LARGE_TRADE_SHARE_THRESHOLD = 1000

const MOCK_USERS = [
  "alex",
  "sam",
  "jordan",
  "riley",
  "casey",
  "morgan",
  "taylor",
  "whale_desk",
]

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickUser(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return MOCK_USERS[Math.abs(h) % MOCK_USERS.length]!
}

function isLargeTrade(shares: number, threshold: number): boolean {
  return shares > threshold
}

function actionVerb(
  flow: "buy" | "sell",
  shares: number,
  threshold: number
): string {
  const side = flow === "buy" ? "BUY" : "SELL"
  return isLargeTrade(shares, threshold) ? `LARGE ${side}` : side
}

function relativeTimeShort(iso: string): string {
  const sec = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  )
  if (sec < 45) return `${Math.max(1, sec)}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`
  return `${Math.floor(sec / 86400)}d`
}

type TapeRow = {
  key: string
  flow: "buy" | "sell"
  contractSide: "yes" | "no"
  isLarge: boolean
  verb: string
  sizeStr: string
  cents: number
  rel: string
  user: string
}

export function MarketActivityBlock({ market }: { market: MarketViewModel }) {
  const { recentFills } = useTrading()
  const here = recentFills.filter((f) => f.marketKey === market.slug).slice(0, 24)

  const sessionRows: TapeRow[] = here.map((f) => {
    const isLarge = isLargeTrade(f.shares, LARGE_TRADE_SHARE_THRESHOLD)
    const side: "yes" | "no" =
      f.outcomeLabel.toLowerCase().endsWith("· no") ||
      f.outcomeLabel.toLowerCase().endsWith(" no")
        ? "no"
        : "yes"
    return {
      key: f.id,
      flow: f.flow,
      contractSide: side,
      isLarge,
      verb: actionVerb(f.flow, f.shares, LARGE_TRADE_SHARE_THRESHOLD),
      sizeStr: Math.max(1, Math.round(f.shares)).toLocaleString("en-US"),
      cents: Math.round(f.price * 100),
      rel: relativeTimeShort(f.at),
      user: pickUser(f.id + f.at),
    }
  })

  const synthRows = React.useMemo((): TapeRow[] => {
    const rnd = mulberry32(
      Array.from(market.slug).reduce((s, c) => s + c.charCodeAt(0), 0)
    )
    const rows: TapeRow[] = []
    const px0 = market.contracts[0]?.yesPrice ?? 0.5

    rows.push({
      key: "lg-1",
      flow: "sell",
      contractSide: "no",
      isLarge: true,
      verb: "LARGE SELL",
      sizeStr: "18,420",
      cents: Math.round(px0 * 100),
      rel: "1m",
      user: "whale_fund",
    })

    rows.push({
      key: "lg-2",
      flow: "buy",
      contractSide: "yes",
      isLarge: true,
      verb: "LARGE BUY",
      sizeStr: "50,200",
      cents: Math.min(95, Math.round(px0 * 100) + 3),
      rel: "3m",
      user: "desk_mm",
    })

    let px = px0
    for (let i = 0; i < 26; i++) {
      px = Math.min(0.95, Math.max(0.05, px + (rnd() - 0.5) * 0.04))
      const flow = rnd() > 0.5 ? "buy" : "sell"
      const contractSide: "yes" | "no" = rnd() > 0.48 ? "yes" : "no"
      const sz = Math.round(rnd() * 1200) + 15
      const cents = px * 100
      const rel = `${4 + i}m`
      const u = pickUser(`${market.slug}-s-${i}`)
      rows.push({
        key: `s-${i}`,
        flow,
        contractSide,
        isLarge: isLargeTrade(sz, LARGE_TRADE_SHARE_THRESHOLD),
        verb: actionVerb(flow, sz, LARGE_TRADE_SHARE_THRESHOLD),
        sizeStr: Math.max(1, Math.round(sz)).toLocaleString("en-US"),
        cents: Math.round(cents),
        rel,
        user: u,
      })
    }
    return rows
  }, [market.slug, market.contracts])

  const rows = sessionRows.length > 0 ? sessionRows : synthRows

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Activity
        </h2>
        <span className="text-[10px] text-muted-foreground">Demo</span>
      </div>
      <div className="surface-card border-border/60 px-3 py-3">
        <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto font-mono text-[11px] leading-snug">
          {rows.map((row) => (
            <li
              key={row.key}
              className={cn(
                "tabular-nums text-foreground/88",
                row.isLarge &&
                  "text-[12px] font-semibold tracking-tight opacity-100",
                !row.isLarge && "font-normal opacity-95"
              )}
            >
              <span className="text-foreground/90">{row.verb}</span>{" "}
              <span
                className={cn(
                  "font-medium",
                  row.contractSide === "yes" ? "text-yes" : "text-no"
                )}
              >
                {row.contractSide.toUpperCase()}
              </span>{" "}
              <span className="text-foreground/85">{row.sizeStr}</span>{" "}
              <span className="text-muted-foreground/80">@</span>{" "}
              <span className="text-foreground/85">{row.cents}¢</span>{" "}
              <span className="text-muted-foreground/65">·</span>{" "}
              <span className="text-muted-foreground/85">{row.rel}</span>{" "}
              <span className="text-muted-foreground/65">·</span>{" "}
              <span className="text-muted-foreground/85">{row.user}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border/40 pt-2 text-center text-[10px] text-muted-foreground">
          Session tape · Vol. {formatUsdCompact(market.volumeUsd)}
        </p>
      </div>
    </section>
  )
}

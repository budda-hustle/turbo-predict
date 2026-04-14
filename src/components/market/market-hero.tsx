"use client"

import * as React from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { formatExpiry, formatUsdCompact } from "@/lib/markets"
import type { MarketViewModel } from "@/lib/market-view-model"
import { cn } from "@/lib/utils"

const THUMB_SIZE = "size-20" /* 80px */

function cardInitials(title: string): string {
  const cleaned = title.replace(/[^\p{L}\p{N}\s]/gu, " ").trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const a = words[0]!.charAt(0)
    const b = words[1]!.charAt(0)
    return (a + b).toUpperCase().slice(0, 2)
  }
  if (words.length === 1 && words[0]!.length >= 2)
    return words[0]!.slice(0, 2).toUpperCase()
  return "PM"
}

function MarketThumbnail({
  imageUrl,
  title,
}: {
  imageUrl?: string
  title: string
}) {
  const [failed, setFailed] = React.useState(false)
  const initials = cardInitials(title)
  const url = imageUrl?.trim()

  if (!url || failed) {
    return (
      <div
        className={cn(
          THUMB_SIZE,
          "shrink-0 rounded-md border border-border/70 bg-muted/40",
          "flex items-center justify-center font-mono text-xs font-medium text-muted-foreground"
        )}
        aria-hidden
      >
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- small remote thumb
    <img
      src={url}
      alt=""
      className={cn(THUMB_SIZE, "shrink-0 rounded-md border border-border/60 object-cover")}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function useCountdown(iso: string): { label: string; urgent: boolean } {
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const end = new Date(iso).getTime()
  const diff = end - now
  if (!Number.isFinite(diff)) return { label: "—", urgent: false }
  if (diff <= 0) return { label: "Ended", urgent: false }

  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return { label: `${d}d ${h}h ${m}m`, urgent: false }
  if (h > 0) return { label: `${h}h ${m}m ${sec}s`, urgent: h < 24 }
  return { label: `${m}m ${sec}s`, urgent: true }
}

export function MarketHero({ market }: { market: MarketViewModel }) {
  const cd = useCountdown(market.expiresAt)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Markets
        </Link>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <MarketThumbnail imageUrl={market.image} title={market.question} />
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{market.category}</Badge>
              <Badge variant="outline">
                {market.marketType === "binary" ? "Binary" : "Multi-outcome"}
              </Badge>
              {market.status === "open" ? (
                <span className="text-xs font-medium text-yes">Open</span>
              ) : (
                <span className="text-xs text-muted-foreground">Closed</span>
              )}
            </div>
            <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              {market.question}
            </h1>
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
              )}
            >
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                Expires {formatExpiry(market.expiresAt)}
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono tabular-nums",
                  cd.urgent &&
                    market.status === "open" &&
                    "text-amber-600 dark:text-amber-400"
                )}
              >
                <span className="text-muted-foreground">Closes in</span>
                {cd.label}
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                Vol. {formatUsdCompact(market.volumeUsd)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

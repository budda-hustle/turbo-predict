"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatExpiry, formatUsdCompact } from "@/lib/markets"
import type { MarketViewModel } from "@/lib/market-view-model"
import {
  NAV_CATEGORY_ORDER,
  type NavCategory,
} from "@/lib/nav-categories"
import { cn } from "@/lib/utils"

const THUMB_SIZE = "size-12" /* 48px */

const chipBase =
  "max-w-[160px] truncate rounded-md border px-2 py-1 font-mono text-[11px] tabular-nums transition-colors duration-150"

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
    // eslint-disable-next-line @next/next/no-img-element -- small remote thumbs
    <img
      src={url}
      alt=""
      className={cn(
        THUMB_SIZE,
        "shrink-0 rounded-md border border-border/60 object-cover"
      )}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function OutcomeChips({
  market,
  href,
}: {
  market: MarketViewModel
  href: string
}) {
  const top = market.contracts.slice(0, 4)
  const rest = market.contracts.length - top.length
  return (
    <div className="flex flex-wrap gap-1.5">
      {top.map((o, i) => (
        <Link
          key={`${o.id}-${i}`}
          href={`${href}?outcome=${i}`}
          className={cn(
            chipBase,
            "pressable cursor-pointer border-border/70 bg-muted/20 text-muted-foreground",
            "hover:border-foreground/25 hover:bg-muted/35"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-medium text-foreground">
            {Math.round(o.yesPrice * 100)}%
          </span>{" "}
          <span className="text-muted-foreground">{o.name}</span>
        </Link>
      ))}
      {rest > 0 ? (
        <Link
          href={href}
          className="pressable cursor-pointer self-center rounded-md border border-border/65 bg-muted/15 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-muted/35 hover:text-foreground/85"
          onClick={(e) => e.stopPropagation()}
        >
          +{rest}
        </Link>
      ) : null}
    </div>
  )
}

function BinaryOutcomeChips({
  market,
  href,
}: {
  market: MarketViewModel
  href: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href={`${href}?side=yes`}
        className={cn(
          chipBase,
          "pressable cursor-pointer border-yes/20 bg-yes-muted/15 text-muted-foreground",
          "hover:border-yes/35 hover:bg-yes-muted/25"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-yes-foreground">
          {Math.round((market.contracts[0]?.yesPrice ?? 0) * 100)}%
        </span>{" "}
        <span className="text-muted-foreground">Yes</span>
      </Link>
      <Link
        href={`${href}?side=no`}
        className={cn(
          chipBase,
          "pressable cursor-pointer border-no/20 bg-no-muted/15 text-muted-foreground",
          "hover:border-no/35 hover:bg-no-muted/25"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-no-foreground">
          {Math.round((market.contracts[0]?.noPrice ?? 0) * 100)}%
        </span>{" "}
        <span className="text-muted-foreground">No</span>
      </Link>
    </div>
  )
}

function MarketCard({ market }: { market: MarketViewModel }) {
  const href = `/market/${encodeURIComponent(market.slug)}`
  const isBinary = market.marketType === "binary"

  return (
    <div
      className={cn(
        "surface-card group flex flex-col gap-3 p-4 transition-colors duration-150",
        "hover:border-foreground/20 hover:bg-card/80"
      )}
    >
      <Link
        href={href}
        className="flex gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <MarketThumbnail imageUrl={market.image} title={market.question} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="secondary"
              className="max-w-[min(100%,11rem)] truncate text-[11px] font-normal"
            >
              {market.category}
            </Badge>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatExpiry(market.expiresAt)}
            </span>
          </div>
          <h2 className="text-sm font-medium leading-snug tracking-tight text-foreground">
            {market.question}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>Vol. {formatUsdCompact(market.volumeUsd)}</span>
            {market.status === "closed" ? (
              <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Closed
              </span>
            ) : (
              <span className="font-medium text-yes">Live</span>
            )}
          </div>
        </div>
      </Link>

      <div className="border-t border-border/50 pt-3">
        {isBinary ? (
          <BinaryOutcomeChips market={market} href={href} />
        ) : (
          <OutcomeChips market={market} href={href} />
        )}
      </div>
    </div>
  )
}

export function HomeMarkets({
  initialMarkets,
  error: initialError,
}: {
  initialMarkets: MarketViewModel[]
  error?: string | null
}) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [category, setCategory] = React.useState<"All" | NavCategory>("All")
  const [timeFilter, setTimeFilter] = React.useState<
    "24H" | "7D" | "30D" | "All time"
  >("All time")
  const [scope, setScope] = React.useState<"active" | "all">("active")

  const scopedMarkets = React.useMemo(
    () =>
      initialMarkets.filter((m) =>
        scope === "active" ? m.status === "open" : true
      ),
    [initialMarkets, scope]
  )

  const categories = React.useMemo(() => {
    const counts = new Map<NavCategory, number>()
    for (const m of scopedMarkets) {
      const c = m.category as NavCategory
      if (NAV_CATEGORY_ORDER.includes(c))
        counts.set(c, (counts.get(c) ?? 0) + 1)
      else counts.set("General", (counts.get("General") ?? 0) + 1)
    }
    const tabs = NAV_CATEGORY_ORDER.filter((c) => (counts.get(c) ?? 0) > 0)
    return ["All", ...tabs] as const
  }, [scopedMarkets])

  React.useEffect(() => {
    if (category !== "All" && !categories.includes(category)) {
      setCategory("All")
    }
  }, [categories, category])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return scopedMarkets.filter((m) => {
      if (category !== "All" && m.category !== category) return false
      if (needle && !m.question.toLowerCase().includes(needle)) return false
      return true
    })
  }, [q, category, scopedMarkets])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Predict outcomes. Trade instantly.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Turn your insights into positions. Real-time markets, clear pricing,
          fast execution.
        </p>
      </header>

      {initialError ? (
        <div className="surface-card flex flex-col gap-3 border-destructive/30 p-6">
          <p className="text-sm font-medium text-foreground">{initialError}</p>
          <Button
            type="button"
            variant="outline"
            className="pressable w-fit"
            onClick={() => router.refresh()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search markets..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full max-w-md border-border/80 bg-card/50"
          />
          <div className="flex flex-wrap items-center gap-1">
            {(["24H", "7D", "30D", "All time"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  // TODO: connect to actual time-window filtering once historical aggregation is wired.
                  setTimeFilter(t)
                }}
                className={cn(
                  "pressable cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  timeFilter === t
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "pressable cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === c
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <Tabs
            value={scope}
            onValueChange={(v) => setScope(v as "active" | "all")}
            className="w-fit"
          >
            <TabsList className="h-9 bg-muted/40">
              <TabsTrigger
                value="active"
                className="cursor-pointer text-xs transition-colors hover:text-foreground"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="cursor-pointer text-xs transition-colors hover:text-foreground"
              >
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {!initialError && filtered.length === 0 ? (
        <div className="surface-card flex flex-col items-start gap-3 p-8">
          <p className="text-base font-medium text-foreground">
            No markets match
          </p>
          <p className="text-sm text-muted-foreground">
            Try another category or clear your search.
          </p>
          <button
            type="button"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setQ("")
              setCategory("All")
              setScope("all")
            }}
          >
            Reset filters
          </button>
        </div>
      ) : !initialError ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MarketCard key={`${m.slug}-${m.id}`} market={m} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

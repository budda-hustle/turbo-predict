"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SlidersHorizontalIcon } from "lucide-react"

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

const chipHoverNeutral =
  "hover:border-white/[0.14] hover:text-white/95 hover:[background:linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)]"

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
          "shrink-0 rounded-md bg-surface-alt",
          "label-md flex items-center justify-center text-xs text-muted-foreground"
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
        "shrink-0 rounded-md object-cover"
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
  const top = market.contracts.slice(0, 2)
  const rest = market.contracts.length - top.length
  return (
    <div className="flex flex-col gap-1">
      {top.map((o, i) => (
        <div key={`${o.id}-${i}`} className="flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-xs text-foreground/90">
            {o.name}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href={`${href}?outcome=${i}&side=yes`}
              className={cn(
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-yes/25 bg-surface-alt px-1.5 text-[10px] transition-colors",
                "hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-medium text-yes-foreground">YES</span>
              <span className="tabular-nums text-yes-foreground">
                {Math.round(o.yesPrice * 100)}%
              </span>
            </Link>
            <Link
              href={`${href}?outcome=${i}&side=no`}
              className={cn(
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-no/25 bg-surface-alt px-1.5 text-[10px] transition-colors",
                "hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-medium text-no-foreground">NO</span>
              <span className="tabular-nums text-no-foreground">
                {Math.round((o.noPrice ?? 1 - o.yesPrice) * 100)}%
              </span>
            </Link>
          </div>
        </div>
      ))}
      {rest > 0 ? (
        <Link
          href={href}
          className={cn(
            "pressable mt-0.5 inline-flex h-6 w-full cursor-pointer items-center justify-center rounded-md border border-border-subtle bg-surface-alt px-1.5 text-[10px] text-muted-foreground transition-colors",
            chipHoverNeutral
          )}
          onClick={(e) => e.stopPropagation()}
        >
          +{rest} more outcomes
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
  const yesPct = Math.round((market.contracts[0]?.yesPrice ?? 0) * 100)
  const noPct = Math.round((market.contracts[0]?.noPrice ?? 0) * 100)
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href={`${href}?side=yes`}
        className={cn(
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-yes/25 bg-surface-alt px-3 text-sm transition-colors",
          "hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-yes-foreground">YES</span>
        <span className="tabular-nums text-yes-foreground">{yesPct}%</span>
      </Link>
      <Link
        href={`${href}?side=no`}
        className={cn(
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-no/25 bg-surface-alt px-3 text-sm transition-colors",
          "hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-medium text-no-foreground">NO</span>
        <span className="tabular-nums text-no-foreground">{noPct}%</span>
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
        "surface-card group flex flex-col gap-3 border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] p-4 transition-colors duration-150",
        "hover:border-border-strong"
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
              className="max-w-[min(100%,11rem)] truncate text-[11px]"
            >
              {market.category}
            </Badge>
            <span className="body-sm shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatExpiry(market.expiresAt)}
            </span>
          </div>
          <h2 className="title-md text-sm text-foreground">
            {market.question}
          </h2>
          <div className="body-sm flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>Vol. {formatUsdCompact(market.volumeUsd)}</span>
            {market.status === "closed" ? (
              <span className="label-md rounded border border-border px-1.5 py-px text-[10px] text-muted-foreground">
                Closed
              </span>
            ) : (
              <span className="label-md text-yes">Active</span>
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
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [category, setCategory] = React.useState<"All" | NavCategory>("All")
  const [timeFilter, setTimeFilter] = React.useState<
    "24H" | "7D" | "30D" | "All time"
  >("All time")
  const [scope, setScope] = React.useState<"active" | "resolved">("active")

  const scopedMarkets = React.useMemo(
    () =>
      initialMarkets.filter((m) =>
        scope === "active" ? m.status === "open" : m.status === "closed"
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

  const positionsLinkClass =
    "button-md pressable inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-alt px-3 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground sm:px-4 sm:text-sm"

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <header className="mx-auto max-w-2xl space-y-1 text-center">
        <h1 className="title-xl text-lg font-semibold tracking-[0.04em] text-foreground uppercase sm:text-xl">
          Predict outcomes. Trade instantly.
        </h1>
        <p className="body-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Turn your insights into positions. Real-time markets, clear pricing,
          fast execution.
        </p>
      </header>

      {initialError ? (
        <div className="surface-card flex flex-col gap-3 border-destructive/30 p-6">
          <p className="body-md text-sm text-foreground">{initialError}</p>
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

      {/* Sticky discovery: search + controls (row 1), expandable filters + categories below */}
      <div
        className={cn(
          "sticky top-16 z-30 -mx-4 border-b border-border/50 bg-background/90 px-4 pb-3 pt-4 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md sm:-mx-6 sm:px-6"
        )}
      >
        {/* Row 1: search + filter toggle + Portfolio */}
        <div className="flex min-h-10 items-center gap-2">
          <Input
            placeholder="Search markets..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 min-w-0 flex-1 border-border bg-surface-alt sm:max-w-none"
          />
          <button
            type="button"
            aria-label="Toggle filters"
            aria-controls="market-reveal-filters"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-alt text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground",
              filtersOpen && "border-border text-foreground"
            )}
          >
            <SlidersHorizontalIcon className="size-4" aria-hidden />
          </button>
          <Link href="/positions" className={positionsLinkClass}>
            My bets
          </Link>
        </div>

        {/* Row 2: revealable time + status filters */}
        <div
          id="market-reveal-filters"
          className={cn(
            "overflow-hidden border-border/30 transition-all duration-200 ease-out",
            filtersOpen
              ? "mt-3 max-h-56 border-t pt-3 opacity-100"
              : "max-h-0 border-t-0 pt-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:min-w-0 sm:flex-1 sm:pb-0">
              {(["24H", "7D", "30D", "All time"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTimeFilter(t)
                  }}
                  className={cn(
                    "pressable cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-display font-semibold transition-colors",
                    timeFilter === t
                      ? "border border-transparent text-primary shadow-[0_4px_12px_-8px_rgba(255,219,128,0.45)] [background:linear-gradient(hsl(var(--surface-alt)/0.9),hsl(var(--surface-alt)/0.9))_padding-box,linear-gradient(0deg,#ab7a00,#ffdb80)_border-box]"
                      : cn("border-white/[0.08] bg-white/[0.02] text-foreground/70", chipHoverNeutral)
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Tabs
              value={scope}
              onValueChange={(v) => setScope(v as "active" | "resolved")}
              className="w-full sm:w-auto sm:shrink-0"
            >
              <TabsList className="h-9 w-full bg-surface-alt sm:w-fit">
                <TabsTrigger
                  value="active"
                  className="button-md flex-1 cursor-pointer text-xs transition-colors hover:text-foreground sm:flex-none"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="resolved"
                  className="button-md flex-1 cursor-pointer text-xs transition-colors hover:text-foreground sm:flex-none"
                >
                  Resolved
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

      </div>

      {/* Category row scrolls with page (not sticky) */}
      <div className="border-b border-border/30 pb-3">
        <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "pressable cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-display font-semibold transition-colors",
                category === c
                  ? "border border-transparent text-primary shadow-[0_4px_12px_-8px_rgba(255,219,128,0.45)] [background:linear-gradient(hsl(var(--surface-alt)/0.9),hsl(var(--surface-alt)/0.9))_padding-box,linear-gradient(0deg,#ab7a00,#ffdb80)_border-box]"
                  : cn("border-white/[0.08] bg-white/[0.02] text-foreground/70", chipHoverNeutral)
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!initialError && filtered.length === 0 ? (
        <div className="surface-card flex flex-col items-start gap-3 p-8">
          <p className="title-md text-base text-foreground">
            No markets match
          </p>
          <p className="body-sm text-sm text-muted-foreground">
            Try another category or clear your search.
          </p>
          <button
            type="button"
            className="button-md text-sm text-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setQ("")
              setCategory("All")
              setScope("resolved")
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

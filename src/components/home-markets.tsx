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
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link
              href={`${href}?outcome=${i}&side=yes`}
              className={cn(
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-1.5 text-[10px] transition-colors sm:min-w-[5.5rem] sm:max-w-[7.5rem] sm:flex-1 sm:px-2",
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
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-1.5 text-[10px] transition-colors sm:min-w-[5.5rem] sm:max-w-[7.5rem] sm:flex-1 sm:px-2",
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
      {rest > 0 ? <p className="mt-1 pl-0.5 text-[11px] text-muted-foreground/70">+{rest} more outcomes</p> : null}
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
    <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
      <Link
        href={`${href}?side=yes`}
        className={cn(
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-3 text-sm transition-colors lg:px-3.5",
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
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-3 text-sm transition-colors lg:px-3.5",
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

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const cur = points[i]!
    const cx = (prev.x + cur.x) / 2
    d += ` Q ${cx} ${prev.y}, ${cur.x} ${cur.y}`
  }
  return d
}

function FeaturedMarketHero({
  market,
  href,
  hiddenOutcomes,
}: {
  market: MarketViewModel
  href: string
  hiddenOutcomes: number
}) {
  const CHART_W = 640
  const CHART_H = 320
  const AXIS_LEFT = 36
  const AXIS_RIGHT = 622
  const AXIS_TOP = 10
  const AXIS_BOTTOM = 298
  const topOutcomes = market.contracts.slice(0, 4)
  const lines = React.useMemo(
    () =>
      market.contracts.slice(0, 6).map((c, i) => ({
        id: c.id,
        name: c.name,
        color: ["#8ee7cf", "#c4adff", "#ffd891", "#8ec0ff", "#ffa5c0", "#89d4e4"][i]!,
        points: c.history.map((p) => Math.max(0, Math.min(1, p.value))),
      })),
    [market.contracts]
  )
  const dominantLineId = React.useMemo(() => {
    let winner: string | null = null
    let best = -1
    for (const line of lines) {
      const last = line.points[line.points.length - 1] ?? 0
      if (last > best) {
        best = last
        winner = line.id
      }
    }
    return winner
  }, [lines])
  const pointCount = Math.max(0, ...lines.map((l) => l.points.length))
  const chartPoints = React.useMemo(() => {
    return lines.map((line) => {
      const values =
        line.points.length >= pointCount
          ? line.points
          : Array.from(
              { length: pointCount },
              (_, i) => line.points[i] ?? line.points[line.points.length - 1] ?? 0.5
            )
      const pts = values.map((raw, i) => {
        const v = Math.max(0, Math.min(1, raw))
        return {
          x:
            pointCount <= 1
              ? (AXIS_LEFT + AXIS_RIGHT) / 2
              : AXIS_LEFT + (i / (pointCount - 1)) * (AXIS_RIGHT - AXIS_LEFT),
          y: AXIS_TOP + (1 - v) * (AXIS_BOTTOM - AXIS_TOP),
        }
      })
      return { ...line, d: smoothPath(pts) }
    })
  }, [lines, pointCount])
  const lineMeta = React.useMemo(
    () =>
      chartPoints.map((line) => {
        const values =
          line.points.length >= pointCount
            ? line.points
            : Array.from(
                { length: pointCount },
                (_, i) => line.points[i] ?? line.points[line.points.length - 1] ?? 0.5
              )
        let peakIdx = 0
        let peakVal = -1
        values.forEach((v, i) => {
          if (v > peakVal) {
            peakVal = v
            peakIdx = i
          }
        })
        const peakX =
          pointCount <= 1
            ? (AXIS_LEFT + AXIS_RIGHT) / 2
            : AXIS_LEFT + (peakIdx / Math.max(pointCount - 1, 1)) * (AXIS_RIGHT - AXIS_LEFT)
        const peakY = AXIS_TOP + (1 - Math.max(0, Math.min(1, peakVal))) * (AXIS_BOTTOM - AXIS_TOP)
        const lastVal = values[values.length - 1] ?? 0
        return { id: line.id, color: line.color, peakX, peakY, lastVal }
      }),
    [chartPoints, pointCount]
  )
  const ambientClouds = React.useMemo(
    () =>
      [...lineMeta]
        .sort((a, b) => b.lastVal - a.lastVal)
        .slice(0, 3)
        .map((m, i) => ({
          ...m,
          xPct: (m.peakX / CHART_W) * 100,
          yPct: (m.peakY / CHART_H) * 100,
          size: i === 0 ? 230 : i === 1 ? 210 : 190,
          opacity: i === 0 ? 0.1 : 0.08,
        })),
    [lineMeta, CHART_W, CHART_H]
  )
  const yTicks = [0, 50, 100]
  const xTicks = React.useMemo(() => {
    if (pointCount <= 1) return [0]
    return [0, Math.round((pointCount - 1) / 2), pointCount - 1]
  }, [pointCount])

  function formatXAxisLabel(index: number): string {
    const ts = lines[0]?.points[index]
    if (ts == null) return "—"
    return index === 0 ? "Start" : index === pointCount - 1 ? "Now" : "Mid"
  }

  return (
    <div className="hidden lg:block">
      <div
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,215,120,0.06)_0%,rgba(255,255,255,0.01)_42%,rgba(0,0,0,0.28)_100%)] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]"
      >
        <div className="grid h-[400px] grid-cols-12 gap-6">
          <div className="col-span-5 flex min-h-0 flex-col">
            <Badge variant="secondary" className="w-fit text-[11px]">
              {market.category}
            </Badge>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-[0.01em] text-foreground">
              {market.question}
            </h2>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Vol. {formatUsdCompact(market.volumeUsd)}</span>
              <span className="label-md text-yes">Active</span>
            </div>

            <div className="mt-auto space-y-2.5 pt-5">
              {topOutcomes.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">{o.name}</span>
                  <div className="flex min-w-[12.75rem] items-center justify-end gap-1.5">
                    <Link
                      href={`${href}?outcome=${i}&side=yes`}
                      className="pressable inline-flex h-8 min-w-[5.9rem] items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-2 text-xs transition-colors sm:min-w-[6.4rem] sm:max-w-[8rem] sm:flex-1 hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-medium text-yes-foreground">YES</span>
                      <span className="tabular-nums text-yes-foreground">{Math.round(o.yesPrice * 100)}%</span>
                    </Link>
                    <Link
                      href={`${href}?outcome=${i}&side=no`}
                      className="pressable inline-flex h-8 min-w-[5.9rem] items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-2 text-xs transition-colors sm:min-w-[6.4rem] sm:max-w-[8rem] sm:flex-1 hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-medium text-no-foreground">NO</span>
                      <span className="tabular-nums text-no-foreground">{Math.round(o.noPrice * 100)}%</span>
                    </Link>
                  </div>
                </div>
              ))}
              {hiddenOutcomes > 0 ? (
                <p className="mt-1 pl-0.5 text-xs text-muted-foreground/70">
                  +{hiddenOutcomes} more outcomes
                </p>
              ) : null}
            </div>
          </div>

          <div className="col-span-7 min-h-0">
            <div className="relative h-full overflow-visible p-1">
              {ambientClouds.map((cloud) => (
                <div
                  key={`cloud-${cloud.id}`}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${cloud.xPct}%`,
                    top: `${cloud.yPct}%`,
                    width: `${cloud.size}px`,
                    height: `${cloud.size}px`,
                    background: cloud.color,
                    opacity: cloud.opacity,
                    filter: "blur(100px)",
                  }}
                  aria-hidden
                />
              ))}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0)_44%, rgba(0,0,0,0.2)_100%)",
                }}
                aria-hidden
              />
              <div className="relative h-full w-full [mask-image:radial-gradient(120%_120%_at_50%_50%,black_60%,transparent_100%)]">
                <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-full w-full overflow-visible">
              <defs>
                <filter id={`hero-glow-${market.id}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <clipPath id={`hero-clip-${market.id}`}>
                  <rect
                    x={AXIS_LEFT}
                    y={AXIS_TOP}
                    width={AXIS_RIGHT - AXIS_LEFT}
                    height={AXIS_BOTTOM - AXIS_TOP}
                  />
                </clipPath>
                {chartPoints.map((line) => (
                  <linearGradient
                    key={`hero-grad-${line.id}`}
                    id={`hero-line-${market.id}-${line.id}`}
                    x1={AXIS_LEFT}
                    y1={0}
                    x2={AXIS_RIGHT}
                    y2={0}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={line.color} stopOpacity="0.58" />
                    <stop offset="65%" stopColor={line.color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={line.color} stopOpacity="1" />
                  </linearGradient>
                ))}
              </defs>
              <line
                x1={AXIS_LEFT}
                y1={AXIS_TOP}
                x2={AXIS_LEFT}
                y2={AXIS_BOTTOM}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
              />
              <line
                x1={AXIS_LEFT}
                y1={AXIS_BOTTOM}
                x2={AXIS_RIGHT}
                y2={AXIS_BOTTOM}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
              />
              {yTicks.map((tick) => {
                const y = AXIS_TOP + (1 - tick / 100) * (AXIS_BOTTOM - AXIS_TOP)
                return (
                  <g key={`hero-y-${tick}`}>
                    <text x="30" y={y + 3} textAnchor="end" className="fill-white/40 text-[10px] tabular-nums">
                      {tick}%
                    </text>
                  </g>
                )
              })}
              {xTicks.map((idx) => {
                const x =
                  pointCount <= 1
                    ? (AXIS_LEFT + AXIS_RIGHT) / 2
                    : AXIS_LEFT + (idx / Math.max(pointCount - 1, 1)) * (AXIS_RIGHT - AXIS_LEFT)
                return (
                  <text
                    key={`hero-x-${idx}`}
                    x={x}
                    y={CHART_H - 6}
                    textAnchor="middle"
                    className="fill-white/40 text-[10px]"
                  >
                    {formatXAxisLabel(idx)}
                  </text>
                )
              })}
              <g clipPath={`url(#hero-clip-${market.id})`}>
                {chartPoints.map((line) => {
                  const isDominant = line.id === dominantLineId
                  return (
                    <g key={line.id}>
                      <path
                        d={line.d}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={isDominant ? "4.8" : "4.1"}
                        strokeOpacity={isDominant ? "0.32" : "0.24"}
                        filter={`url(#hero-glow-${market.id})`}
                      />
                      <path
                        d={line.d}
                        fill="none"
                        stroke={`url(#hero-line-${market.id}-${line.id})`}
                        strokeWidth={isDominant ? "2.8" : "2.2"}
                        strokeOpacity={isDominant ? "0.94" : "0.88"}
                      />
                    </g>
                  )
                })}
                {lineMeta.map((meta) => (
                  <circle
                    key={`peak-${meta.id}`}
                    cx={meta.peakX}
                    cy={meta.peakY}
                    r="2.4"
                    fill={meta.color}
                    fillOpacity="0.5"
                    filter={`url(#hero-glow-${market.id})`}
                  />
                ))}
              </g>
                </svg>
              </div>
              <div className="pointer-events-none absolute top-2 right-2 flex max-w-[44%] flex-wrap justify-end gap-x-2.5 gap-y-1 text-[10px] text-white/42">
                {lines.slice(0, 6).map((line) => (
                  <div key={`legend-${line.id}`} className="inline-flex items-center gap-1">
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: line.color,
                        boxShadow: `0 0 8px ${line.color}66`,
                      }}
                      aria-hidden
                    />
                    <span className="truncate max-w-[7.5rem]">{line.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarketCard({ market }: { market: MarketViewModel }) {
  const router = useRouter()
  const href = `/market/${encodeURIComponent(market.slug)}`
  const isBinary = market.marketType === "binary"

  return (
    <div
      className={cn(
        "surface-card group flex h-full cursor-pointer flex-col gap-3 border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] p-4 transition-colors duration-150",
        "hover:border-border-strong"
      )}
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      <div className="flex gap-3 text-left">
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
      </div>

      <div className="mt-auto border-t border-border/50 pt-3">
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
  const featuredMarket = React.useMemo(
    () =>
      initialMarkets
        .filter((m) => m.marketType === "multi" && m.status === "open" && m.contracts.length > 1)
        .sort((a, b) => b.volumeUsd - a.volumeUsd)[0] ?? null,
    [initialMarkets]
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:max-w-[1400px]">
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

      {featuredMarket ? (
        <FeaturedMarketHero
          market={featuredMarket}
          href={`/market/${encodeURIComponent(featuredMarket.slug)}`}
          hiddenOutcomes={Math.max(0, featuredMarket.contracts.length - 2)}
        />
      ) : null}

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

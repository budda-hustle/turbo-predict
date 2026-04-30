"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { formatExpiry, formatUsdCompact } from "@/lib/markets"
import type { MarketViewModel } from "@/lib/market-view-model"
import { formatDecimalOdds } from "@/lib/odds"
import {
  NAV_CATEGORY_ORDER,
  type NavCategory,
} from "@/lib/nav-categories"
import { useMediaQuery } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"

const THUMB_SIZE = "size-12" /* 48px */
const CURATED_CHIPS = ["Trending", "Breaking"] as const
type CuratedChip = (typeof CURATED_CHIPS)[number]
type HomeCategory = "All" | NavCategory | CuratedChip
type TimeFilter = "24H" | "7D" | "30D" | "All time"

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
          <span className="min-w-0 flex-1 truncate font-display text-xs text-foreground/90">
            {o.name}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link
              href={`${href}?outcome=${i}&outcomeId=${i}&side=yes&bet=yes&price=${encodeURIComponent(String(o.yesPrice))}&openBetSlip=true`}
              className={cn(
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-1.5 text-[10px] transition-colors sm:min-w-[5.5rem] sm:max-w-[7.5rem] sm:flex-1 sm:px-2",
                "hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-display font-medium text-yes-foreground">YES</span>
              <span className="tabular-nums text-yes-foreground">
                {formatDecimalOdds(o.yesPrice)}
              </span>
            </Link>
            <Link
              href={`${href}?outcome=${i}&outcomeId=${i}&side=no&bet=no&price=${encodeURIComponent(String(o.noPrice ?? 1 - o.yesPrice))}&openBetSlip=true`}
              className={cn(
                "pressable inline-flex h-6 min-w-[4.25rem] items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-1.5 text-[10px] transition-colors sm:min-w-[5.5rem] sm:max-w-[7.5rem] sm:flex-1 sm:px-2",
                "hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-display font-medium text-no-foreground">NO</span>
              <span className="tabular-nums text-no-foreground">
                {formatDecimalOdds(o.noPrice ?? 1 - o.yesPrice)}
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
  const yesOdds = formatDecimalOdds(market.contracts[0]?.yesPrice ?? 0)
  const noOdds = formatDecimalOdds(market.contracts[0]?.noPrice ?? 0)
  return (
    <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
      <Link
        href={`${href}?side=yes&bet=yes&price=${encodeURIComponent(String(market.contracts[0]?.yesPrice ?? 0))}&openBetSlip=true`}
        className={cn(
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-3 text-sm transition-colors lg:px-3.5",
          "hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-display font-medium text-yes-foreground">YES</span>
        <span className="tabular-nums text-yes-foreground">{yesOdds}</span>
      </Link>
      <Link
        href={`${href}?side=no&bet=no&price=${encodeURIComponent(String(market.contracts[0]?.noPrice ?? 0))}&openBetSlip=true`}
        className={cn(
          "pressable inline-flex h-10 items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-3 text-sm transition-colors lg:px-3.5",
          "hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-display font-medium text-no-foreground">NO</span>
        <span className="tabular-nums text-no-foreground">{noOdds}</span>
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
  const router = useRouter()
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
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,215,120,0.06)_0%,rgba(255,255,255,0.01)_42%,rgba(0,0,0,0.28)_100%)] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]"
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
        <div className="grid h-[400px] grid-cols-12 gap-6">
          <div className="col-span-5 flex min-h-0 flex-col">
            <Badge variant="secondary" className="w-fit text-[11px]">
              {market.category}
            </Badge>
            <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-[0.01em] text-foreground">
              {market.question}
            </h2>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Vol. {formatUsdCompact(market.volumeUsd)}</span>
              <span className="label-md text-yes">Active</span>
            </div>

            <div className="mt-auto space-y-2.5 pt-5">
              {topOutcomes.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-display text-sm text-foreground/90">{o.name}</span>
                  <div className="flex min-w-[12.75rem] items-center justify-end gap-1.5">
                    <Link
                      href={`${href}?outcome=${i}&outcomeId=${i}&side=yes&bet=yes&price=${encodeURIComponent(String(o.yesPrice))}&openBetSlip=true`}
                      className="pressable inline-flex h-8 min-w-[5.9rem] items-center justify-between rounded-md border border-yes/25 bg-[rgba(0,122,102,0.04)] px-2 text-xs transition-colors sm:min-w-[6.4rem] sm:max-w-[8rem] sm:flex-1 hover:border-[rgba(0,122,102,0.55)] hover:[background:linear-gradient(90deg,rgba(0,122,102,0.08)_0%,rgba(0,122,102,0.18)_50%,rgba(0,122,102,0.08)_100%)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-display font-medium text-yes-foreground">YES</span>
                      <span className="tabular-nums text-yes-foreground">{formatDecimalOdds(o.yesPrice)}</span>
                    </Link>
                    <Link
                      href={`${href}?outcome=${i}&outcomeId=${i}&side=no&bet=no&price=${encodeURIComponent(String(o.noPrice))}&openBetSlip=true`}
                      className="pressable inline-flex h-8 min-w-[5.9rem] items-center justify-between rounded-md border border-no/25 bg-[rgba(255,64,80,0.04)] px-2 text-xs transition-colors sm:min-w-[6.4rem] sm:max-w-[8rem] sm:flex-1 hover:border-[rgba(255,64,80,0.55)] hover:[background:linear-gradient(90deg,rgba(255,64,80,0.08)_0%,rgba(255,64,80,0.18)_50%,rgba(255,64,80,0.08)_100%)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-display font-medium text-no-foreground">NO</span>
                      <span className="tabular-nums text-no-foreground">{formatDecimalOdds(o.noPrice)}</span>
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
              className="max-w-[min(100%,11rem)] truncate bg-white/10 font-display text-[11px]"
            >
              {market.category}
            </Badge>
            <span className="body-sm shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatExpiry(market.expiresAt)}
            </span>
          </div>
          <h2 className="title-md font-display text-sm text-foreground">
            {market.question}
          </h2>
          <div className="body-sm flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>Vol. {formatUsdCompact(market.volumeUsd)}</span>
            {market.status === "closed" ? (
              <span className="label-md rounded border border-border px-1.5 py-px text-[10px] text-muted-foreground">
                Closed
              </span>
            ) : (
              <span className="label-md text-[10px] text-yes">Active</span>
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
  initialTimeFilter = "All time",
}: {
  initialMarkets: MarketViewModel[]
  error?: string | null
  initialTimeFilter?: TimeFilter
}) {
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 1024px)", false)
  const [q, setQ] = React.useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false)
  const [category, setCategory] = React.useState<HomeCategory>("All")
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>(initialTimeFilter)
  const [nowMs] = React.useState(() => Date.now())
  const controlsRowRef = React.useRef<HTMLDivElement | null>(null)
  const myPredRef = React.useRef<HTMLAnchorElement | null>(null)
  const timeFilterRef = React.useRef<HTMLDivElement | null>(null)
  const [controlsWidth, setControlsWidth] = React.useState(0)
  const [myPredWidth, setMyPredWidth] = React.useState(0)
  const [timeFilterWidth, setTimeFilterWidth] = React.useState(0)

  const scopedMarkets = React.useMemo(() => {
    const timeMs =
      timeFilter === "24H"
        ? 24 * 60 * 60 * 1000
        : timeFilter === "7D"
          ? 7 * 24 * 60 * 60 * 1000
          : timeFilter === "30D"
            ? 30 * 24 * 60 * 60 * 1000
            : null

    return initialMarkets.filter((m) => {
      if (m.status !== "open") {
        return false
      }
      if (timeMs != null) {
        const expires = new Date(m.expiresAt).getTime()
        if (!Number.isFinite(expires)) return false
        if (expires < nowMs || expires - nowMs > timeMs) return false
      }
      return true
    })
  }, [initialMarkets, timeFilter, nowMs])

  const categories = React.useMemo(() => {
    const counts = new Map<NavCategory, number>()
    for (const m of scopedMarkets) {
      const c = m.category as NavCategory
      if (NAV_CATEGORY_ORDER.includes(c))
        counts.set(c, (counts.get(c) ?? 0) + 1)
      else counts.set("General", (counts.get("General") ?? 0) + 1)
    }
    const tabs = NAV_CATEGORY_ORDER.filter((c) => (counts.get(c) ?? 0) > 0)
    return ["All", ...CURATED_CHIPS, ...tabs] as HomeCategory[]
  }, [scopedMarkets])

  React.useEffect(() => {
    if (category !== "All" && !categories.includes(category)) {
      setCategory("All")
    }
  }, [categories, category])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()

    return scopedMarkets.filter((m) => {
      if (
        category !== "All" &&
        !CURATED_CHIPS.includes(category as CuratedChip) &&
        m.category !== category
      ) {
        return false
      }
      if (needle && !m.question.toLowerCase().includes(needle)) return false
      return true
    })
  }, [q, category, scopedMarkets])

  const positionsLinkClass =
    "button-md pressable inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-alt px-3 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground sm:px-4 sm:text-sm"
  const featuredMarket = React.useMemo(
    () =>
      initialMarkets
        .filter((m) => m.marketType === "multi" && m.status === "open" && m.contracts.length > 1)
        .sort((a, b) => b.volumeUsd - a.volumeUsd)[0] ?? null,
    [initialMarkets]
  )

  React.useEffect(() => {
    const row = controlsRowRef.current
    const pred = myPredRef.current
    const filter = timeFilterRef.current
    if (!row || !pred || !filter) return

    function measure() {
      if (!row || !pred || !filter) return
      setControlsWidth(row.clientWidth)
      setMyPredWidth(pred.clientWidth)
      setTimeFilterWidth(filter.clientWidth)
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(row)
    ro.observe(pred)
    ro.observe(filter)
    return () => ro.disconnect()
  }, [])

  const nonDesktopSearchSpace = React.useMemo(() => {
    if (isDesktop) return 300
    const gaps = 16
    return Math.max(0, controlsWidth - myPredWidth - timeFilterWidth - gaps)
  }, [controlsWidth, myPredWidth, timeFilterWidth, isDesktop])

  const canShowElasticSearch = isDesktop || nonDesktopSearchSpace >= 120
  const searchInputWidth = isDesktop
    ? 300
    : Math.max(120, Math.min(300, nonDesktopSearchSpace))
  const showSearchReplacementRow =
    !isDesktop && mobileSearchOpen && !canShowElasticSearch

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:max-w-none lg:px-12">
      <header className="mx-auto max-w-2xl space-y-1 text-center">
        <h1 className="title-xl text-lg font-semibold tracking-[0.04em] text-foreground uppercase sm:text-xl">
          Predict outcomes. Trade instantly.
        </h1>
        <p className="body-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Turn your insights into positions. Real-time markets, clear pricing,
          fast execution.
        </p>
      </header>

      <div className="min-w-0 space-y-6">
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

          {/* Sticky discovery: search + time + my predictions in one row */}
          <div
            className={cn(
              "sticky top-16 z-30 -mx-4 border-b border-border/50 bg-background/90 px-4 pb-3 pt-4 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md sm:-mx-6 sm:px-6"
            )}
          >
            <div ref={controlsRowRef} className="flex min-h-10 flex-nowrap items-center gap-2">
              {showSearchReplacementRow ? (
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    placeholder="Search markets..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-10 min-w-0 flex-1 border-border bg-surface-alt"
                  />
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setMobileSearchOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-alt text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  {canShowElasticSearch ? (
                    <Input
                      placeholder="Search markets..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="h-10 shrink border-border bg-surface-alt"
                      style={{ width: `${searchInputWidth}px` }}
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label="Open search"
                      onClick={() => setMobileSearchOpen(true)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-alt text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground"
                    >
                      <SearchIcon className="size-4" />
                    </button>
                  )}
                  <div ref={timeFilterRef} className="hidden shrink-0 lg:flex">
                    <div className="inline-flex h-10 items-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
                      {(["24H", "7D", "30D", "All time"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTimeFilter(t)}
                          className={cn(
                            "pressable h-8 rounded-md px-3 text-xs font-display font-semibold transition-colors",
                            timeFilter === t
                              ? "border border-transparent text-primary shadow-[0_4px_12px_-8px_rgba(255,219,128,0.45)] [background:linear-gradient(hsl(var(--surface-alt)/0.9),hsl(var(--surface-alt)/0.9))_padding-box,linear-gradient(0deg,#ab7a00,#ffdb80)_border-box]"
                              : "text-foreground/70 hover:text-foreground/90"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!isDesktop ? (
                    <div ref={timeFilterRef} className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-10 min-w-[160px] w-[clamp(160px,32vw,200px)] items-center justify-between gap-1.5 rounded-lg border border-border-subtle bg-surface-alt px-3 text-xs font-display text-foreground/85 transition-colors hover:border-border hover:bg-surface-hover">
                          <span className="truncate">{timeFilter}</span>
                          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--anchor-width] border border-border bg-[#101722] p-1.5">
                          {(["24H", "7D", "30D", "All time"] as const).map((t) => (
                            <DropdownMenuItem
                              key={t}
                              onClick={() => setTimeFilter(t)}
                              className={cn(
                                "cursor-pointer rounded-md px-2 py-2 text-xs font-display",
                                timeFilter === t ? "text-primary" : "text-foreground/85"
                              )}
                            >
                              {t}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                  <Link ref={myPredRef} href="/positions" className={cn(positionsLinkClass, "ml-auto")}>
                    My Predictions
                  </Link>
                </>
              )}
            </div>

          </div>

          {/* Category row scrolls with page (not sticky) */}
          <div className="border-b border-border/30 pb-3">
            <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c)
                  }}
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

          {featuredMarket && category === "All" ? (
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
                  setTimeFilter("All time")
                }}
              >
                Reset filters
              </button>
            </div>
          ) : !initialError ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
              {filtered.map((m) => (
                <MarketCard key={`${m.slug}-${m.id}`} market={m} />
              ))}
            </div>
          ) : null}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"

import type { MarketViewModel } from "@/lib/market-view-model"

const VB_W = 760
const VB_H = 190
const M = { l: 34, r: 14, t: 10, b: 24 }

const LINE_COLORS = [
  "#7fd8c2",
  "#b7a1ff",
  "#f3c97a",
  "#7fb1ff",
  "#ff96b4",
  "#7ac6d6",
] as const

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

function niceTopPercent(maxPercent: number): number {
  const rounded = Math.ceil(maxPercent / 10) * 10
  return Math.max(20, Math.min(100, rounded))
}

function formatXAxisTick(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  if (Math.abs(now - d.getTime()) <= oneDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d)
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d)
}

export function MarketMultiOutcomeHeroChart({ market }: { market: MarketViewModel }) {
  const series = React.useMemo(
    () =>
      market.contracts.map((c, i) => ({
        id: c.id,
        name: c.name.trim(),
        points: c.history.map((p) => clamp01(p.value)),
        times: c.history.map((p) => p.timestamp),
        color: LINE_COLORS[i % LINE_COLORS.length]!,
      })),
    [market.contracts]
  )

  const pointCount = React.useMemo(
    () => Math.max(0, ...series.map((s) => s.points.length)),
    [series]
  )
  const hasEnoughData = pointCount >= 2 && series.length > 1
  const plotW = VB_W - M.l - M.r
  const plotH = VB_H - M.t - M.b

  const normalized = React.useMemo(
    () =>
      series.map((s) => {
        const pts: number[] = []
        let last = s.points[0] ?? 0.5
        for (let i = 0; i < pointCount; i++) {
          const v = s.points[i]
          if (Number.isFinite(v)) last = clamp01(v as number)
          pts.push(last)
        }
        return { ...s, pts }
      }),
    [series, pointCount]
  )

  const timeline = React.useMemo(() => {
    const base = series.find((s) => s.times.length === pointCount) ?? series[0]
    const times = base?.times ?? []
    if (times.length >= pointCount) return times.slice(0, pointCount)
    if (times.length === 0) {
      return Array.from({ length: pointCount }, () => new Date().toISOString())
    }
    const last = times[times.length - 1]!
    return [...times, ...Array.from({ length: pointCount - times.length }, () => last)]
  }, [series, pointCount])

  const yScale = React.useMemo(() => {
    const values = normalized.flatMap((s) => s.pts)
    const maxPercent = Math.max(...values) * 100
    const minPercent = Math.min(...values) * 100
    const top = niceTopPercent(maxPercent + 2)
    const bottom = Math.max(0, Math.floor((minPercent - 2) / 10) * 10)
    return { bottom, top }
  }, [normalized])

  const yTicks = React.useMemo(() => {
    const span = yScale.top - yScale.bottom
    const step = span >= 60 ? 20 : span >= 30 ? 10 : 5
    const ticks: number[] = []
    for (let t = yScale.bottom; t <= yScale.top + 0.001; t += step) ticks.push(t)
    return ticks.slice(0, 4)
  }, [yScale.bottom, yScale.top])

  const xTickIdxs = React.useMemo(() => {
    if (pointCount <= 1) return [0]
    const count = Math.min(5, pointCount)
    return Array.from({ length: count }, (_, i) =>
      Math.round((i * (pointCount - 1)) / Math.max(count - 1, 1))
    )
  }, [pointCount])

  const xAt = (i: number) => M.l + (pointCount <= 1 ? plotW / 2 : (i / (pointCount - 1)) * plotW)
  const yAtPct = (pct: number) => {
    const span = Math.max(1, yScale.top - yScale.bottom)
    const clamped = Math.max(yScale.bottom, Math.min(yScale.top, pct))
    return M.t + (1 - (clamped - yScale.bottom) / span) * plotH
  }

  const [hover, setHover] = React.useState<{ idx: number; x: number; y: number } | null>(
    null
  )
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const hoverIdx = hover?.idx ?? null

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!hasEnoughData || !wrapRef.current) return
    const br = wrapRef.current.getBoundingClientRect()
    const relX = e.clientX - br.left
    const relY = e.clientY - br.top
    const sbr = e.currentTarget.getBoundingClientRect()
    const xSvg = ((e.clientX - sbr.left) / Math.max(sbr.width, 1)) * VB_W
    const idx = Math.round(
      Math.max(0, Math.min(pointCount - 1, ((xSvg - M.l) / Math.max(plotW, 1)) * (pointCount - 1)))
    )
    setHover({ idx, x: relX, y: relY })
  }

  if (!hasEnoughData) return null

  return (
    <section className="space-y-3">
      <div className="surface-card border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] px-3 py-3">
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {normalized.slice(0, 6).map((s) => {
            const last = s.pts[s.pts.length - 1] ?? 0
            return (
              <div key={s.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="truncate max-w-[10rem]">{s.name}</span>
                <span className="text-foreground/90 tabular-nums">{Math.round(last * 100)}%</span>
              </div>
            )
          })}
        </div>

        <div ref={wrapRef} className="relative">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full touch-none select-none"
            role="img"
            aria-label={`Multi-outcome trend for ${market.question}`}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(null)}
          >
            {yTicks.map((tick) => (
              <g key={`y-${tick}`}>
                <line
                  x1={M.l}
                  x2={VB_W - M.r}
                  y1={yAtPct(tick)}
                  y2={yAtPct(tick)}
                  className="stroke-white/12"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={M.l - 6}
                  y={yAtPct(tick) + 3}
                  textAnchor="end"
                  className="fill-white/50 text-[10px] tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            ))}

            {normalized.map((s) => {
              const points = s.pts
                .map((v, i) => `${xAt(i).toFixed(2)},${yAtPct(v * 100).toFixed(2)}`)
                .join(" ")
              return (
                <polyline
                  key={s.id}
                  fill="none"
                  stroke={s.color}
                  strokeOpacity={0.8}
                  strokeWidth="1.35"
                  points={points}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}

            {hoverIdx != null ? (
              <line
                x1={xAt(hoverIdx)}
                x2={xAt(hoverIdx)}
                y1={M.t}
                y2={VB_H - M.b}
                className="stroke-white/20"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ) : null}

            {xTickIdxs.map((idx) => (
              <text
                key={`x-${idx}`}
                x={xAt(idx)}
                y={VB_H - 6}
                textAnchor="middle"
                className="fill-white/50 text-[10px]"
              >
                {formatXAxisTick(timeline[idx] ?? "")}
              </text>
            ))}
          </svg>

          {hoverIdx != null ? (
            <div
              className="pointer-events-none absolute z-10 min-w-[11rem] rounded-md border border-border/60 bg-card/95 px-2.5 py-2 text-[10px] shadow-md backdrop-blur-sm"
              style={{
                left: "clamp(6px, calc(var(--tip-x) - 70px), calc(100% - 188px))",
                top: Math.max(6, (hover?.y ?? 0) - 74),
                ["--tip-x" as string]: `${hover?.x ?? 0}px`,
              }}
            >
              {normalized.slice(0, 4).map((s) => (
                <div key={`${s.id}-tip`} className="flex items-center justify-between gap-2 tabular-nums">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                    <span className="max-w-[7.5rem] truncate">{s.name}</span>
                  </span>
                  <span className="text-foreground">{Math.round((s.pts[hoverIdx] ?? 0) * 100)}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

"use client"

import * as React from "react"

import type { ContractView, PricePoint } from "@/lib/market-view-model"
import { cn } from "@/lib/utils"

const VB_W = 400
const VB_H = 200
const M = { l: 40, r: 12, t: 14, b: 36 }

function formatTickTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

function formatTooltipTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

type Props = {
  contract: ContractView
  /** When true, omit outer section chrome (used inside accordion). */
  embedded?: boolean
}

export function ContractPriceChart({ contract, embedded }: Props) {
  const series = contract.history
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [hover, setHover] = React.useState<{
    idx: number
    relX: number
    relY: number
  } | null>(null)

  const stats = React.useMemo(() => {
    if (series.length === 0) return null
    const vals = series.map((p) => p.value)
    const last = vals[vals.length - 1]!
    const hi = Math.max(...vals)
    const lo = Math.min(...vals)
    return { last, hi, lo }
  }, [series])

  if (series.length < 2) {
    return (
      <div className="rounded-md border border-border/50 bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
        No history for this contract.
      </div>
    )
  }

  const values = series.map((p) => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = Math.max(0.02, (rawMax - rawMin) * 0.12)
  let yMin = Math.max(0, rawMin - pad)
  let yMax = Math.min(1, rawMax + pad)
  if (yMax - yMin < 0.06) {
    const mid = (yMin + yMax) / 2
    yMin = Math.max(0, mid - 0.03)
    yMax = Math.min(1, mid + 0.03)
  }
  const ySpan = Math.max(1e-9, yMax - yMin)
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (ySpan * i) / tickCount)

  const plotW = VB_W - M.l - M.r
  const plotH = VB_H - M.t - M.b
  const n = values.length

  const xAt = (i: number) => M.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yAt = (v: number) => M.t + (1 - (v - yMin) / ySpan) * plotH

  const linePts = values
    .map((v, i) => `${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`)
    .join(" ")

  const xLabelIdxs = Array.from(
    new Set([0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1])
  ).sort((a, b) => a - b)

  function onSvgPointer(e: React.PointerEvent<SVGSVGElement>) {
    const wrap = wrapRef.current
    if (!wrap) return
    const br = wrap.getBoundingClientRect()
    const relX = e.clientX - br.left
    const relY = e.clientY - br.top
    const svg = e.currentTarget
    const sbr = svg.getBoundingClientRect()
    const rx = (e.clientX - sbr.left) / Math.max(sbr.width, 1)
    const xSvg = rx * VB_W
    const plotX = xSvg - M.l
    const idx = Math.round(
      Math.max(0, Math.min(n - 1, (plotX / Math.max(plotW, 1)) * (n - 1)))
    )
    setHover({ idx, relX, relY })
  }

  const tipPoint: PricePoint | null =
    hover && series[hover.idx] ? series[hover.idx]! : null

  const inner = (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full touch-none select-none font-mono text-[8px] tabular-nums text-muted-foreground/75"
        onPointerMove={onSvgPointer}
        onPointerLeave={() => setHover(null)}
        onPointerDown={onSvgPointer}
        role="img"
        aria-label={`Price history for ${contract.name}`}
      >
        {yTicks.map((yv, ti) => {
          const y = yAt(yv)
          return (
            <g key={`${ti}-${yv}`}>
              <line
                x1={M.l}
                x2={VB_W - M.r}
                y1={y}
                y2={y}
                className="stroke-border/35"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={M.l - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground/75"
              >
                {Math.round(yv * 100)}%
              </text>
            </g>
          )
        })}

        {xLabelIdxs.map((i) => (
          <line
            key={`grid-x-${i}`}
            x1={xAt(i)}
            x2={xAt(i)}
            y1={M.t}
            y2={VB_H - M.b}
            className="stroke-border/20"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {xLabelIdxs.map((i) => (
          <text
            key={`lab-x-${i}`}
            x={xAt(i)}
            y={VB_H - 10}
            textAnchor="middle"
            className="fill-muted-foreground/75"
          >
            {formatTickTime(series[i]!.timestamp)}
          </text>
        ))}

        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/75"
          points={linePts}
          vectorEffect="non-scaling-stroke"
        />

        {hover && tipPoint ? (
          <line
            x1={xAt(hover.idx)}
            x2={xAt(hover.idx)}
            y1={M.t}
            y2={VB_H - M.b}
            className="stroke-foreground/25"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>

      {hover && tipPoint ? (
        <div
          className={cn(
            "pointer-events-none absolute z-10 w-[11.5rem] rounded-md border border-border/60 bg-card/95 px-2.5 py-2 text-[10px] shadow-md backdrop-blur-sm",
            "font-mono tabular-nums"
          )}
          style={{
            left: "clamp(4px, calc(var(--tip-x) - 72px), calc(100% - 188px))",
            top: Math.max(4, hover.relY - 92),
            ["--tip-x" as string]: `${hover.relX}px`,
          }}
        >
          <p className="truncate font-medium text-foreground">{contract.name.trim()}</p>
          <p className="mt-1 text-muted-foreground">{formatTooltipTime(tipPoint.timestamp)}</p>
          <p className="mt-1 text-foreground">
            {(tipPoint.value * 100).toFixed(1)}%{" "}
            <span className="text-muted-foreground">
              ({Math.round(tipPoint.value * 100)}¢ YES)
            </span>
          </p>
        </div>
      ) : null}

      {stats ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
          <span>
            Last{" "}
            <span className="font-medium text-foreground">
              {(stats.last * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            Hi{" "}
            <span className="font-medium text-foreground">
              {(stats.hi * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            Lo{" "}
            <span className="font-medium text-foreground">
              {(stats.lo * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            Range{" "}
            <span className="font-medium text-foreground">
              {((stats.hi - stats.lo) * 100).toFixed(1)} pts
            </span>
          </span>
        </div>
      ) : null}
    </div>
  )

  if (embedded) {
    return <div className="w-full">{inner}</div>
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Price
        </h2>
        <span className="max-w-[60%] truncate text-right text-[10px] text-muted-foreground">
          {contract.name.trim()}
        </span>
      </div>
      <div className="surface-card border-border/60 px-3 py-3">{inner}</div>
    </section>
  )
}

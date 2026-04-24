"use client"

import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function TimelineDot({ done = false }: { done?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2",
        done ? "border-foreground text-foreground" : "border-foreground/90 text-transparent"
      )}
      aria-hidden
    >
      {done ? <CheckIcon className="size-4" /> : null}
    </span>
  )
}

export function MarketTimelineBlock() {
  return (
    <section className="surface-card border-white/8 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(0,170,255,0.08)_0%,rgba(255,255,255,0.01)_42%,rgba(0,0,0,0.28)_100%)] p-5">
      <h3 className="title-lg text-lg font-semibold tracking-[0.04em] text-foreground uppercase sm:text-xl">
        Timeline
      </h3>
      <div className="mt-5 space-y-6">
        <div className="flex items-start gap-3">
          <TimelineDot done />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">Market published</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Feb 5, 2026, 05:21 PM GMT+2
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">Market closes</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Jan 1, 2100, 02:01 AM GMT+2
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">Resolution</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              The outcome will be validated by the team within 24 hours of its
              occurrence.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

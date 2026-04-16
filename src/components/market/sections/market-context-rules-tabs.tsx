"use client"

import * as React from "react"

import type { MarketViewModel } from "@/lib/market-view-model"
import { cn } from "@/lib/utils"

const DEFAULT_RULES =
  "This is a demo market. Resolution rules would appear here for a live integration. Outcomes and prices come from a static snapshot and do not update in real time."

export function MarketContextRulesTabs({ market }: { market: MarketViewModel }) {
  const [activeTab, setActiveTab] = React.useState<"rules" | "context">("rules")
  const contextBody =
    market.context ??
    market.description ??
    "No additional context for this demo market."
  const rulesBody = market.rules ?? DEFAULT_RULES

  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-5">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={cn(
            "label-md cursor-pointer transition-colors",
            activeTab === "rules" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          RULES
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("context")}
          className={cn(
            "label-md cursor-pointer transition-colors",
            activeTab === "context" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          CONTEXT
        </button>
      </div>
      <div className="surface-card body-md border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.22)_100%)] px-5 py-4 text-sm text-muted-foreground">
        {activeTab === "rules" ? rulesBody : contextBody}
      </div>
    </section>
  )
}

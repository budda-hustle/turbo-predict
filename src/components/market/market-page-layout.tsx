import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function MarketPageLayout({
  main,
  sidebar,
  className,
}: {
  main: ReactNode
  sidebar: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
        className
      )}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start">
        <div className="min-w-0 space-y-8">{main}</div>
        {sidebar}
      </div>
    </div>
  )
}

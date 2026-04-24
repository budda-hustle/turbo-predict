import Link from "next/link"

import { cn } from "@/lib/utils"

const recurringTabClass =
  "pressable inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-display font-semibold transition-colors"

export type RecurringTabOption = {
  slug: string
  label: string
}

export function MarketRecurringTabs({
  activeSlug,
  options,
}: {
  activeSlug: string
  options: RecurringTabOption[]
}) {
  if (options.length <= 1) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((option) => (
        <Link
          key={option.slug}
          href={`/market/${encodeURIComponent(option.slug)}`}
          className={cn(
            recurringTabClass,
            option.slug === activeSlug
              ? "border border-transparent text-primary shadow-[0_4px_12px_-8px_rgba(255,219,128,0.45)] [background:linear-gradient(hsl(var(--surface-alt)/0.9),hsl(var(--surface-alt)/0.9))_padding-box,linear-gradient(0deg,#ab7a00,#ffdb80)_border-box]"
              : "border-white/[0.08] bg-white/[0.02] text-foreground/70 hover:border-white/[0.14] hover:text-white/95"
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"

import type { CuratedApiResponse, CuratedSection } from "@/lib/home-curated"
import { cn } from "@/lib/utils"

function SectionSkeleton() {
  return (
    <section className="space-y-3">
      <div className="h-5 w-24 animate-pulse rounded bg-white/8" />
      <div className="space-y-2.5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
            <div className="size-4 animate-pulse rounded-full bg-white/8" />
            <div className="space-y-1.5">
              <div className="h-3 w-52 animate-pulse rounded bg-white/8" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-white/6" />
            </div>
            <div className="h-3.5 w-8 animate-pulse rounded bg-white/8" />
          </div>
        ))}
      </div>
    </section>
  )
}

function CuratedSectionCard({
  section,
  indexOffset = 0,
  selected = false,
  onSectionSelect,
}: {
  section: CuratedSection
  indexOffset?: number
  selected?: boolean
  onSectionSelect?: (key: CuratedSection["key"]) => void
}) {
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => onSectionSelect?.(section.key)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 font-display text-lg font-semibold tracking-[0.04em] uppercase transition-colors",
          selected ? "text-primary" : "text-foreground hover:text-primary"
        )}
      >
        {section.title}
        <span className="text-base leading-none text-primary/90">›</span>
      </button>
      <div className="space-y-2.5">
        {section.items.map((item, i) => (
          <Link
            key={`${section.key}-${item.slug}-${i}`}
            href={`/market/${encodeURIComponent(item.slug)}`}
            className={cn(
              "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-md px-1 py-1.5",
              "transition-colors hover:bg-white/[0.03]"
            )}
          >
            <p className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full border border-white/12 text-[11px] leading-none font-medium tabular-nums text-foreground/85">
              {indexOffset + i + 1}
            </p>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-display text-[13px] leading-5 font-medium text-foreground/95 group-hover:text-foreground">
                {item.question}
              </p>
              {item.subline ? (
                <p className="truncate font-display text-[12px] text-muted-foreground">{item.subline}</p>
              ) : null}
            </div>
            <p className="tabular-nums text-[18px] leading-6 font-semibold text-foreground/90">
              {item.probabilityPct}%
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function HomeCuratedSidebar({
  selectedSectionKey,
  onSectionSelect,
  onSectionsLoaded,
}: {
  selectedSectionKey?: CuratedSection["key"] | null
  onSectionSelect?: (key: CuratedSection["key"]) => void
  onSectionsLoaded?: (sections: CuratedSection[]) => void
}) {
  const [sections, setSections] = React.useState<CuratedSection[] | null>(null)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    let canceled = false
    async function load() {
      try {
        const res = await fetch("/api/home-curated", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed")
        const json = (await res.json()) as CuratedApiResponse
        if (!canceled) {
          const next = json.sections ?? []
          setSections(next)
          onSectionsLoaded?.(next)
        }
      } catch {
        if (!canceled) setFailed(true)
      }
    }
    void load()
    return () => {
      canceled = true
    }
  }, [onSectionsLoaded])

  return (
    <aside className="hidden w-[360px] shrink-0 lg:sticky lg:top-20 lg:block">
      <div className="space-y-7 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:pr-1">
        {!sections && !failed ? (
          <>
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        ) : null}

        {sections?.map((section, index) => (
          <React.Fragment key={section.key}>
            <CuratedSectionCard
              section={section}
              indexOffset={0}
              selected={selectedSectionKey === section.key}
              onSectionSelect={onSectionSelect}
            />
            {index < sections.length - 1 ? (
              <div className="border-b border-border/50" />
            ) : null}
          </React.Fragment>
        ))}

        {failed ? (
          <p className="text-xs text-muted-foreground">
            Curated events are temporarily unavailable.
          </p>
        ) : null}
      </div>
    </aside>
  )
}

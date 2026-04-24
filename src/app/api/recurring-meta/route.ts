import { NextResponse } from "next/server"

import {
  isRecurringType,
  RECURRING_TYPE_ORDER,
  type RecurringType,
} from "@/lib/recurring"

const GAMMA = "https://gamma-api.polymarket.com"

type GammaSeries = {
  recurrence?: string | null
}

type GammaEvent = {
  slug?: string
  series?: GammaSeries[]
}

async function fetchSeriesTypes(): Promise<RecurringType[]> {
  try {
    const res = await fetch(`${GAMMA}/series?limit=300`, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const series = (await res.json()) as Array<{ recurrence?: string | null }>
    const set = new Set<RecurringType>()
    for (const s of series) {
      const raw = (s.recurrence ?? "").trim()
      if (isRecurringType(raw)) set.add(raw)
    }
    return RECURRING_TYPE_ORDER.filter((t) => set.has(t))
  } catch {
    return []
  }
}

async function fetchEventRecurringType(
  slug: string
): Promise<RecurringType | null> {
  try {
    const url = `${GAMMA}/events/slug/${encodeURIComponent(slug)}`
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 180 },
    })
    if (!res.ok) return null
    const event = (await res.json()) as GammaEvent
    const raw = (event.series?.[0]?.recurrence ?? "").trim()
    return isRecurringType(raw) ? raw : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")?.trim()

  if (slug) {
    const [availableTypes, recurringType] = await Promise.all([
      fetchSeriesTypes(),
      fetchEventRecurringType(slug),
    ])
    return NextResponse.json({ availableTypes, recurringType })
  }

  const availableTypes = await fetchSeriesTypes()
  return NextResponse.json({ availableTypes })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { slugs?: unknown }
    | null
  const rawSlugs = Array.isArray(body?.slugs) ? body?.slugs : []
  const slugs = rawSlugs
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, 120)

  const [availableTypes, entries] = await Promise.all([
    fetchSeriesTypes(),
    Promise.all(
      slugs.map(async (slug) => {
        const recurringType = await fetchEventRecurringType(slug)
        return [slug, recurringType] as const
      })
    ),
  ])

  const recurringBySlug = Object.fromEntries(entries)
  return NextResponse.json({ availableTypes, recurringBySlug })
}

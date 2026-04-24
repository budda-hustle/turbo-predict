import { NextResponse } from "next/server"

import { getAllSnapshotMarkets } from "@/lib/market-data"
import {
  CURATED_SECTIONS,
  type CuratedApiResponse,
  type CuratedMarketItem,
} from "@/lib/home-curated"

const GAMMA = "https://gamma-api.polymarket.com"

type GammaEvent = {
  markets?: Array<{
    slug?: string
    question?: string
    outcomes?: string
    outcomePrices?: string
  }>
}

function parseJsonArray(raw: string | undefined): unknown[] {
  if (!raw) return []
  try {
    const val = JSON.parse(raw) as unknown
    return Array.isArray(val) ? val : []
  } catch {
    return []
  }
}

function toCuratedItem(m: GammaEvent["markets"][number]): CuratedMarketItem | null {
  const slug = m.slug?.trim()
  const question = m.question?.trim()
  if (!slug || !question) return null

  const prices = parseJsonArray(m.outcomePrices)
  const parsed = Number(prices[0] ?? 0.5)
  const probabilityPct = Number.isFinite(parsed)
    ? Math.max(0, Math.min(100, Math.round(parsed * 100)))
    : 50

  const outcomes = parseJsonArray(m.outcomes)
  const firstOutcome = String(outcomes[0] ?? "").trim()

  return {
    slug,
    question,
    subline: firstOutcome || undefined,
    probabilityPct,
  }
}

async function fetchSectionByTag(tagSlug: string): Promise<CuratedMarketItem[]> {
  const url = `${GAMMA}/events?tag_slug=${encodeURIComponent(tagSlug)}&order=volume&ascending=false&limit=12`
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    })
    if (!res.ok) return []
    const events = (await res.json()) as GammaEvent[]
    const out: CuratedMarketItem[] = []
    const seen = new Set<string>()
    for (const e of events) {
      for (const m of e.markets ?? []) {
        const item = toCuratedItem(m)
        if (!item || seen.has(item.slug)) continue
        seen.add(item.slug)
        out.push(item)
        if (out.length >= 3) return out
      }
    }
    return out
  } catch {
    return []
  }
}

function fallbackItems(offset: number): CuratedMarketItem[] {
  return getAllSnapshotMarkets()
    .slice(offset, offset + 3)
    .map((m) => ({
      slug: m.slug,
      question: m.question,
      subline: m.contracts[0]?.name,
      probabilityPct: Math.round((m.contracts[0]?.yesPrice ?? 0.5) * 100),
    }))
}

export async function GET() {
  const sections = await Promise.all(
    CURATED_SECTIONS.map(async (section, index) => {
      const items = await fetchSectionByTag(section.tagSlug)
      return {
        key: section.key,
        title: section.title,
        href: section.href,
        items: items.length > 0 ? items.slice(0, 3) : fallbackItems(index * 3),
      }
    })
  )

  return NextResponse.json<CuratedApiResponse>({ sections })
}

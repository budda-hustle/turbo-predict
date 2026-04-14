/**
 * Archived Polymarket Gamma live integration — not imported by runtime app code.
 * Use `src/data/markets-snapshot.ts` + `src/lib/market-data.ts` for demos.
 */
import "server-only"

import { cache } from "react"

import { withContractHistory } from "@/lib/contract-demo-history"
import type {
  ContractView,
  MarketViewModel,
} from "@/lib/market-view-model"
import { normalizeCategory } from "@/lib/nav-categories"

type ContractCore = Omit<ContractView, "history">

const GAMMA = "https://gamma-api.polymarket.com"

const REVALIDATE_SEC = 60

/** In-process list + slug index; survives across navigations in one Node runtime (dev / long-lived server). */
const MEMORY_TTL_MS = 60_000

type MemoryStore = {
  expiresAt: number
  markets: MarketViewModel[]
  bySlug: Map<string, MarketViewModel>
}

let memory: MemoryStore | null = null
let homeInflight: Promise<{ markets: MarketViewModel[]; error?: string }> | null =
  null
const slugInflight = new Map<string, Promise<MarketViewModel | null>>()

function indexBySlug(markets: MarketViewModel[]): Map<string, MarketViewModel> {
  const m = new Map<string, MarketViewModel>()
  for (const row of markets) {
    m.set(row.slug, row)
  }
  return m
}

/** Abort slow / hung requests so the page can fail gracefully instead of hanging. */
const GAMMA_FETCH_MS = 25_000

type FetchJsonOpts = {
  /** Skip Next data cache (needed for large discovery payloads). */
  cache?: "force-cache" | "no-store"
  next?: { revalidate?: number }
}

async function gammaJson<T>(
  path: string,
  opts: FetchJsonOpts = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const url = `${GAMMA}${path.startsWith("/") ? path : `/${path}`}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), GAMMA_FETCH_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      ...(opts.cache === "no-store"
        ? { cache: "no-store" as const }
        : { next: { revalidate: REVALIDATE_SEC, ...opts.next } }),
    })
    if (!res.ok) return { ok: false, status: res.status }
    try {
      const data = (await res.json()) as T
      return { ok: true, data }
    } catch {
      return { ok: false, status: 502 }
    }
  } catch {
    /* DNS, TLS, firewall, timeout, offline, etc. */
    return { ok: false, status: 0 }
  } finally {
    clearTimeout(timer)
  }
}

/** Minimal Gamma shapes — only fields we read */
export type GammaMarket = {
  id?: string
  question?: string
  slug?: string
  outcomes?: string
  outcomePrices?: string
  volume?: string
  volumeNum?: number
  endDate?: string
  active?: boolean
  closed?: boolean
  archived?: boolean
  description?: string
  image?: string
  /** Gamma often duplicates the cover here — use when `image` is empty. */
  icon?: string
  groupItemTitle?: string
  events?: { title?: string; category?: string; slug?: string }[]
}

export type GammaEvent = {
  id?: string
  title?: string
  slug?: string
  description?: string
  endDate?: string
  active?: boolean
  closed?: boolean
  archived?: boolean
  volume?: number
  category?: string
  tags?: { label?: string; slug?: string }[]
  markets?: GammaMarket[]
  image?: string
  icon?: string
}

export function parseJsonArrayString(raw: string | undefined): unknown[] {
  if (!raw || typeof raw !== "string") return []
  try {
    const v = JSON.parse(raw) as unknown
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function parseOutcomeRows(m: GammaMarket): ContractCore[] {
  const labels = parseJsonArrayString(m.outcomes).map((x) =>
    typeof x === "string" ? x : String(x)
  )
  const pricesRaw = parseJsonArrayString(m.outcomePrices).map((x) => {
    const n = typeof x === "number" ? x : parseFloat(String(x))
    return Number.isFinite(n) ? clamp01(n) : 0
  })
  const n = Math.max(labels.length, pricesRaw.length)
  const out: ContractCore[] = []
  for (let i = 0; i < n; i++) {
    const name = (labels[i] ?? `Contract ${i + 1}`).trim() || `Contract ${i + 1}`
    const yesPrice = clamp01(pricesRaw[i] ?? 0)
    out.push({
      id: `g-${i}`,
      name,
      yesPrice,
      noPrice: 1 - yesPrice,
    })
  }
  return out
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function volumeFromMarket(m: GammaMarket): number {
  if (typeof m.volumeNum === "number" && Number.isFinite(m.volumeNum))
    return m.volumeNum
  const v = parseFloat(String(m.volume ?? "0"))
  return Number.isFinite(v) ? v : 0
}

function volumeFromEvent(e: GammaEvent): number {
  const v = e.volume
  if (typeof v === "number" && Number.isFinite(v)) return v
  const mk = e.markets ?? []
  return mk.reduce((s, m) => s + volumeFromMarket(m), 0)
}

function statusFromFlags(active?: boolean, closed?: boolean): "open" | "closed" {
  if (closed) return "closed"
  if (active === false) return "closed"
  return "open"
}

function isYesNoPair(contracts: readonly { name: string }[]): boolean {
  if (contracts.length !== 2) return false
  const a = contracts[0]?.name.trim().toLowerCase()
  const b = contracts[1]?.name.trim().toLowerCase()
  return a === "yes" && b === "no"
}

function endDateFromMarket(m: GammaMarket, fallback?: string): string {
  const d = m.endDate || fallback
  if (d) return d
  return new Date().toISOString()
}

export function mapGammaMarketToViewModel(
  m: GammaMarket,
  source: "gamma-market" | "gamma-event",
  ctx?: {
    eventTitle?: string
    category?: string
    eventEnd?: string
    eventTags?: { label?: string }[]
  }
): MarketViewModel | null {
  const slug = m.slug?.trim()
  const id = m.id?.trim()
  if (!slug || !id) return null

  const parsedContracts = parseOutcomeRows(m)
  if (parsedContracts.length < 2) return null

  const marketType = isYesNoPair(parsedContracts) ? "binary" : "multi"

  const ev0 = m.events?.[0]
  const question =
    ctx?.eventTitle?.trim() || m.question?.trim() || "Untitled market"
  const category = normalizeCategory(
    ctx?.category ?? ev0?.category,
    ctx?.eventTags
  )
  const core: ContractCore[] =
    marketType === "binary"
      ? [
          {
            id: "g-0",
            name: question,
            yesPrice: parsedContracts[0]!.yesPrice,
            noPrice: parsedContracts[0]!.noPrice,
          },
        ]
      : parsedContracts

  const contracts = withContractHistory(slug, core)

  return {
    id,
    slug,
    question,
    category,
    marketType,
    contracts,
    volumeUsd: volumeFromMarket(m),
    expiresAt: endDateFromMarket(m, ctx?.eventEnd),
    status: statusFromFlags(m.active, m.closed),
    description: m.description?.trim() || undefined,
    image: pickGammaImage(m),
    source,
  }
}

/** Single-market event → tradeable binary uses the child market slug. */
export function mapGammaEventToHomeRow(e: GammaEvent): MarketViewModel | null {
  if (e.archived) return null
  const slug = e.slug?.trim()
  const id = e.id?.trim()
  if (!slug || !id) return null

  const markets = (e.markets ?? []).filter((m) => !m.archived)
  if (markets.length === 0) return null

  if (markets.length === 1) {
    const m = markets[0]!
    const vm = mapGammaMarketToViewModel(m, "gamma-event", {
      eventTitle: e.title,
      category: e.category,
      eventEnd: e.endDate,
      eventTags: e.tags,
    })
    if (!vm) return null
    const eventArt = pickGammaImage(e)
    if (!vm.image && eventArt) return { ...vm, image: eventArt }
    return vm
  }

  const sorted = [...markets].sort(
    (a, b) => volumeFromMarket(b) - volumeFromMarket(a)
  )

  const core: ContractCore[] = sorted
    .map((m) => {
      const rows = parseOutcomeRows(m)
      const yesPrice = rows[0]?.yesPrice ?? 0
      const name =
        m.groupItemTitle?.trim() ||
        m.question?.replace(/\?+$/, "").trim().slice(0, 42) ||
        "Contract"
      return {
        id: `g-agg-${m.id ?? name}`,
        name,
        yesPrice: clamp01(yesPrice),
        noPrice: 1 - clamp01(yesPrice),
      }
    })
    .filter((c) => c.name.length > 0)

  if (core.length < 2) return null

  const contracts = withContractHistory(slug, core)

  return {
    id: `event:${id}`,
    slug,
    question: e.title?.trim() || "Untitled event",
    category: normalizeCategory(e.category, e.tags),
    marketType: "multi",
    contracts,
    volumeUsd: volumeFromEvent(e),
    expiresAt: e.endDate || endDateFromMarket(sorted[0]!, undefined),
    status: statusFromFlags(e.active, e.closed),
    description: e.description?.trim() || undefined,
    image: pickGammaImage(e),
    source: "gamma-event",
  }
}

function pickGammaImage(m: { image?: string; icon?: string }): string | undefined {
  const u = (m.image || m.icon || "").trim()
  return u || undefined
}

async function fetchHomeRowsFromNetwork(): Promise<{
  markets: MarketViewModel[]
  error?: string
}> {
  const res = await gammaJson<GammaEvent[]>(
    "/events?order=volume&ascending=false&limit=42",
    { cache: "no-store" }
  )
  if (!res.ok) {
    return {
      markets: [],
      error:
        res.status === 0
          ? "Could not reach Polymarket (network, VPN, or firewall). Check your connection and retry."
          : "Could not load markets. Try again in a moment.",
    }
  }

  const rows: MarketViewModel[] = []
  for (const e of res.data) {
    const vm = mapGammaEventToHomeRow(e)
    if (vm) rows.push(vm)
  }

  const extra = await gammaJson<GammaMarket[]>(
    "/markets?order=volume&ascending=false&limit=18",
    { cache: "no-store" }
  )
  if (extra.ok) {
    const seen = new Set(rows.map((r) => r.slug))
    for (const m of extra.data) {
      const vm = mapGammaMarketToViewModel(m, "gamma-market")
      if (vm && !seen.has(vm.slug)) {
        rows.push(vm)
        seen.add(vm.slug)
      }
    }
  }

  return { markets: rows }
}

async function getMarketsForHomeInternal(): Promise<{
  markets: MarketViewModel[]
  error?: string
}> {
  if (memory && Date.now() < memory.expiresAt) {
    return { markets: memory.markets }
  }

  if (homeInflight) {
    return homeInflight
  }

  homeInflight = (async () => {
    const fresh = await fetchHomeRowsFromNetwork()
    if (fresh.markets.length > 0) {
      memory = {
        expiresAt: Date.now() + MEMORY_TTL_MS,
        markets: fresh.markets,
        bySlug: indexBySlug(fresh.markets),
      }
      return { markets: fresh.markets }
    }
    if (memory) {
      memory.expiresAt = Date.now() + MEMORY_TTL_MS
      return { markets: memory.markets }
    }
    return fresh
  })().finally(() => {
    homeInflight = null
  })

  return homeInflight
}

/**
 * Discovery list: memory TTL + in-flight dedupe + React cache() per request.
 * Bulk fetch stays `no-store` (large payload); filtering stays client-side on props.
 */
export const getMarketsForHome = cache(getMarketsForHomeInternal)

async function fetchMarketBySlugFromNetwork(
  clean: string
): Promise<MarketViewModel | null> {
  const mRes = await gammaJson<GammaMarket>(
    `/markets/slug/${encodeURIComponent(clean)}`,
    { next: { revalidate: REVALIDATE_SEC } }
  )
  if (mRes.ok) {
    const vm = mapGammaMarketToViewModel(mRes.data, "gamma-market")
    if (vm) return vm
  }

  const eRes = await gammaJson<GammaEvent>(
    `/events/slug/${encodeURIComponent(clean)}`,
    { next: { revalidate: REVALIDATE_SEC } }
  )
  if (!eRes.ok) return null

  const e = eRes.data
  const markets = (e.markets ?? []).filter((m) => !m.archived)

  if (markets.length === 1) {
    return mapGammaMarketToViewModel(markets[0]!, "gamma-event", {
      eventTitle: e.title,
      category: e.category,
      eventEnd: e.endDate,
      eventTags: e.tags,
    })
  }

  if (markets.length > 1) {
    return mapGammaEventToHomeRow(e)
  }

  return null
}

async function getMarketBySlugInternal(
  slug: string
): Promise<MarketViewModel | null> {
  const clean = decodeURIComponent(slug).trim()
  if (!clean) return null

  await getMarketsForHome()

  const hit = memory?.bySlug.get(clean)
  if (hit) return hit

  if (slugInflight.has(clean)) {
    return slugInflight.get(clean)!
  }

  const p = fetchMarketBySlugFromNetwork(clean)
    .then((vm) => {
      if (vm && memory) {
        memory.bySlug.set(vm.slug, vm)
      }
      return vm
    })
    .finally(() => {
      slugInflight.delete(clean)
    })

  slugInflight.set(clean, p)
  return p
}

/** Slug detail: reuse warmed discovery index; otherwise small cached Gamma fetch. */
export const getMarketBySlug = cache(getMarketBySlugInternal)

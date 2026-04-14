import type { PricePoint } from "@/lib/market-view-model"

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic mock time series for demo UI (per market slug + contract id). */
export function buildDemoContractHistory(
  marketSlug: string,
  contractId: string,
  baselineYes: number,
  pointCount = 40
): PricePoint[] {
  const seed = hashStr(`${marketSlug}|${contractId}`)
  const now = Date.now()
  const stepMs = 3_600_000
  let v = Math.min(0.99, Math.max(0.01, baselineYes))
  const out: PricePoint[] = []
  for (let i = pointCount - 1; i >= 0; i--) {
    const t = Math.sin(seed + i * 9337) * 10000
    const jitter = (t - Math.floor(t) - 0.5) * 0.07
    v = Math.min(0.99, Math.max(0.01, v + jitter))
    out.push({
      timestamp: new Date(now - i * stepMs).toISOString(),
      value: v,
    })
  }
  return out
}

export function withContractHistory(
  marketSlug: string,
  contracts: readonly { id: string; name: string; yesPrice: number; noPrice: number }[]
) {
  return contracts.map((c) => ({
    ...c,
    history: buildDemoContractHistory(marketSlug, c.id, c.yesPrice),
  }))
}

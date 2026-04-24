function clampProbability(probability: number): number {
  if (!Number.isFinite(probability)) return 0
  return Math.max(0, Math.min(1, probability))
}

export function formatDecimalOdds(probability: number): string {
  const p = clampProbability(probability)
  if (p <= 0) return "∞"
  const odds = 1 / p
  return odds.toFixed(2)
}

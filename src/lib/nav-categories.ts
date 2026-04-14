/** Navigation-only categories (never raw Gamma tag strings). */

export type NavCategory =
  | "Politics"
  | "Sports"
  | "Crypto"
  | "Business"
  | "World"
  | "Tech"
  | "General"

export const NAV_CATEGORY_ORDER: readonly NavCategory[] = [
  "Politics",
  "Sports",
  "Crypto",
  "Business",
  "World",
  "Tech",
  "General",
] as const

/**
 * Map Gamma `category` + tag labels into a small nav set.
 * Tags are used only as keyword signals, never surfaced as tab labels.
 */
export function normalizeCategory(
  raw?: string | null,
  tags?: { label?: string }[]
): NavCategory {
  const parts: string[] = []
  if (raw?.trim()) parts.push(raw.trim())
  for (const t of tags ?? []) {
    const lab = t.label?.trim()
    if (lab && lab.toLowerCase() !== "all") parts.push(lab)
  }
  const hay = parts.join(" | ").toLowerCase()
  if (!hay) return "General"

  if (
    hay.includes("sport") ||
    hay.includes("nba") ||
    hay.includes("nfl") ||
    hay.includes("soccer") ||
    hay.includes("mlb") ||
    hay.includes("ufc") ||
    hay.includes("f1") ||
    hay.includes("olympic") ||
    hay.includes("world cup") ||
    hay.includes("premier league") ||
    hay.includes("chess") ||
    hay.includes("golf") ||
    hay.includes("tennis") ||
    hay.includes("nhl")
  )
    return "Sports"

  if (
    hay.includes("crypto") ||
    hay.includes("bitcoin") ||
    hay.includes("ethereum") ||
    hay.includes("defi") ||
    hay.includes("nft") ||
    hay.includes("altcoin") ||
    hay.includes("solana")
  )
    return "Crypto"

  if (
    hay.includes("politic") ||
    hay.includes("election") ||
    hay.includes("president") ||
    hay.includes("congress") ||
    hay.includes("senate") ||
    hay.includes("current-affairs") ||
    hay.includes("white house") ||
    hay.includes("january 6") ||
    hay.includes("j6") ||
    hay.includes("supreme court") ||
    hay.includes("cabinet")
  )
    return "Politics"

  if (
    hay.includes("business") ||
    hay.includes("finance") ||
    hay.includes("economy") ||
    hay.includes("earnings") ||
    hay.includes("ipo") ||
    hay.includes("stock") ||
    hay.includes("fomc") ||
    hay.includes("interest rate") ||
    hay.includes("jerome powell") ||
    hay.includes("powell") ||
    (hay.includes("fed") &&
      (hay.includes("rate") || hay.includes("chair") || hay.includes("cut")))
  )
    return "Business"

  if (
    hay.includes("tech") ||
    hay.includes("software") ||
    hay.includes("science") ||
    hay.includes("space") ||
    /\b(ai|llm|ml|openai|deepmind)\b/i.test(hay)
  )
    return "Tech"

  if (
    hay.includes("ukraine") ||
    hay.includes("russia") ||
    hay.includes("china") ||
    hay.includes("israel") ||
    hay.includes("gaza") ||
    hay.includes("iran") ||
    hay.includes("geopolit") ||
    hay.includes("nato") ||
    hay.includes("eu ") ||
    hay.includes("e.u.") ||
    hay.includes("europe") ||
    hay.includes("middle east") ||
    hay.includes("asia") ||
    hay.includes("africa") ||
    hay.includes("latin america")
  )
    return "World"

  return "General"
}

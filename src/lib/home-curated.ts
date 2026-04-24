export type CuratedCategoryKey = "trending" | "breaking" | "new"

export type CuratedMarketItem = {
  slug: string
  question: string
  subline?: string
  probabilityPct: number
}

export type CuratedSection = {
  key: CuratedCategoryKey
  title: string
  href: string
  items: CuratedMarketItem[]
}

export type CuratedApiResponse = {
  sections: CuratedSection[]
}

export const CURATED_SECTIONS: ReadonlyArray<{
  key: CuratedCategoryKey
  title: string
  href: string
  tagSlug: string
}> = [
  { key: "trending", title: "Trending", href: "/?curated=trending", tagSlug: "trending" },
  { key: "breaking", title: "Breaking", href: "/?curated=breaking", tagSlug: "breaking" },
  { key: "new", title: "New", href: "/?curated=new", tagSlug: "new" },
]

import { HomeMarkets } from "@/components/home-markets"
import { LegalFooter } from "@/components/legal-footer"
import { getAllSnapshotMarkets } from "@/lib/market-data"
 

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{
    time?: string | string[]
  }>
}) {
  const sp = await searchParams
  const timeRaw = typeof sp?.time === "string" ? sp.time.trim() : ""
  const time =
    timeRaw === "24H" || timeRaw === "7D" || timeRaw === "30D" || timeRaw === "All time"
      ? timeRaw
      : "All time"

  return (
    <>
      <HomeMarkets
        initialMarkets={getAllSnapshotMarkets()}
        initialTimeFilter={time}
      />
      <LegalFooter />
    </>
  )
}

import { HomeMarkets } from "@/components/home-markets"
import { getAllSnapshotMarkets } from "@/lib/market-data"

export default function HomePage() {
  return <HomeMarkets initialMarkets={getAllSnapshotMarkets()} />
}

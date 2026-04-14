"use client"

import type { ContractView } from "@/lib/market-view-model"

import { ContractPriceChart } from "@/components/market/contract-price-chart"

/** Binary / single-contract page: full-width price block above the contract row. */
export function MarketContractChart({ contract }: { contract: ContractView }) {
  return <ContractPriceChart contract={contract} />
}

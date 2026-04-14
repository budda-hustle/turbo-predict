"use client"

import { ThemeProvider } from "next-themes"

import { TradingProvider } from "@/lib/trading-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TradingProvider>{children}</TradingProvider>
    </ThemeProvider>
  )
}

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AppHeader } from "@/components/app-header"
import { Providers } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PulseMarkets — Prediction markets",
  description: "Demo prediction markets — discover, trade, and track positions.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.className} flex min-h-full flex-col antialiased`}
      >
        <Providers>
          <AppHeader />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

import type { ReactNode } from "react"

import { AppBottomNav } from "@/components/app-bottom-nav"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <AppSidebar />
      <AppBottomNav />
      <main className="min-h-screen bg-background pb-16 pt-16 text-foreground lg:ml-[72px] lg:pb-0">
        {children}
      </main>
    </>
  )
}

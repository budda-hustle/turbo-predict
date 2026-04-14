"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function TradeTicketSidebar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <aside
      className={cn(
        "hidden lg:block lg:sticky lg:top-24 lg:self-start",
        className
      )}
    >
      {children}
    </aside>
  )
}

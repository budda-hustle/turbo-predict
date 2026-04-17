"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function TradeTicketMobileSheet({
  open,
  onOpenChange,
  title = "Trade",
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed top-auto bottom-0 left-2 right-2 z-50 max-h-[min(90dvh,720px)] w-auto max-w-none",
          "translate-x-0 translate-y-0 overflow-y-visible rounded-t-xl rounded-b-none border-0 bg-transparent p-0 shadow-none",
          "sm:left-4 sm:right-4",
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-4 duration-200"
        )}
      >
        <div className="pb-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

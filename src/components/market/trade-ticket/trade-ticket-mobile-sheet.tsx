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
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-x-0 top-auto bottom-0 z-50 max-h-[min(90dvh,720px)] w-full max-w-none sm:max-w-none",
          "translate-x-0 translate-y-0 overflow-y-visible rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-none",
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-4 duration-200"
        )}
      >
        <div className="w-full px-0 pb-4 [&>*]:w-full">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

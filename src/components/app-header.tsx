"use client"

import Image from "next/image"
import Link from "next/link"

import { DepositDialog } from "@/components/deposit-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatUsd } from "@/lib/markets"
import { useTrading } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const { balanceUsd, openDeposit, logout, resetDemo } = useTrading()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="pressable flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-foreground"
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center overflow-hidden rounded-md border border-border bg-card p-0.5"
                )}
              >
                <Image
                  src="/brand/turbo-predict-logo.png"
                  alt="TurboPredict logo"
                  width={20}
                  height={20}
                  className="size-5 rounded-[3px] object-contain"
                  priority
                />
              </span>
              <span className="hidden sm:inline">TurboPredict</span>
            </Link>
            <Link
              href="/positions"
              className="pressable text-xs font-medium text-muted-foreground hover:text-foreground sm:hidden"
            >
              Positions
            </Link>
          </div>

          <nav className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/positions"
              className="pressable hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Positions
            </Link>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs tabular-nums text-foreground sm:text-sm">
              {formatUsd(balanceUsd)}
            </div>
            <Button
              type="button"
              size="sm"
              className="pressable cursor-pointer transition-colors hover:bg-primary/90"
              onClick={() => openDeposit()}
            >
              Deposit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "pressable cursor-pointer rounded-full outline-none transition-colors hover:bg-muted/35 hover:border-foreground/20"
                )}
              >
                <Avatar className="size-6">
                  <AvatarFallback className="bg-muted text-[10px] font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => openDeposit()}>
                  Deposit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    resetDemo()
                  }}
                >
                  Reset demo
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <DepositDialog />
    </>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowLeftIcon, CheckIcon, CopyIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTrading } from "@/lib/trading-context"
import { cn } from "@/lib/utils"

const DEMO_ADDRESS = "0xA3f0B5dA6f92e8cA4d7B3A1f2C9E0D6b7F1a2C3d"
const CRYPTO_ICONS = [
  "/icons/btc.png",
  "/icons/eth.png",
  "/icons/sol.png",
  "/icons/doge.png",
] as const
const EXCHANGE_ICONS = [
  "/icons/phantom.png",
  "/icons/metamask.png",
  "/icons/coinbase.png",
  "/icons/okx.png",
] as const

type DepositStep = "method" | "transfer"

function IconStack({ icons }: { icons: readonly string[] }) {
  return (
    <div className="flex shrink-0 items-center pl-2" aria-hidden>
      {icons.map((src, i) => (
        <span
          key={`${src}-${i}`}
          className={cn("relative block size-6 overflow-hidden rounded-full ring-1 ring-border/55", i > 0 && "-ml-2")}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="24px"
            className="object-cover"
          />
        </span>
      ))}
    </div>
  )
}

function QrPlaceholder() {
  const size = 19
  const cells = React.useMemo(() => {
    const out: number[] = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const corner =
          (x < 5 && y < 5) ||
          (x > size - 6 && y < 5) ||
          (x < 5 && y > size - 6)
        const v = ((x * 17 + y * 31 + x * y * 7) % 11) < 5
        out.push(corner ? 1 : v ? 1 : 0)
      }
    }
    return out
  }, [])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div
        className="grid gap-[2px] rounded-md bg-background p-2 ring-1 ring-border/50"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          width: 220,
          height: 220,
        }}
        aria-hidden
      >
        {cells.map((v, i) => (
          <span
            key={i}
            className={cn("rounded-[1px]", v ? "bg-foreground" : "bg-transparent")}
          />
        ))}
      </div>
    </div>
  )
}

export function DepositDialog() {
  const { depositOpen, setDepositOpen } = useTrading()
  const [step, setStep] = React.useState<DepositStep>("method")
  const [token, setToken] = React.useState("USDC")
  const [network, setNetwork] = React.useState("Polygon")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!depositOpen) {
      setStep("method")
      setToken("USDC")
      setNetwork("Polygon")
      setCopied(false)
    }
  }, [depositOpen])

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(DEMO_ADDRESS)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog open={depositOpen} onOpenChange={(open) => setDepositOpen(open)}>
      <DialogContent showCloseButton={false} className="gap-5 sm:max-w-lg">
        {step === "method" ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-base">Deposit</DialogTitle>
                <DialogDescription className="text-xs">
                  Add funds to your TurboPredict wallet
                </DialogDescription>
              </DialogHeader>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer transition-colors hover:bg-muted/45"
                    aria-label="Close deposit modal"
                  />
                }
              >
                <XIcon />
              </DialogClose>
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 rounded-lg border border-border/60 bg-muted/15 p-1">
                <button
                  type="button"
                  className="cursor-pointer rounded-md bg-card px-3 py-2 text-xs font-medium text-foreground ring-1 ring-border/50 transition-colors"
                >
                  Use Crypto
                </button>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md px-3 py-2 text-xs font-medium text-muted-foreground/60"
                >
                  Use Cash
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                className={cn(
                  "pressable h-auto cursor-pointer justify-between rounded-lg border-border/60 bg-card/40 px-4 py-3 text-left transition-colors",
                  "hover:border-foreground/25 hover:bg-card/65"
                )}
                onClick={() => setStep("transfer")}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Transfer Crypto
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Deposit from your wallet
                  </span>
                </span>
                <IconStack icons={CRYPTO_ICONS} />
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled
                className="h-auto cursor-not-allowed justify-between rounded-lg border-border/50 bg-card/20 px-4 py-3 text-left opacity-70"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground/85">
                    Connect Exchange
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Coming soon
                  </span>
                </span>
                <IconStack icons={EXCHANGE_ICONS} />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-1">
              <div className="grid grid-cols-3 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit cursor-pointer text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                  onClick={() => setStep("method")}
                >
                  <ArrowLeftIcon />
                </Button>
                <DialogTitle className="text-center text-base">
                  Transfer Crypto
                </DialogTitle>
                <div className="justify-self-end">
                  <DialogClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer transition-colors hover:bg-muted/45"
                        aria-label="Close deposit modal"
                      />
                    }
                  >
                    <XIcon />
                  </DialogClose>
                </div>
              </div>
              <DialogDescription className="text-center text-xs">
                Deposit funds to your TurboPredict wallet
              </DialogDescription>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="deposit-token" className="text-xs">
                  Token
                </Label>
                <select
                  id="deposit-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-9 cursor-pointer rounded-md border border-border/60 bg-card px-2.5 text-sm text-foreground outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option>USDC</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="deposit-network" className="text-xs">
                  Network
                </Label>
                <select
                  id="deposit-network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="h-9 cursor-pointer rounded-md border border-border/60 bg-card px-2.5 text-sm text-foreground outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option>Polygon</option>
                </select>
              </div>
            </div>

            <p className="text-right text-[11px] text-muted-foreground">
              Min deposit: $10
            </p>

            <div className="flex justify-center">
              <QrPlaceholder />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Deposit address</Label>
              <div className="rounded-lg border border-border/60 bg-card/40 p-2.5 font-mono text-[11px] break-all text-foreground">
                {DEMO_ADDRESS}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  className="pressable cursor-pointer"
                  onClick={() => void copyAddress()}
                >
                  {copied ? (
                    <>
                      <CheckIcon />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      Copy address
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  className="cursor-pointer text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  View terms
                </button>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Only send USDC on Polygon to this address. Other assets may be
              lost.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

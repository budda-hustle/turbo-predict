import { cn } from "@/lib/utils"

export function HomeMarketsSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="max-w-2xl space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-8 max-w-md animate-pulse rounded bg-muted w-[75%]" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-10 max-w-md animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-16 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "surface-card flex flex-col gap-3 p-4 animate-pulse"
            )}
          >
            <div className="flex gap-3">
              <div className="size-12 shrink-0 rounded-md bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-3 w-14 rounded bg-muted" />
                </div>
                <div className="h-10 w-full rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
            </div>
            <div className="border-t border-border/50 pt-3">
              <div className="flex flex-wrap gap-1.5">
                <div className="h-7 w-24 rounded-md bg-muted" />
                <div className="h-7 w-24 rounded-md bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Legacy `?side=yes|no` query — server-safe (no `"use client"`). */

export type BinarySide = "yes" | "no"

export function sideToOutcomeIndex(
  side: BinarySide | undefined
): number | undefined {
  if (side === "yes") return 0
  if (side === "no") return 1
  return undefined
}

"use client"

import * as React from "react"

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = React.useState(defaultValue)

  React.useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatches(m.matches)
    on()
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [query])

  return matches
}

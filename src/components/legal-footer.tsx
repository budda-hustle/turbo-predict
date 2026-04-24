import Link from "next/link"

export function LegalFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:px-6">
      <p className="text-center text-[14px] leading-relaxed text-muted-foreground">
        TurboStars operates globally through separate legal entities. This
        international platform is not regulated by the CFTC and operates
        independently. Trading involves substantial risk of loss. See our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </footer>
  )
}

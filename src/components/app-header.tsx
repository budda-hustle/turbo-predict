import Image from "next/image"

const NAV_BG = "#171717"
const NAV_BORDER = "#303030"

export function AppHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-16 items-stretch justify-between border-b px-4"
      style={{ backgroundColor: NAV_BG, borderColor: NAV_BORDER }}
    >
      <div className="flex items-center gap-2 py-3 lg:gap-3">
        <Image
          src="/demo-nav/header/expand-menu.png"
          alt="Expand menu"
          width={80}
          height={80}
          className="hidden h-10 w-10 object-contain lg:block"
          priority
        />
        <Image
          src="/demo-nav/header/logo.svg"
          alt="Turbo Stars logo"
          width={3826}
          height={1000}
          className="h-6 w-auto object-contain lg:ml-3 lg:h-8"
          priority
        />
      </div>

      <div className="flex items-center py-2">
        <div className="flex h-[38px] items-center">
          <Image
            src="/demo-nav/header/header-right-desktop.png"
            alt="Header controls"
            width={928}
            height={88}
            className="hidden h-full w-auto object-contain lg:block"
            priority
          />
          <Image
            src="/demo-nav/header/header-right-mobile.png"
            alt="Header controls"
            width={382}
            height={80}
            className="h-full w-auto object-contain lg:hidden"
            priority
          />
        </div>
      </div>
    </header>
  )
}

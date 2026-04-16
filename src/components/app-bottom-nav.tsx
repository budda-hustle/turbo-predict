import Image from "next/image"

const NAV_BG = "#171717"
const NAV_BORDER = "#303030"

const bottomTabs = [
  "/demo-nav/bottom nav/bottom_nav-tab.png",
  "/demo-nav/bottom nav/bottom_nav-tab-1.png",
  "/demo-nav/bottom nav/bottom_nav-tab-2.png",
  "/demo-nav/bottom nav/bottom_nav-tab-3.png",
  "/demo-nav/bottom nav/bottom_nav-tab-4.png",
] as const

export function AppBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 h-16 border-t lg:hidden"
      style={{ backgroundColor: NAV_BG, borderColor: NAV_BORDER }}
      aria-label="Bottom navigation"
    >
      <div className="relative flex h-full items-start justify-between px-2">
        {bottomTabs.map((src, index) => {
          const isCenter = index === 2
          return (
            <div
              key={src}
              className={isCenter ? "relative -mt-4 flex h-full items-start" : "flex h-full items-start"}
            >
              <Image
                src={src}
                alt={`Bottom tab ${index + 1}`}
                width={156}
                height={isCenter ? 152 : 128}
                className={isCenter ? "h-[76px] w-auto object-contain" : "h-16 w-auto object-contain"}
                priority
              />
            </div>
          )
        })}
      </div>
    </nav>
  )
}

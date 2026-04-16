import Image from "next/image"

const NAV_BG = "#171717"
const NAV_BORDER = "#303030"

export function AppSidebar() {
  return (
    <aside
      className="fixed bottom-0 left-0 top-16 z-40 hidden w-[72px] border-r lg:block"
      style={{ backgroundColor: NAV_BG, borderColor: NAV_BORDER }}
      aria-label="Primary sidebar"
    >
      <div className="flex h-full flex-col items-center justify-between p-3">
        <Image
          src="/demo-nav/left nav desktop tablet/icons-sidebar-top.png"
          alt="Sidebar main icons"
          width={96}
          height={1048}
          className="w-12 max-w-full object-contain"
          priority
        />
        <Image
          src="/demo-nav/left nav desktop tablet/icons-sidebar-bottom.png"
          alt="Sidebar utility icons"
          width={96}
          height={288}
          className="w-12 max-w-full object-contain"
          priority
        />
      </div>
    </aside>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
    </svg>
  )
}

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: <Icon d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
  },
  {
    href: "/chat",
    label: "Chat",
    icon: <Icon d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />,
  },
  {
    href: "/history",
    label: "History",
    icon: <Icon d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  },
  {
    href: "/templates",
    label: "Templates",
    icon: <Icon d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Icon d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" d2="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
  },
]

export default function Sidebar({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="w-16 min-h-screen bg-white border-r border-gray-100 flex flex-col items-center py-5 gap-1 shrink-0">
      {/* Logo slot */}
      <div className="w-9 h-9 rounded-xl overflow-hidden mb-5 shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
            </svg>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`w-full h-10 rounded-xl flex items-center justify-center transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {icon}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

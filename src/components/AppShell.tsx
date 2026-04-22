import Sidebar from "@/components/Sidebar"
import SearchBar from "@/components/SearchBar"
import VerifyBanner from "@/components/VerifyBanner"
import UserAvatar from "@/components/UserAvatar"
import { getSettings } from "@/lib/settings"

export default async function AppShell({
  children,
  email,
  name,
  imageUrl,
  emailVerified,
  userId,
}: {
  children: React.ReactNode
  email?: string | null
  name?: string | null
  imageUrl?: string | null
  emailVerified?: boolean
  userId?: string | null
}) {
  const s = await getSettings(userId)
  const logoUrl = s?.logoUrl ?? null

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0">
        {emailVerified === false && email && <VerifyBanner email={email} />}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          <SearchBar />
          <div className="ml-auto flex items-center gap-3">
            <UserAvatar name={name} email={email} imageUrl={imageUrl} />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

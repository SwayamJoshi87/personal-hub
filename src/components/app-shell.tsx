import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'

export function AppShell({
  children,
  pageTitle,
}: {
  children: React.ReactNode
  pageTitle: string
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader title={pageTitle} />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}

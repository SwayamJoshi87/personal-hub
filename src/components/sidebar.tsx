'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/work', label: 'Work', icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-52 flex-col bg-zinc-900 text-zinc-100">
      <div className="px-4 py-4">
        <p className="text-sm font-bold tracking-tight">PersonalHub</p>
        <p className="mt-0.5 text-xs text-zinc-500">swayamjoshi95@gmail.com</p>
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              pathname === href
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator className="bg-white/10" />
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs text-zinc-500">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}

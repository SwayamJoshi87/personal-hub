'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/work', label: 'Work', icon: ClipboardList },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-full flex-col bg-[#0f0f11] border-r border-white/[0.055]">
      {/* App header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_1px_6px_rgba(99,102,241,0.4)]">
            <span className="text-[11px] font-bold text-white tracking-tight">PH</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-none tracking-tight">
              PersonalHub
            </p>
            <p className="mt-[3px] text-[10px] text-white/35 truncate leading-none">
              swayamjoshi95@gmail.com
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/30 hover:text-white/60 hover:bg-white/[0.06] flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] transition-colors duration-100',
                active
                  ? 'bg-white/[0.09] text-white'
                  : 'text-white/45 hover:bg-white/[0.045] hover:text-white/75'
              )}
            >
              <Icon
                className={cn(
                  'h-[15px] w-[15px] flex-shrink-0 transition-colors',
                  active ? 'text-blue-400' : 'text-white/30 group-hover:text-white/55'
                )}
              />
              <span className="text-[13px] font-medium leading-none tracking-[-0.005em]">
                {label}
              </span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.055] px-3 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/25">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

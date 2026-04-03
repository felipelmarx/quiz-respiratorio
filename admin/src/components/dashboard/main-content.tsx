'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main
      className={cn(
        'transition-[margin-left] duration-300 p-8',
        'ml-0 md:ml-64',
        collapsed && 'md:ml-16'
      )}
    >
      {children}
    </main>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { useSidebar } from './sidebar-context'
import type { UserRole, UserPermissions, Permission } from '@/lib/types/database'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  Home,
  ClipboardList,
  Contact,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'

interface SidebarProps {
  userName: string
  userRole: UserRole
  permissions?: UserPermissions
}

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  permission?: Permission
}

const instructorLinks: NavLink[] = [
  { href: '/dashboard', label: 'Visao Geral', icon: Home, permission: 'view_dashboard' },
  { href: '/dashboard/analytics', label: 'Analytics por Pergunta', icon: BarChart3, permission: 'view_dashboard' },
  { href: '/dashboard/responses', label: 'Respostas', icon: ClipboardList, permission: 'view_responses' },
  { href: '/dashboard/students', label: 'Meus Alunos', icon: GraduationCap, permission: 'view_contacts' },
  { href: '/dashboard/contacts', label: 'Contatos', icon: Contact, permission: 'view_contacts' },
  { href: '/dashboard/settings', label: 'Configuracoes', icon: Settings, permission: 'manage_settings' },
]

const masterLinks: NavLink[] = [
  { href: '/admin', label: 'Visao Geral', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/instructors', label: 'Instrutores', icon: Users },
  { href: '/admin/licenses', label: 'Licencas', icon: CreditCard },
  { href: '/admin/settings', label: 'Configuracoes', icon: Settings },
]

export function Sidebar({ userName, userRole, permissions }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar()

  const visibleInstructorLinks = instructorLinks.filter((link) => {
    if (!link.permission) return true
    return hasPermission(userRole, permissions, link.permission)
  })

  const links =
    userRole === 'admin'
      ? [...masterLinks, { href: '---', label: 'divider', icon: LayoutDashboard }, ...visibleInstructorLinks]
      : visibleInstructorLinks

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-navy-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">iB</span>
          </div>
          <span
            className={cn(
              'font-bold text-gray-900 whitespace-nowrap transition-opacity duration-300',
              collapsed ? 'opacity-0 w-0' : 'opacity-100'
            )}
          >
            iBreathwork
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            if (link.href === '---') {
              return <li key="divider" className="my-3 border-t border-gray-200" />
            }

            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href))

            const Icon = link.icon

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? link.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-navy-50 text-navy-900 border-l-2 border-gold-500'
                      : 'text-gray-600 hover:bg-navy-50 hover:text-navy-700'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      'whitespace-nowrap transition-opacity duration-300',
                      collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-navy-50 flex items-center justify-center">
            <span className="text-sm font-medium text-navy-700">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div
            className={cn(
              'flex-1 min-w-0 transition-opacity duration-300',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">
              {userRole === 'admin' ? 'Administrador' : 'Instrutor'}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <div className="hidden md:flex border-t border-gray-200 p-2 justify-center">
        <button
          onClick={toggle}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white md:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white hidden md:block transition-[width] duration-300 overflow-hidden',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

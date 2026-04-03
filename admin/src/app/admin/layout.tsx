import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { MainContent } from '@/components/dashboard/main-content'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          userName={profile?.name || 'Admin'}
          userRole={user.role}
          userId={user.id}
          permissions={user.permissions}
        />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  )
}

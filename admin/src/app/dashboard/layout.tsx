import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { parsePermissions } from '@/lib/permissions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('name, role, permissions')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const permissions = parsePermissions(userData.permissions)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={userData.name} userRole={userData.role} permissions={permissions} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

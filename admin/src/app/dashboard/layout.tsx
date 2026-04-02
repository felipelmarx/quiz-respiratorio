import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userName={profile?.name || 'Usuário'}
        userRole={user.role}
        permissions={user.permissions}
      />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

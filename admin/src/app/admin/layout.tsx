import { Sidebar } from '@/components/dashboard/sidebar'
import { DEFAULT_PERMISSIONS } from '@/lib/types/database'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userRole="admin" permissions={DEFAULT_PERMISSIONS} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

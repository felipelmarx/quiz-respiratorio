import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatDate, formatPhone } from '@/lib/utils'
import { ExportCSVButton } from '@/components/dashboard/export-csv-button'
import { hasPermission, parsePermissions } from '@/lib/permissions'

export default async function ContactsPage() {
  const supabase = await createClient()

  // Check export_data permission (view_contacts is enforced by middleware)
  let canExport = true
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single()
    if (userData) {
      canExport = hasPermission(userData.role, parsePermissions(userData.permissions), 'export_data')
    }
  }

  const { data: leads } = await supabase
    .from('quiz_leads')
    .select('id, name, email, phone, referral, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-500 mt-1">Leads capturados pelo quiz</p>
        </div>
        {canExport && <ExportCSVButton leads={leads || []} />}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">WhatsApp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Indicação</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads?.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{lead.name}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.email}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {lead.phone ? formatPhone(lead.phone) : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{lead.referral || '—'}</td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
              {!leads?.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Nenhum contato ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

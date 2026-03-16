import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatDate, formatPhone, getWhatsAppUrl } from '@/lib/utils'
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
                    {lead.phone ? (
                      <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 inline-flex items-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {formatPhone(lead.phone)}
                      </a>
                    ) : '—'}
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

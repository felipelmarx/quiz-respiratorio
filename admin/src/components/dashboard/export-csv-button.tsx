'use client'

import { Button } from '@/components/ui/button'
import { generateCSV } from '@/lib/utils'

interface Lead {
  name: string
  email: string
  phone: string | null
  referral: string | null
  created_at: string
}

export function ExportCSVButton({ leads }: { leads: Lead[] }) {
  function handleExport() {
    const headers = ['Nome', 'Email', 'WhatsApp', 'Indicação', 'Data']
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone || '',
      l.referral || '',
      new Date(l.created_at).toLocaleDateString('pt-BR'),
    ])

    const csv = generateCSV(headers, rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contatos-ibreathwork-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Exportar CSV
    </Button>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PersonalizedLinkProps {
  slug: string
  quizBaseUrl: string
}

export function PersonalizedLink({ slug, quizBaseUrl }: PersonalizedLinkProps) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const url = `${quizBaseUrl}?ref=${slug}`

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mb-6">
      <CardTitle>Seu Link Personalizado</CardTitle>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Compartilhe este link com seus pacientes. As respostas serão vinculadas ao seu perfil automaticamente.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-mono select-all"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="outline" onClick={handleCopy}>
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>
    </Card>
  )
}

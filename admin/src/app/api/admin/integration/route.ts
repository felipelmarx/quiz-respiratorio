import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integration — Check integration config status
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const apiUrl = process.env.MEMBERS_API_URL || ''
    const hasKey = !!process.env.MEMBERS_API_KEY

    return NextResponse.json({
      configured: !!(apiUrl && hasKey),
      api_url: apiUrl,
      has_key: hasKey,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/admin/integration — Test connection to members API
 */
export async function POST() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const apiUrl = process.env.MEMBERS_API_URL
    const apiKey = process.env.MEMBERS_API_KEY

    if (!apiUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis MEMBERS_API_URL e MEMBERS_API_KEY não configuradas.',
      }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      return NextResponse.json({
        success: res.ok,
        status: res.status,
        statusText: res.statusText,
      })
    } catch (fetchError) {
      clearTimeout(timeout)
      const message = fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'
      return NextResponse.json({
        success: false,
        error: message.includes('abort') ? 'Timeout: API não respondeu em 10s' : message,
      })
    }
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Hash a raw API key using SHA-256.
 * Uses Web Crypto API for Edge compatibility.
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a cryptographically random API key.
 */
function generateApiKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `ibnr_${hex}`
}

/**
 * POST — Generate a new API key.
 * Returns the full key ONCE (never stored in plaintext).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const scopes = Array.isArray(body.scopes) ? body.scopes.filter((s: unknown) => typeof s === 'string' && ['read', 'write'].includes(s as string)) : ['read']

    if (!name || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: 'Nome da chave é obrigatório (1-100 caracteres)' },
        { status: 400 }
      )
    }

    if (scopes.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um escopo é obrigatório (read ou write)' },
        { status: 400 }
      )
    }

    const rawKey = generateApiKey()
    const keyHash = await hashApiKey(rawKey)
    const keyPrefix = rawKey.substring(0, 13) // "ibnr_" + 8 hex chars

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: auth.user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        scopes,
      })
      .select('id, key_prefix, name, scopes, created_at')
      .single()

    if (error) {
      console.error('API key creation error:', error)
      return NextResponse.json(
        { error: 'Erro ao criar chave de API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.id,
      key: rawKey,
      key_prefix: data.key_prefix,
      name: data.name,
      scopes: data.scopes,
      created_at: data.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('API key POST error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET — List user's API keys (prefix, name, created_at, last_used_at — NOT the full key).
 */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, scopes, last_used_at, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API keys list error:', error)
      return NextResponse.json(
        { error: 'Erro ao listar chaves de API' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('API keys GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE — Revoke an API key by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'ID da chave é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('API key delete error:', error)
      return NextResponse.json(
        { error: 'Erro ao revogar chave de API' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key DELETE error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

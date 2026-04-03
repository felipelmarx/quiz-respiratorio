import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ApiKeyUser {
  user_id: string
  scopes: string[]
  key_id: string
}

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
 * Validate an API key from the Authorization header.
 * Returns the authenticated user info or null.
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  const rawKey = parts[1]
  if (!rawKey.startsWith('ibnr_')) return null

  const keyHash = await hashApiKey(rawKey)

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, scopes')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) return null

  // Check user is active
  const { data: user } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', data.user_id)
    .single()

  if (!user || !user.is_active) return null

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return {
    user_id: data.user_id,
    scopes: data.scopes || ['read'],
    key_id: data.id,
  }
}

/**
 * Require API key authentication with a specific scope.
 * Returns the user info or a JSON error response.
 */
export async function requireApiKey(
  request: NextRequest,
  requiredScope: string
): Promise<{ ok: true; user: ApiKeyUser } | { ok: false; response: NextResponse }> {
  const user = await validateApiKey(request)

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Chave de API inválida ou ausente' },
        { status: 401 }
      ),
    }
  }

  if (!user.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Escopo '${requiredScope}' não autorizado para esta chave` },
        { status: 403 }
      ),
    }
  }

  return { ok: true, user }
}

// ----- Rate limiting -----

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple in-memory rate limiter: 10 requests per second per key.
 */
export function checkRateLimit(keyId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(keyId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(keyId, { count: 1, resetAt: now + 1000 })
    return true
  }

  if (entry.count >= 10) {
    return false
  }

  entry.count++
  return true
}

/**
 * Return a 429 response for rate-limited requests.
 */
export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Limite de requisições excedido. Tente novamente em 1 segundo.' },
    { status: 429, headers: { 'Retry-After': '1' } }
  )
}

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signupSchema } from '@/lib/validations'
import { DEFAULT_PERMISSIONS } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

// Rate limiter: 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const adminClient = createAdminClient()

    // Validate invite token
    const { data: tokenRow } = await adminClient
      .from('invite_tokens')
      .select('id')
      .eq('token', data.token)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!tokenRow) {
      return NextResponse.json(
        { error: 'Link de convite inválido ou desativado.' },
        { status: 400 }
      )
    }

    // Check duplicate email
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', data.email)
      .limit(1)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado.' },
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create user profile
    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: data.email,
        name: data.name,
        role: 'instructor',
        whatsapp: data.whatsapp || null,
        slug,
        is_active: true,
        permissions: DEFAULT_PERMISSIONS,
        profissao: data.profissao || null,
        cidade: data.cidade || null,
      })

    if (profileError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Erro ao criar perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

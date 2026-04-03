import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/onboarding
 * Returns onboarding status and user profile data for the onboarding flow.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('users')
      .select('name, email, whatsapp, profissao, cidade, slug, onboarding_completed_at')
      .eq('id', authUser.id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const quizBaseUrl =
      process.env.NEXT_PUBLIC_QUIZ_URL ||
      (process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/admin\/?$/, '')
        : '')

    return NextResponse.json({
      completed: !!profile.onboarding_completed_at,
      completedAt: profile.onboarding_completed_at,
      profile: {
        name: profile.name,
        email: profile.email,
        whatsapp: profile.whatsapp,
        profissao: profile.profissao,
        cidade: profile.cidade,
        slug: profile.slug,
      },
      quizBaseUrl,
    })
  } catch (err) {
    console.error('Onboarding GET error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/auth/onboarding
 * Updates profile fields and/or marks onboarding as completed.
 * Body: { name?, whatsapp?, profissao?, cidade?, complete?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, whatsapp, profissao, cidade, complete } = body

    const supabase = await createClient()

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (typeof whatsapp === 'string') updates.whatsapp = whatsapp.trim() || null
    if (typeof profissao === 'string') updates.profissao = profissao.trim() || null
    if (typeof cidade === 'string') updates.cidade = cidade.trim() || null
    if (complete === true) updates.onboarding_completed_at = new Date().toISOString()

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)

    if (error) {
      console.error('Onboarding PATCH error:', error)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

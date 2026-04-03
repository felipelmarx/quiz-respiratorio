import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('users')
      .select('slug')
      .eq('id', authUser.id)
      .single()

    const quizBaseUrl =
      process.env.NEXT_PUBLIC_QUIZ_URL ||
      (process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/admin\/?$/, '')
        : '')

    return NextResponse.json({
      id: authUser.id,
      role: authUser.role,
      slug: profile?.slug ?? null,
      quizBaseUrl,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

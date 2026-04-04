import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const notificationPreferencesSchema = z.object({
  email_on_new_response: z.boolean().optional(),
  email_digest_frequency: z.enum(['none', 'daily', 'weekly']).optional(),
  email_digest_day: z.number().int().min(0).max(6).optional(),
})

/**
 * GET /api/quiz/notification-preferences
 * Returns the current user's notification preferences.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Notification preferences GET error:', error)
      return NextResponse.json({ error: 'Erro ao buscar preferências' }, { status: 500 })
    }

    // Return with defaults
    const prefs = data?.notification_preferences || {}
    return NextResponse.json({
      email_on_new_response: prefs.email_on_new_response ?? false,
      email_digest_frequency: prefs.email_digest_frequency ?? 'none',
      email_digest_day: prefs.email_digest_day ?? 1,
    })
  } catch (error) {
    console.error('Notification preferences GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/quiz/notification-preferences
 * Updates the current user's notification preferences.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = notificationPreferencesSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch existing preferences to merge
    const { data: existing } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', authUser.id)
      .single()

    const currentPrefs = existing?.notification_preferences || {}
    const updatedPrefs = { ...currentPrefs, ...parsed.data }

    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: updatedPrefs })
      .eq('id', authUser.id)

    if (error) {
      console.error('Notification preferences PATCH error:', error)
      return NextResponse.json({ error: 'Erro ao salvar preferências' }, { status: 500 })
    }

    return NextResponse.json(updatedPrefs)
  } catch (error) {
    console.error('Notification preferences PATCH error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

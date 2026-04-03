import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const urlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL deve começar com http:// ou https://',
  })

const brandingSchema = z.object({
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional(),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional(),
  logo_url: z.union([urlSchema, z.literal(''), z.null()]).optional(),
  welcome_message: z.string().max(200, 'Máximo 200 caracteres').optional(),
  cta_text: z.string().max(50, 'Máximo 50 caracteres').optional(),
  cta_url: z.union([urlSchema, z.literal(''), z.null()]).optional(),
})

const DEFAULTS = {
  primary_color: '#0A192F',
  accent_color: '#C6A868',
  logo_url: null,
  welcome_message: 'Avalie sua saúde respiratória',
  cta_text: 'Agendar Consulta',
  cta_url: null,
}

/**
 * GET /api/quiz/branding
 * Returns the current user's branding settings with defaults.
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
      .select('branding')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Branding GET error:', error)
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
    }

    const branding = data?.branding || {}
    return NextResponse.json({
      primary_color: branding.primary_color ?? DEFAULTS.primary_color,
      accent_color: branding.accent_color ?? DEFAULTS.accent_color,
      logo_url: branding.logo_url ?? DEFAULTS.logo_url,
      welcome_message: branding.welcome_message ?? DEFAULTS.welcome_message,
      cta_text: branding.cta_text ?? DEFAULTS.cta_text,
      cta_url: branding.cta_url ?? DEFAULTS.cta_url,
    })
  } catch (error) {
    console.error('Branding GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/quiz/branding
 * Updates the current user's branding settings.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = brandingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch existing branding to merge
    const { data: existing } = await supabase
      .from('users')
      .select('branding')
      .eq('id', authUser.id)
      .single()

    const currentBranding = existing?.branding || {}

    // Normalize empty strings to null for URL fields
    const updates = { ...parsed.data }
    if (updates.logo_url === '') updates.logo_url = null
    if (updates.cta_url === '') updates.cta_url = null

    const updatedBranding = { ...currentBranding, ...updates }

    const { error } = await supabase
      .from('users')
      .update({ branding: updatedBranding })
      .eq('id', authUser.id)

    if (error) {
      console.error('Branding PATCH error:', error)
      return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
    }

    return NextResponse.json(updatedBranding)
  } catch (error) {
    console.error('Branding PATCH error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

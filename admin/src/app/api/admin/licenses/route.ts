import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const licenseUpdateSchema = z.object({
  instructor_id: z.string().uuid(),
  license_plan: z.enum(['free', 'monthly', 'annual', 'lifetime']),
  license_price: z.number().min(0).max(99999),
  license_expires_at: z.string().datetime().nullable(),
})

export async function GET() {
  try {
    const auth = await requireAuth({ role: 'admin' })
    if (!auth.ok) return auth.response

    const supabase = await createClient()

    // Fetch license summary via RPC
    const { data: summary, error: summaryError } = await supabase.rpc('get_license_summary')

    if (summaryError) {
      console.error('get_license_summary error:', summaryError)
    }

    // Fetch all instructors with license data
    const { data: instructors, error: instructorsError } = await supabase
      .from('users')
      .select('id, name, email, license_plan, license_price, license_expires_at, is_active, created_at')
      .eq('role', 'instructor')
      .order('name', { ascending: true })

    if (instructorsError) {
      console.error('instructors fetch error:', instructorsError)
      return NextResponse.json(
        { error: 'Erro ao buscar instrutores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      summary: summary ?? null,
      instructors: instructors ?? [],
    })
  } catch (error) {
    console.error('Licenses GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth({ role: 'admin' })
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = licenseUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { instructor_id, license_plan, license_price, license_expires_at } = parsed.data

    const supabase = await createClient()

    // Update the instructor's license
    const { error: updateError } = await supabase
      .from('users')
      .update({
        license_plan,
        license_price,
        license_expires_at,
      })
      .eq('id', instructor_id)
      .eq('role', 'instructor')

    if (updateError) {
      console.error('License update error:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar licença' },
        { status: 500 }
      )
    }

    // Log to license_history
    const { error: historyError } = await supabase
      .from('license_history')
      .insert({
        user_id: instructor_id,
        changed_by: auth.user.id,
        new_plan: license_plan,
        new_price: license_price,
        new_expires_at: license_expires_at,
      })

    if (historyError) {
      // Non-blocking: log but don't fail
      console.error('License history insert error:', historyError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Licenses PATCH error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

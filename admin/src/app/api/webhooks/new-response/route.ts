import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/new-response
 *
 * Called by Supabase Database Webhook on INSERT to quiz_responses.
 * Verifies webhook secret, looks up the instructor, checks their
 * notification preferences, and logs email notifications.
 *
 * Actual email sending (via Resend/SendGrid) to be added later.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[webhook/new-response] WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the webhook payload (Supabase sends { type, table, record, ... })
    const payload = await request.json()
    const record = payload?.record

    if (!record) {
      return NextResponse.json({ error: 'No record in payload' }, { status: 400 })
    }

    // Look up the lead to find the instructor
    const supabase = await createClient()

    const { data: lead } = await supabase
      .from('quiz_leads')
      .select('id, name, email, instructor_id')
      .eq('id', record.lead_id)
      .single()

    if (!lead?.instructor_id) {
      console.log('[webhook/new-response] No instructor_id for lead', record.lead_id)
      return NextResponse.json({ ok: true, notified: false, reason: 'no_instructor' })
    }

    // Check the instructor's notification preferences
    const { data: instructor } = await supabase
      .from('users')
      .select('id, name, email, notification_preferences')
      .eq('id', lead.instructor_id)
      .single()

    if (!instructor) {
      console.log('[webhook/new-response] Instructor not found:', lead.instructor_id)
      return NextResponse.json({ ok: true, notified: false, reason: 'instructor_not_found' })
    }

    const prefs = (instructor.notification_preferences || {}) as Record<string, unknown>

    if (prefs.email_on_new_response !== true) {
      console.log('[webhook/new-response] Instructor', instructor.id, 'has email_on_new_response disabled')
      return NextResponse.json({ ok: true, notified: false, reason: 'notifications_disabled' })
    }

    // Log the notification (actual email sending to be implemented later)
    console.log('[webhook/new-response] NOTIFICATION QUEUED:', {
      instructor_id: instructor.id,
      instructor_email: instructor.email,
      instructor_name: instructor.name,
      lead_name: lead.name,
      lead_email: lead.email,
      response_id: record.id,
      total_score: record.total_score,
      profile: record.profile,
      created_at: record.created_at,
    })

    return NextResponse.json({ ok: true, notified: true })
  } catch (error) {
    console.error('[webhook/new-response] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

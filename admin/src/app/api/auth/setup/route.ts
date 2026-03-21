import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-time admin setup endpoint
// POST /api/auth/setup
// Body: { email, password, setupKey }
// setupKey must match ADMIN_SETUP_KEY env var for security

export async function POST(request: NextRequest) {
  try {
    const { email, password, setupKey } = await request.json()

    // Require a setup key to prevent unauthorized use
    const expectedKey = process.env.ADMIN_SETUP_KEY
    if (!expectedKey) {
      return NextResponse.json(
        { error: 'ADMIN_SETUP_KEY not configured in environment variables.' },
        { status: 500 }
      )
    }

    if (setupKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid setup key.' },
        { status: 403 }
      )
    }

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Email and password (min 6 chars) are required.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingAuthUser) {
      // Update password for existing auth user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        { password, email_confirm: true }
      )
      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update auth user: ${updateError.message}` },
          { status: 500 }
        )
      }
      userId = existingAuthUser.id
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError || !newUser.user) {
        return NextResponse.json(
          { error: `Failed to create auth user: ${createError?.message}` },
          { status: 500 }
        )
      }
      userId = newUser.user.id
    }

    // Upsert user in users table as admin
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        name: 'Admin',
        role: 'admin',
        is_active: true,
        slug: 'admin',
        permissions: {
          view_dashboard: true,
          view_responses: true,
          view_contacts: true,
          export_data: true,
          manage_settings: true,
        },
      }, { onConflict: 'id' })

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to upsert user profile: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: existingAuthUser
        ? 'Admin password updated and profile ensured.'
        : 'Admin user created successfully.',
      userId,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

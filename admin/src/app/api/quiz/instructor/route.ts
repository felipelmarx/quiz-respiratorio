import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (entry.count >= 30) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug || slug.length > 100) {
    return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('name, profissao, cidade, nome_clinica')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('role', 'instructor')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    name: data.name,
    profissao: data.profissao || null,
    cidade: data.cidade || null,
    nome_clinica: data.nome_clinica || null,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    }
  })
}

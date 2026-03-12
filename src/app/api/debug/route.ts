import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // pas Edge

export async function GET() {
  const checks: Record<string, string | boolean> = {}

  // 1. Env vars
  checks.url = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.anonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  checks.serviceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // 2. Test Supabase
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    checks.supabaseAuth = error ? `error: ${error.message}` : 'ok'
    checks.user = user ? (user.email ?? 'non connecté') : 'non connecté'
  } catch (e) {
    checks.supabaseError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks, { status: 200 })
}

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1)
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ ok: true, db: 'connected' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

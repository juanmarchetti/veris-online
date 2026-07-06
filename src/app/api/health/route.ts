import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// TODO: eliminar antes de producción
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test the database connection using auth.getSession()
    const { error } = await supabase.auth.getSession()

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error: unknown) {
    console.error('Health check exception:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

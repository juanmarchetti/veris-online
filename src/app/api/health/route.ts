import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// TODO: eliminar antes de producción
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test the database connection using a simple query
    const { error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}

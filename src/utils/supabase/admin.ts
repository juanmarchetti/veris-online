import { createClient } from '@supabase/supabase-js'
import { type Role } from '@/utils/auth'

// IMPORTANT: SUPABASE_SECRET_KEY must never be exposed to the client
// or used with a NEXT_PUBLIC_ prefix. This admin client should exclusively
// be used in server-side code (route handlers, server actions) for bypassing RLS.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  )
}

export async function actualizarRolUsuario(userId: string, nuevoRol: Role) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('perfiles')
    .update({ rol: nuevoRol })
    .eq('id', userId)
    .select()
    .single()
    
  return { data, error }
}

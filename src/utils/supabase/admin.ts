import { createClient } from '@supabase/supabase-js'

// IMPORTANT: SUPABASE_SECRET_KEY must never be exposed to the client
// or used with a NEXT_PUBLIC_ prefix. This admin client should exclusively
// be used in server-side code (route handlers, server actions) for bypassing RLS.
export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

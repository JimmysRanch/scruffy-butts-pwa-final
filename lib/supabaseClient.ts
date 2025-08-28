import { createClient } from '@supabase/supabase-js'

// We prefer the service role key for server‑side calls to allow inserts/updates.
// If it is not defined at runtime (e.g. on the client), fall back to the
// anon public key which only allows limited operations defined by RLS.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, // Use Service Key for backend admin access
  { auth: { autoRefreshToken: false, persistSession: false } }
)

module.exports = { supabase }
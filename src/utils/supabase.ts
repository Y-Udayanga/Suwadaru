import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Missing configuration must not crash public/demo routes.
export const supabase = url && key ? createClient(url, key, {
  auth: {
    flowType: 'pkce', persistSession: true, autoRefreshToken: true,
    // Dedicated callback routes exchange the code exactly once.
    detectSessionInUrl: false, debug: false,
  },
}) : null

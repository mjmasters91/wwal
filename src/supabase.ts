import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export function keyIsUnsafe(value: string) {
  if (value.startsWith('sb_secret_')) return true
  const part = value.split('.')[1]
  if (!part) return false
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(padded)) as { role?: string }
    return json.role === 'service_role'
  } catch {
    return false
  }
}

export const configError = key && keyIsUnsafe(key)
  ? 'This build was given a service role key. Remove it from the environment. The site will not start with that key in the browser.'
  : null

export const demoMode = !url || !key || Boolean(configError)

export const supabase: SupabaseClient | null = demoMode || configError ? null : createClient(url, key)

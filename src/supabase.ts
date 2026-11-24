import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Public project defaults. A repo Actions variable overrides either one at build time. */
export const DEFAULT_SUPABASE_URL = 'https://ifgokhaadkhjtdtbqzjg.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_aINiI6doPhfTvCHAq2B2Sw_G8NNBm0H'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY

export function keyIsUnsafe(value: string) {
  if (value.startsWith('sb_publishable_')) return false
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

function demoRequested() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === '1'
}

export const configError = keyIsUnsafe(key)
  ? 'This build was given a service role key. Remove it from the environment. The site will not start with that key in the browser.'
  : null

export const demoMode = demoRequested() || Boolean(configError)

export const authRedirectUrl =
  typeof window === 'undefined'
    ? 'https://mjmasters91.github.io/wwal/'
    : new URL(import.meta.env.BASE_URL, window.location.origin).href

export const supabase: SupabaseClient | null = demoMode || configError ? null : createClient(url, key)

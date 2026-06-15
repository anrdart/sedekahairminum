// Service-role client. Bypasses RLS — use ONLY inside src/pages/api/** after an
// explicit role check, and read the key from the Cloudflare runtime env. NEVER
// import this from a .tsx island, a build-time page, or anything reaching the
// browser. (A CI guard greps for misuse — see scripts/check-service-role.sh.)

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { resolveEnv } from './env';

export function createSupabaseAdmin(runtimeEnv?: Partial<Record<string, string>>) {
  const env = resolveEnv(runtimeEnv);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only secret)');
  }
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

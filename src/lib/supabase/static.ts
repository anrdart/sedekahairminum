// Build-time anon client for prerendered marketing pages. No cookies, no
// session — just reads public (RLS-allowed) rows at build time. Kept separate
// from server.ts so build code never imports request/cookie machinery.
//
// When env is not configured (fresh clone, no .env), supabaseStatic is null and
// query functions in queries/marketing.ts return empty arrays. This lets
// `bun run build` succeed before Supabase is set up.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { publicEnv } from './env';

const { url, anonKey } = publicEnv();

export const supabaseStatic: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

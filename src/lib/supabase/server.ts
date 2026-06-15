// Per-request, cookie-bound Supabase client for middleware, SSR pages, and API
// routes. Uses the anon key — RLS scopes it to the signed-in user's JWT (read
// from cookies). Create a fresh one per request; never share across requests.
//
// Astro's AstroCookies has no getAll(), so reads come from parsing the request
// Cookie header and writes go through cookies.set() (which Astro turns into
// Set-Cookie response headers). Writing refreshed tokens is what keeps sessions
// alive across requests.

import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './types';
import { publicEnv } from './env';

export function createSupabaseServer(
  cookies: AstroCookies,
  runtimeEnv: Partial<Record<string, string>> | undefined,
  cookieHeader: string | null,
) {
  const { url, anonKey } = publicEnv(runtimeEnv);

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader ?? '').map(({ name, value }) => ({
          name,
          value: value ?? '',
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, { ...options, path: '/' } as CookieOptionsWithName);
        }
      },
    },
  });
}

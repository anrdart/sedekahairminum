// Browser client for React admin islands. Reads PUBLIC_ vars inlined at build
// time. Shares the same cookie storage as the server client (default
// @supabase/ssr cookie name) so a login performed here is visible to middleware.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowser() {
  // Singleton per tab — avoids multiple GoTrue instances warning.
  if (client) return client;
  client = createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
  return client;
}

// Centralized env access. On Cloudflare, secrets/vars live on the Worker runtime
// (Astro.locals.runtime.env) and are NOT in import.meta.env at request time. The
// two PUBLIC_ values are inlined at build time. Pass the runtime env in from
// middleware/API routes; fall back to import.meta.env for `astro dev` / build.

export interface AppEnv {
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CF_DEPLOY_HOOK_URL: string;
  CRON_SECRET: string;
}

type MaybeEnv = Partial<Record<keyof AppEnv, string>> | undefined;

/** Merge the Cloudflare runtime env over import.meta.env (build/dev fallback). */
export function resolveEnv(runtimeEnv?: MaybeEnv): AppEnv {
  const meta = import.meta.env as unknown as Record<string, string | undefined>;
  const get = (k: keyof AppEnv): string =>
    (runtimeEnv?.[k] ?? meta[k] ?? '') as string;
  return {
    PUBLIC_SUPABASE_URL: get('PUBLIC_SUPABASE_URL'),
    PUBLIC_SUPABASE_ANON_KEY: get('PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_URL: get('SUPABASE_URL') || get('PUBLIC_SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: get('SUPABASE_SERVICE_ROLE_KEY'),
    CF_DEPLOY_HOOK_URL: get('CF_DEPLOY_HOOK_URL'),
    CRON_SECRET: get('CRON_SECRET'),
  };
}

/** Public (anon) config — safe for build-time and browser use. */
export function publicEnv(runtimeEnv?: MaybeEnv): { url: string; anonKey: string } {
  const e = resolveEnv(runtimeEnv);
  return { url: e.PUBLIC_SUPABASE_URL, anonKey: e.PUBLIC_SUPABASE_ANON_KEY };
}

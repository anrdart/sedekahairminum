export const prerender = false;
import type { APIRoute } from 'astro';
import { ok } from '@/lib/api';
import { recordActivity } from '@/lib/activity';

// Optional server-side signout (the browser client also clears cookies). Records
// the logout in the activity log before clearing the session.
export const POST: APIRoute = async ({ locals }) => {
  if (locals.user) {
    await recordActivity(locals.supabase, { action: 'logout', summary: 'admin logout' });
  }
  await locals.supabase.auth.signOut();
  return ok();
};

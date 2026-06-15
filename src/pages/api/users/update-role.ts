export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, badRequest, forbidden, serverError } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { recordActivity } from '@/lib/activity';

const schema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'editor']),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || (locals.role !== 'owner' && locals.role !== 'admin')) return forbidden();

  let payload: z.infer<typeof schema>;
  try { payload = schema.parse(await request.json()); }
  catch (e) { return badRequest(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Invalid' : 'Invalid body'); }

  // Prevent demoting the owner.
  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;
  const admin = createSupabaseAdmin(runtimeEnv);
  const { data: target } = await admin.from('profiles').select('role').eq('id', payload.user_id).single();
  if ((target as any)?.role === 'owner') return forbidden('Tidak bisa mengubah role owner');

  const { error } = await admin.from('profiles').update({ role: payload.role } as never).eq('id', payload.user_id);
  if (error) return serverError(error.message);

  await recordActivity(locals.supabase, {
    action: 'update',
    entityType: 'profiles',
    entityId: payload.user_id,
    summary: `mengubah role ke ${payload.role}`,
  });

  return ok();
};

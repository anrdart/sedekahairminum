export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, badRequest, forbidden, serverError } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { recordActivity } from '@/lib/activity';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional().default(''),
  role: z.enum(['admin', 'editor']).default('editor'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || (locals.role !== 'owner' && locals.role !== 'admin')) return forbidden();

  let payload: z.infer<typeof schema>;
  try { payload = schema.parse(await request.json()); }
  catch (e) { return badRequest(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Invalid' : 'Invalid body'); }

  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;
  const admin = createSupabaseAdmin(runtimeEnv);

  // Create auth user via admin API (bypasses email confirmation).
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { full_name: payload.full_name },
  });
  if (authError) return serverError(authError.message);
  const userId = authData.user.id;

  // The handle_new_user trigger auto-creates a profile. Update role + name.
  await admin.from('profiles').update({
    role: payload.role,
    full_name: payload.full_name,
  } as never).eq('id', userId);

  await recordActivity(locals.supabase, {
    action: 'create',
    entityType: 'profiles',
    entityId: userId,
    summary: `menambah user ${payload.email} (${payload.role})`,
  });

  return ok({
    user: {
      id: userId,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      created_at: authData.user.created_at,
    },
  });
};

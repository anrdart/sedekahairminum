export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, badRequest, serverError, clientIp } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(1, 'Nomor WhatsApp wajib diisi'),
  email: z.string().optional().default(''),
  topik: z.string().optional().default(''),
  pesan: z.string().min(1, 'Pesan wajib diisi'),
  website: z.string().optional().default(''), // honeypot
});

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch (e) {
    return badRequest(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Data tidak valid' : 'Body tidak valid');
  }

  // Honeypot: if the hidden `website` field is filled, reject silently (return 200).
  if (payload.website) return ok();

  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;
  const admin = createSupabaseAdmin(runtimeEnv);

  const ip = clientIp(request);
  const ua = request.headers.get('user-agent') ?? null;

  const { error } = await admin.from('contact_submissions').insert({
    nama: payload.nama,
    phone: payload.phone,
    email: payload.email || null,
    topik: payload.topik || null,
    pesan: payload.pesan,
    honeypot: payload.website || null,
    ip,
    user_agent: ua,
  } as never);

  if (error) return serverError(error.message);
  return ok();
};

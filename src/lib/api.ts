// Small helpers for JSON API routes.

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export const ok = (data: unknown = { ok: true }) => json({ ok: true, ...(data as object) });
export const badRequest = (message: string) => json({ ok: false, error: message }, 400);
export const unauthorized = (message = 'Unauthorized') => json({ ok: false, error: message }, 401);
export const forbidden = (message = 'Forbidden') => json({ ok: false, error: message }, 403);
export const serverError = (message = 'Internal error') => json({ ok: false, error: message }, 500);

/** Best-effort client IP from Cloudflare / standard proxy headers. */
export function clientIp(request: Request): string | null {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

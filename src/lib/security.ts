// Security helpers: timing-safe comparison and simple in-memory rate limiter.
// Used by the login API and any endpoint that compares secrets / needs abuse
// protection. The rate limiter is per-process (Cloudflare Workers isolated
// instances share no memory, so this is a soft limit; combine with a hard
// edge rate-limit rule for production).

// ── Timing-safe compare ───────────────────────────────────────────────────────

/** Constant-time string compare. Returns true iff a === b (length-aware). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  // Manual byte compare — avoids depending on Node's crypto in edge runtime.
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Rate limiter ─────────────────────────────────────────────────────────────

interface Bucket {
  hits: number;
  resetAt: number; // ms epoch
}

const store = new Map<string, Bucket>();

/** Sliding-window rate limit. Returns true if request is allowed. */
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { hits: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetIn: windowMs };
  }
  if (bucket.hits >= max) {
    return { ok: false, remaining: 0, resetIn: bucket.resetAt - now };
  }
  bucket.hits++;
  return { ok: true, remaining: max - bucket.hits, resetIn: bucket.resetAt - now };
}

/** Test-only: clear all buckets. */
export function _clearRateLimit() { store.clear(); }

// ── Client IP ────────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ── Password strength ────────────────────────────────────────────────────────

export function passwordStrengthError(pw: string): string | null {
  if (pw.length < 8) return 'Password minimal 8 karakter';
  if (!/[A-Z]/.test(pw)) return 'Password harus mengandung minimal 1 huruf besar';
  if (!/[0-9]/.test(pw)) return 'Password harus mengandung minimal 1 angka';
  return null;
}

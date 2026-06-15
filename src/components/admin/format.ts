// Shared formatting helpers for the admin UI (Indonesian locale).
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';

export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: id });
  } catch {
    return '—';
  }
}

export function absoluteTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: id });
  } catch {
    return '—';
  }
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}

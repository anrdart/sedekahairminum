// Typed wrapper around the record_activity() RPC. Centralizes the call shape so
// API routes don't repeat it. supabase-js's RPC generic is strict about
// optional-arg functions, so the single unavoidable cast lives here only.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ActivityAction } from '@/lib/supabase/types';

interface RecordArgs {
  action: ActivityAction;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}

type AnyRpc = (fn: 'record_activity', args: Record<string, unknown>) => Promise<{ error: unknown }>;

export async function recordActivity(
  supabase: SupabaseClient<Database>,
  args: RecordArgs,
): Promise<void> {
  const rpc = supabase.rpc.bind(supabase) as unknown as AnyRpc;
  await rpc('record_activity', {
    p_action: args.action,
    p_entity_type: args.entityType ?? null,
    p_entity_id: args.entityId ?? null,
    p_summary: args.summary ?? null,
    p_metadata: args.metadata ?? {},
  });
}

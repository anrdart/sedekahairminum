import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from './icon';
import { relativeTime } from './format';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import type { ActivityEntry } from '@/lib/supabase/types';

const actionIcon: Record<string, string> = {
  create: 'plus', update: 'pencil', delete: 'trash-2', login: 'log-in',
  logout: 'log-out', publish: 'send', unpublish: 'eye-off',
  site_rebuild: 'rocket', heartbeat: 'heart-pulse',
};

const actionLabel: Record<string, string> = {
  create: 'membuat', update: 'memperbarui', delete: 'menghapus', login: 'masuk',
  logout: 'keluar', publish: 'menerbitkan', unpublish: 'menyembunyikan',
  site_rebuild: 'membangun ulang situs', heartbeat: 'keep-alive',
};

function describe(e: ActivityEntry): string {
  if (e.summary) return e.summary;
  const verb = actionLabel[e.action] ?? e.action;
  return e.entity_type ? `${verb} ${e.entity_type}` : verb;
}

export default function ActivityFeed({
  initial,
  pollMs = 45_000,
}: {
  initial: ActivityEntry[];
  pollMs?: number;
}) {
  const [items, setItems] = React.useState<ActivityEntry[]>(initial);

  React.useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowser();
    const tick = async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      if (active && data) setItems(data as ActivityEntry[]);
    };
    const handle = setInterval(tick, pollMs);
    return () => {
      active = false;
      clearInterval(handle);
    };
  }, [pollMs]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle>
        <a href="/admin/activity" className="text-xs text-muted-foreground hover:text-foreground">
          Lihat semua
        </a>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-3">
          <ul className="space-y-3">
            {items.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas.</li>
            )}
            {items.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon name={actionIcon[e.action] ?? 'dot'} className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{describe(e)}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(e.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

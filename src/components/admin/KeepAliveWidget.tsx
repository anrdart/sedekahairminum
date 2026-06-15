import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Icon } from './icon';
import { relativeTime, absoluteTime, daysSince } from './format';

// Supabase free-tier pauses a project after ~7 days with no activity. Any write
// resets that clock; the daily heartbeat (plus organic dashboard writes) keeps
// it warm. This widget surfaces how close the project is to pausing.
const PAUSE_DAYS = 7;

type Status = { label: string; tone: 'alive' | 'idle' | 'danger'; daysLeft: number };

function deriveStatus(lastHeartbeat: string | null): Status {
  const since = daysSince(lastHeartbeat);
  if (since === null) return { label: 'Belum ada ping', tone: 'idle', daysLeft: PAUSE_DAYS };
  const daysLeft = Math.max(0, PAUSE_DAYS - since);
  if (since <= 1) return { label: 'Aktif', tone: 'alive', daysLeft };
  if (since < PAUSE_DAYS) return { label: 'Idle', tone: 'idle', daysLeft };
  return { label: 'Berisiko pause', tone: 'danger', daysLeft: 0 };
}

const toneClass: Record<Status['tone'], string> = {
  alive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function KeepAliveWidget({ lastHeartbeat: initial }: { lastHeartbeat: string | null }) {
  const [lastHeartbeat, setLastHeartbeat] = React.useState(initial);
  const [pinging, setPinging] = React.useState(false);
  const status = deriveStatus(lastHeartbeat);

  async function pingNow() {
    setPinging(true);
    try {
      const res = await fetch('/api/heartbeat', { method: 'POST', headers: { 'x-source': 'dashboard' } });
      const body = (await res.json()) as { ok: boolean; at?: string; error?: string };
      if (body.ok && body.at) {
        setLastHeartbeat(body.at);
        toast.success('Database di-ping — timer pause direset');
      } else {
        toast.error(body.error || 'Gagal ping');
      }
    } catch {
      toast.error('Gagal ping');
    } finally {
      setPinging(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status Database</CardTitle>
        <Badge variant="outline" className={toneClass[status.tone]}>
          <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {status.daysLeft}
              <span className="ml-1 text-sm font-normal text-muted-foreground">hari menuju pause</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ping terakhir {relativeTime(lastHeartbeat)}
              <span className="block">{absoluteTime(lastHeartbeat)}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={pingNow} disabled={pinging}>
            <Icon name={pinging ? 'loader-circle' : 'heart-pulse'} className={pinging ? 'animate-spin' : ''} />
            Ping sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

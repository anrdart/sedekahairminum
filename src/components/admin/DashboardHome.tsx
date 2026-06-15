import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from './icon';
import KeepAliveWidget from './KeepAliveWidget';
import ActivityFeed from './ActivityFeed';
import type { ActivityEntry } from '@/lib/supabase/types';

interface Props {
  recent: ActivityEntry[];
  lastHeartbeat: string | null;
  counts: Record<string, number>;
}

const STAT_CARDS: { key: string; label: string; icon: string; href: string }[] = [
  { key: 'articles', label: 'Artikel', icon: 'newspaper', href: '/admin/articles' },
  { key: 'penerima', label: 'Penerima', icon: 'building-2', href: '/admin/content/penerima' },
  { key: 'testimonials', label: 'Testimoni', icon: 'quote', href: '/admin/content/testimonials' },
  { key: 'contact_submissions', label: 'Pesan Masuk', icon: 'inbox', href: '/admin/submissions' },
];

export default function DashboardHome({ recent, lastHeartbeat, counts }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan konten dan status sistem.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((c) => (
          <a key={c.key} href={c.href} className="block">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon name={c.icon} className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{counts[c.key] ?? 0}</div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <KeepAliveWidget lastHeartbeat={lastHeartbeat} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed initial={recent} />
        </div>
      </div>
    </div>
  );
}

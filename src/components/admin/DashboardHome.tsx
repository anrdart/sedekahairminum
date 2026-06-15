import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from './icon';
import KeepAliveWidget from './KeepAliveWidget';
import ActivityFeed from './ActivityFeed';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
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
  const [showUpdate, setShowUpdate] = React.useState(false);
  const latestIdRef = React.useRef<string | null>(recent[0]?.id ?? null);

  React.useEffect(() => {
    const supabase = createSupabaseBrowser();
    let active = true;
    const check = async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      if (!active) return;
      const newest = (data as any)?.[0]?.id;
      if (newest && latestIdRef.current && newest !== latestIdRef.current) {
        setShowUpdate(true);
      }
    };
    const handle = setInterval(check, 30_000);
    return () => { active = false; clearInterval(handle); };
  }, []);

  function handleRefresh() {
    setShowUpdate(false);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={showUpdate} onOpenChange={setShowUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ada Update pada Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Data dashboard sudah berubah. Muat ulang untuk melihat perubahan terbaru?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nanti</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefresh}>Ya, refresh</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

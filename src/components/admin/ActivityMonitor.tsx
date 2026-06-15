import * as React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Icon } from './icon';
import { absoluteTime } from './format';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import type { ActivityEntry, ActivityAction } from '@/lib/supabase/types';

const ACTIONS: { value: ActivityAction | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'create', label: 'Buat' },
  { value: 'update', label: 'Perbarui' },
  { value: 'delete', label: 'Hapus' },
  { value: 'login', label: 'Masuk' },
  { value: 'logout', label: 'Keluar' },
  { value: 'publish', label: 'Terbitkan' },
  { value: 'site_rebuild', label: 'Rebuild' },
  { value: 'heartbeat', label: 'Keep-alive' },
];

const PER_PAGE = 25;

export default function ActivityMonitor({ initial }: { initial: ActivityEntry[] }) {
  const [rows, setRows] = React.useState(initial);
  const [filter, setFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(initial.length >= PER_PAGE);
  const [loading, setLoading] = React.useState(false);

  async function load(nextPage: number, action: string) {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(nextPage * PER_PAGE, (nextPage + 1) * PER_PAGE - 1);
    if (action !== 'all') query = query.eq('action', action);
    const { data } = await query;
    const items = (data ?? []) as ActivityEntry[];
    setRows(items);
    setHasMore(items.length >= PER_PAGE);
    setPage(nextPage);
    setLoading(false);
  }

  function changeFilter(v: string) {
    setFilter(v);
    load(0, v);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground">Audit seluruh aksi di dashboard.</p>
      </div>

      <div className="flex gap-3">
        <Select value={filter} onValueChange={(v: string | null) => changeFilter(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Aksi</TableHead>
              <TableHead>Ringkasan</TableHead>
              <TableHead className="w-28">Entitas</TableHead>
              <TableHead className="w-44">Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline" className="capitalize">{r.action}</Badge></TableCell>
                <TableCell className="text-sm">{r.summary ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.entity_type ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{absoluteTime(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Halaman {page + 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => load(page - 1, filter)}>
            <Icon name="chevron-left" /> Sebelumnya
          </Button>
          <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={() => load(page + 1, filter)}>
            Selanjutnya <Icon name="chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}

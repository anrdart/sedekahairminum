import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from '../icon';
import { RESOURCES } from '../resources.config';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { recordActivity } from '@/lib/activity';

interface Props {
  resourceSlug: string;
  initial: Record<string, unknown>[];
}

export default function ResourceList({ resourceSlug, initial }: Props) {
  const def = RESOURCES[resourceSlug];
  if (!def) return <p>Resource tidak ditemukan.</p>;

  const [rows, setRows] = React.useState(initial);
  const [query, setQuery] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const listFields = def.fields.filter((f) => f.listVisible);
  const searchable = def.searchColumns ?? listFields.filter((f) => f.type === 'text').map((f) => f.name);

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return searchable.some((col) => String(r[col] ?? '').toLowerCase().includes(q));
  });

  async function confirmDelete() {
    if (!deleteId) return;
    const supabase = createSupabaseBrowser();
    const { error } = await (supabase as any).from(def.table).delete().eq('id', deleteId);
    if (error) { toast.error('Gagal menghapus'); setDeleteId(null); return; }
    await recordActivity(supabase, { action: 'delete', entityType: def.table, entityId: deleteId, summary: `menghapus ${def.label}` });
    setRows((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
    toast.success('Dihapus');
  }

  function cellValue(row: Record<string, unknown>, name: string, type: string): React.ReactNode {
    const v = row[name];
    if (type === 'boolean') return <Badge variant="outline">{v ? 'Ya' : 'Tidak'}</Badge>;
    if (type === 'image' && typeof v === 'string' && v) return <img src={v} alt="" className="h-8 w-auto rounded" />;
    return String(v ?? '—');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{def.labelPlural}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} item</p>
        </div>
        <Button render={<a href={`/admin/content/${resourceSlug}/new`} />}>
          <Icon name="plus" /> Tambah {def.label}
        </Button>
      </div>

      {searchable.length > 0 && (
        <div className="relative max-w-sm">
          <Icon name="search" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari…" className="pl-8" />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {listFields.map((f) => <TableHead key={f.name}>{f.label}</TableHead>)}
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={listFields.length + 1} className="py-10 text-center text-muted-foreground">
                {rows.length === 0 ? `Belum ada ${def.label.toLowerCase()}.` : 'Tidak ada hasil.'}
              </TableCell></TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={String(r.id)}>
                {listFields.map((f) => <TableCell key={f.name}>{cellValue(r, f.name, f.type)}</TableCell>)}
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" render={<a href={`/admin/content/${resourceSlug}/${r.id}`} />} aria-label="Edit">
                      <Icon name="pencil" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(String(r.id))} aria-label="Hapus">
                      <Icon name="trash-2" className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {def.label.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>Item akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" richColors />
    </div>
  );
}

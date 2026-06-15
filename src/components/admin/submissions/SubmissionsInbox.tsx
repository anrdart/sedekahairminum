import * as React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from '../icon';
import { absoluteTime } from '../format';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import type { ContactSubmission } from '@/lib/supabase/types';

const statusMap: Record<string, { label: string; tone: string }> = {
  new: { label: 'Baru', tone: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  read: { label: 'Dibaca', tone: 'bg-muted text-muted-foreground' },
  replied: { label: 'Dibalas', tone: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  spam: { label: 'Spam', tone: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function SubmissionsInbox({ initial }: { initial: ContactSubmission[] }) {
  const [rows, setRows] = React.useState(initial);
  const [selected, setSelected] = React.useState<ContactSubmission | null>(null);
  const supabase = createSupabaseBrowser();

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('contact_submissions').update({ status } as never).eq('id', id);
    if (error) { toast.error('Gagal'); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as ContactSubmission['status'] } : r)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: status as ContactSubmission['status'] } : null);
    toast.success('Status diperbarui');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pesan Masuk</h1>
        <p className="text-sm text-muted-foreground">{rows.length} pesan</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Topik</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-44">Waktu</TableHead>
              <TableHead className="w-16">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada pesan.</TableCell></TableRow>
            )}
            {rows.map((r) => {
              const s = statusMap[r.status] ?? statusMap.new;
              return (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                  <TableCell className="font-medium">{r.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.topik ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={s.tone}>{s.label}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{absoluteTime(r.created_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setSelected(r); }} aria-label="Lihat">
                      <Icon name="eye" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.nama}</DialogTitle></DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">WhatsApp</dt><dd>{selected.phone}</dd>
                <dt className="text-muted-foreground">Email</dt><dd>{selected.email ?? '—'}</dd>
                <dt className="text-muted-foreground">Topik</dt><dd>{selected.topik ?? '—'}</dd>
                <dt className="text-muted-foreground">Waktu</dt><dd>{absoluteTime(selected.created_at)}</dd>
              </dl>
              <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{selected.pesan}</div>
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">Status:</Label>
                <Select value={selected.status} onValueChange={(v: string | null) => { if (v) updateStatus(selected.id, v); }}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto"
                >
                  <Button variant="outline" size="sm"><Icon name="message-circle" /> Balas via WA</Button>
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
    </div>
  );
}

function Label({ className, children, ...props }: React.ComponentProps<'span'>) {
  return <span className={className} {...props}>{children}</span>;
}

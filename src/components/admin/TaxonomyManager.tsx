import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from './icon';
import { toSlug } from '@/lib/slug';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

interface Term { id: string; name: string; slug: string }

export default function TaxonomyManager({
  table,
  title,
  initial,
}: {
  table: 'categories' | 'tags';
  title: string;
  initial: Term[];
}) {
  const [terms, setTerms] = React.useState<Term[]>(initial);
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const supabase = createSupabaseBrowser();

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const slug = toSlug(trimmed);
    const { data, error } = await (supabase
      .from(table) as any)
      .insert({ name: trimmed, slug })
      .select('id,name,slug')
      .single() as { data: Term | null; error: any };
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Slug sudah ada' : 'Gagal menambah');
    } else if (data) {
      setTerms((p) => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      toast.success('Ditambahkan');
    }
    setBusy(false);
  }

  async function remove(id: string) {
    const { error } = await (supabase.from(table) as any).delete().eq('id', id);
    if (error) toast.error('Gagal menghapus');
    else {
      setTerms((p) => p.filter((t) => t.id !== id));
      toast.success('Dihapus');
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Kelola {title.toLowerCase()} untuk artikel.</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`Nama ${title.toLowerCase()} baru…`}
        />
        <Button onClick={add} disabled={busy}>
          <Icon name="plus" /> Tambah
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-16 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.length === 0 && (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Belum ada.</TableCell></TableRow>
            )}
            {terms.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(t.id)} aria-label="Hapus">
                    <Icon name="trash-2" className="text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

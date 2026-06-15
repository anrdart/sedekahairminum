import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from '../icon';
import { absoluteTime } from '../format';
import { uploadMedia } from '@/lib/upload';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import type { MediaItem } from '@/lib/supabase/types';

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function publicUrl(item: MediaItem): string {
  const supabase = createSupabaseBrowser();
  return supabase.storage.from(item.bucket).getPublicUrl(item.path).data.publicUrl;
}

export default function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = React.useState<MediaItem[]>(initial);
  const [selected, setSelected] = React.useState<MediaItem | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const filtered = items.filter((i) =>
    i.filename.toLowerCase().includes(query.toLowerCase()) ||
    (i.alt ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const id = toast.loading(`Mengunggah ${files.length} file…`);
    let added = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadMedia(file, 'media');
        added++;
      } catch (e) {
        toast.error(`Gagal: ${file.name} — ${e instanceof Error ? e.message : 'error'}`, { id: undefined });
      }
    }
    // Refresh from DB
    const supabase = createSupabaseBrowser();
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as MediaItem[]);
    toast.success(`${added} file diunggah`, { id });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete() {
    if (!deleteId) return;
    const item = items.find((i) => i.id === deleteId);
    if (!item) return;
    const supabase = createSupabaseBrowser();
    await supabase.storage.from(item.bucket).remove([item.path]);
    await supabase.from('media').delete().eq('id', item.id);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
    setSelected(null);
    toast.success('File dihapus');
  }

  async function copyUrl(item: MediaItem) {
    const url = publicUrl(item);
    await navigator.clipboard.writeText(url);
    toast.success('URL disalin');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-sm text-muted-foreground">{items.length} file</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Icon name={uploading ? 'loader-circle' : 'upload'} className={uploading ? 'animate-spin' : ''} />
          Unggah
        </Button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      <div className="relative max-w-sm">
        <Icon name="search" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari file…" className="pl-8" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {items.length === 0 ? 'Belum ada media. Unggah yang pertama!' : 'Tidak ada hasil.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <Card key={item.id} className="group cursor-pointer overflow-hidden" onClick={() => setSelected(item)}>
              <CardContent className="p-0">
                {item.mime?.startsWith('image/') ? (
                  <img src={publicUrl(item)} alt={item.alt ?? item.filename} className="aspect-square w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <Icon name="file" className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{item.filename}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{selected.filename}</DialogTitle>
              </DialogHeader>
              {selected.mime?.startsWith('image/') && (
                <img src={publicUrl(selected)} alt={selected.alt ?? selected.filename} className="max-h-64 w-full rounded-md object-contain" />
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Tipe</dt><dd>{selected.mime ?? '—'}</dd>
                <dt className="text-muted-foreground">Ukuran</dt><dd>{formatSize(selected.size)}</dd>
                {selected.width && <><dt className="text-muted-foreground">Dimensi</dt><dd>{selected.width}×{selected.height}</dd></>}
                <dt className="text-muted-foreground">Diunggah</dt><dd>{absoluteTime(selected.created_at)}</dd>
              </dl>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyUrl(selected)}>
                  <Icon name="copy" /> Salin URL
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setDeleteId(selected.id); setSelected(null); }}>
                  <Icon name="trash-2" /> Hapus
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus file?</AlertDialogTitle>
            <AlertDialogDescription>File akan dihapus permanen dari storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" richColors />
    </div>
  );
}

// Browser-side media upload. Uploads directly to Supabase Storage (anon client,
// RLS allows editors), then registers the file in the `media` table so the media
// library can index it. Direct-to-Storage avoids routing large files through the
// Worker (which has a request body size limit).

import { createSupabaseBrowser } from '@/lib/supabase/browser';

export interface UploadResult {
  path: string;
  publicUrl: string;
  bucket: string;
}

function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
  return `${base}${ext}`;
}

async function imageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith('image/')) return { width: null, height: null };
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return { width: null, height: null };
  }
}

export async function uploadMedia(file: File, bucket = 'media'): Promise<UploadResult> {
  const supabase = createSupabaseBrowser();
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${new Date().getFullYear()}/${stamp}-${slugifyFilename(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const { width, height } = await imageDimensions(file);

  // Index the upload (best-effort; ignore failure so the editor still gets the URL).
  await supabase.from('media').insert({
    bucket,
    path,
    filename: file.name,
    mime: file.type || null,
    size: file.size,
    width,
    height,
  } as never);

  return { path, publicUrl: pub.publicUrl, bucket };
}

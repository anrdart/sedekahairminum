import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icon } from '../icon';
import { uploadMedia } from '@/lib/upload';
import { toast } from 'sonner';
import type { FieldDef } from '../resources.config';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: Props) {
  const val = value ?? '';
  const strVal = String(val);

  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input value={strVal} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? field.label} />
        </div>
      );
    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Textarea value={strVal} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={field.placeholder ?? field.label} />
        </div>
      );
    case 'number':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input type="number" value={strVal} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch checked={Boolean(val)} onCheckedChange={(v) => onChange(v)} />
          <Label className="text-xs">{field.label}</Label>
        </div>
      );
    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select value={strVal} onValueChange={(v) => onChange(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case 'image':
      return <ImageField field={field} value={strVal} onChange={onChange} />;
    default:
      return null;
  }
}

function ImageField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: unknown) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { publicUrl } = await uploadMedia(file, field.bucket ?? 'media');
      onChange(publicUrl);
      toast.success('Gambar diunggah');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal');
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      {value ? (
        <div className="group relative inline-block">
          <img src={value} alt="" className="h-20 rounded-md border object-cover" />
          <button onClick={() => onChange('')} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white opacity-0 group-hover:opacity-100" aria-label="Hapus">
            <Icon name="x" className="size-3" />
          </button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={uploading}>
          <Icon name={uploading ? 'loader-circle' : 'upload'} className={uploading ? 'animate-spin' : ''} />
          Unggah
        </Button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

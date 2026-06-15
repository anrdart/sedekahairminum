import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Icon } from '../icon';
import { FieldRenderer } from './FieldRenderer';
import { RESOURCES } from '../resources.config';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { recordActivity } from '@/lib/activity';

interface Props {
  resourceSlug: string;
  initial: Record<string, unknown> | null;
}

export default function ResourceForm({ resourceSlug, initial }: Props) {
  const def = RESOURCES[resourceSlug];
  if (!def) return <p>Resource tidak ditemukan.</p>;

  const isEdit = Boolean(initial?.id);
  const [values, setValues] = React.useState<Record<string, unknown>>(() => {
    if (initial) return { ...initial };
    const defaults: Record<string, unknown> = {};
    for (const f of def.fields) {
      if (f.type === 'boolean') defaults[f.name] = true;
      else if (f.type === 'number') defaults[f.name] = 0;
      else defaults[f.name] = '';
    }
    return defaults;
  });
  const [saving, setSaving] = React.useState(false);

  function set(key: string, val: unknown) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    const parsed = def.schema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first ? `${first.path.join('.')}: ${first.message}` : 'Data tidak valid');
      return;
    }

    setSaving(true);
    const supabase = createSupabaseBrowser();
    const db = supabase as any;
    const row = parsed.data as Record<string, unknown>;
    row.sort_order = values.sort_order ?? 0;

    if (isEdit) {
      const { error } = await db.from(def.table).update(row).eq('id', initial!.id as string);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await recordActivity(supabase, { action: 'update', entityType: def.table, entityId: initial!.id as string, summary: `memperbarui ${def.label}` });
      toast.success('Diperbarui');
    } else {
      const { error } = await db.from(def.table).insert(row);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await recordActivity(supabase, { action: 'create', entityType: def.table, summary: `menambah ${def.label}` });
      toast.success('Ditambahkan');
    }
    setSaving(false);
    window.location.assign(`/admin/content/${resourceSlug}`);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <a href={`/admin/content/${resourceSlug}`} className="text-muted-foreground hover:text-foreground">
          <Icon name="arrow-left" className="size-5" />
        </a>
        <h1 className="text-xl font-semibold">{isEdit ? `Edit ${def.label}` : `Tambah ${def.label}`}</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {def.fields.map((f) => (
            <FieldRenderer key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" render={<a href={`/admin/content/${resourceSlug}`} />}>Batal</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Icon name="loader-circle" className="animate-spin" />}
              {isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toaster position="top-right" richColors />
    </div>
  );
}

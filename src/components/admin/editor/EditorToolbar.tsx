import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { Toggle } from './Toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '../icon';

interface Props {
  editor: Editor;
  onUploadImage: () => void;
  onUploadDoc: () => void;
}

// Text colors and highlight swatches drawn from the brand palette (safe hex —
// these survive sanitizeArticleHtml's color/background-color allowlist).
const TEXT_COLORS = [
  { label: 'Aqua', value: '#0e7c8c' },
  { label: 'Teal', value: '#134e5b' },
  { label: 'Emas', value: '#a07f3a' },
  { label: 'Merah', value: '#b91c1c' },
  { label: 'Hijau', value: '#15803d' },
  { label: 'Hitam', value: '#1a1814' },
];
const HIGHLIGHT_COLORS = [
  { label: 'Kuning', value: '#fef08a' },
  { label: 'Biru', value: '#bae6fd' },
  { label: 'Hijau', value: '#bbf7d0' },
  { label: 'Merah muda', value: '#fbcfe8' },
  { label: 'Jingga', value: '#fed7aa' },
];

const FONT_SIZES = [
  { label: 'Kecil', value: '0.875rem' },
  { label: 'Normal', value: '' },
  { label: 'Besar', value: '1.25rem' },
  { label: 'Sangat besar', value: '1.5rem' },
];
const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, "JetBrains Mono", monospace' },
];

// A deliberately rich toolbar ("tools berlimpah"): formatting, headings, lists,
// alignment, blocks, links, images, documents, tables, color, and history.
export function EditorToolbar({ editor, onUploadImage, onUploadDoc }: Props) {
  // Force re-render on selection/state changes so active states stay accurate.
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const handler = () => force();
    editor.on('selectionUpdate', handler);
    editor.on('transaction', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('transaction', handler);
    };
  }, [editor]);

  const chain = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
      {/* History */}
      <Button variant="ghost" size="icon-sm" onClick={() => chain().undo().run()} disabled={!editor.can().undo()} aria-label="Undo">
        <Icon name="undo-2" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().redo().run()} disabled={!editor.can().redo()} aria-label="Redo">
        <Icon name="redo-2" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Toggle active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} label="Judul 2">
        <Icon name="heading-2" />
      </Toggle>
      <Toggle active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()} label="Judul 3">
        <Icon name="heading-3" />
      </Toggle>
      <Toggle active={editor.isActive('paragraph')} onClick={() => chain().setParagraph().run()} label="Paragraf">
        <Icon name="pilcrow" />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Inline marks */}
      <Toggle active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} label="Tebal">
        <Icon name="bold" />
      </Toggle>
      <Toggle active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()} label="Miring">
        <Icon name="italic" />
      </Toggle>
      <Toggle active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()} label="Garis bawah">
        <Icon name="underline" />
      </Toggle>
      <Toggle active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()} label="Coret">
        <Icon name="strikethrough" />
      </Toggle>
      <Toggle active={editor.isActive('code')} onClick={() => chain().toggleCode().run()} label="Kode inline">
        <Icon name="code" />
      </Toggle>
      <Toggle active={editor.isActive('subscript')} onClick={() => chain().toggleSubscript().run()} label="Subskrip">
        <Icon name="subscript" />
      </Toggle>
      <Toggle active={editor.isActive('superscript')} onClick={() => chain().toggleSuperscript().run()} label="Superskrip">
        <Icon name="superscript" />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Color & highlight */}
      <SwatchButton
        icon="baseline"
        label="Warna teks"
        colors={TEXT_COLORS}
        active={editor.isActive('textStyle')}
        onPick={(c) => chain().setColor(c).run()}
        onClear={() => chain().unsetColor().run()}
      />
      <SwatchButton
        icon="highlighter"
        label="Sorot teks"
        colors={HIGHLIGHT_COLORS}
        active={editor.isActive('highlight')}
        onPick={(c) => chain().toggleHighlight({ color: c }).run()}
        onClear={() => chain().unsetHighlight().run()}
      />
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font size & family */}
      <Select
        value={editor.getAttributes('textStyle').fontSize ?? ''}
        onValueChange={(v: string | null) => {
          if (v) chain().setFontSize(v).run();
          else chain().unsetFontSize().run();
        }}
      >
        <SelectTrigger size="sm" className="h-7 w-[110px] text-xs" aria-label="Ukuran font">
          <SelectValue placeholder="Ukuran" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((f) => (
            <SelectItem key={f.label} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={editor.getAttributes('textStyle').fontFamily ?? ''}
        onValueChange={(v: string | null) => {
          if (v) chain().setFontFamily(v).run();
          else chain().unsetFontFamily().run();
        }}
      >
        <SelectTrigger size="sm" className="h-7 w-[100px] text-xs" aria-label="Jenis font">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.label} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists & blocks */}
      <Toggle active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} label="Daftar">
        <Icon name="list" />
      </Toggle>
      <Toggle active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} label="Daftar bernomor">
        <Icon name="list-ordered" />
      </Toggle>
      <Toggle active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()} label="Daftar centang">
        <Icon name="list-checks" />
      </Toggle>
      <Toggle active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()} label="Kutipan">
        <Icon name="quote" />
      </Toggle>
      <Toggle active={editor.isActive('codeBlock')} onClick={() => chain().toggleCodeBlock().run()} label="Blok kode">
        <Icon name="square-code" />
      </Toggle>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().setHorizontalRule().run()} aria-label="Garis pemisah">
        <Icon name="minus" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <Toggle active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()} label="Rata kiri">
        <Icon name="align-left" />
      </Toggle>
      <Toggle active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()} label="Rata tengah">
        <Icon name="align-center" />
      </Toggle>
      <Toggle active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()} label="Rata kanan">
        <Icon name="align-right" />
      </Toggle>
      <Toggle active={editor.isActive({ textAlign: 'justify' })} onClick={() => chain().setTextAlign('justify').run()} label="Rata kiri-kanan">
        <Icon name="align-justify" />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      <LinkButton editor={editor} />

      {/* Image */}
      <Button variant="ghost" size="icon-sm" onClick={onUploadImage} aria-label="Sisipkan gambar">
        <Icon name="image" />
      </Button>

      {/* Document attachment (PDF etc.) */}
      <Button variant="ghost" size="icon-sm" onClick={onUploadDoc} aria-label="Lampirkan dokumen">
        <Icon name="paperclip" />
      </Button>

      {/* Table */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        aria-label="Sisipkan tabel"
      >
        <Icon name="table" />
      </Button>
      {editor.isActive('table') && <TableControls editor={editor} />}

      {/* Clear formatting */}
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button variant="ghost" size="icon-sm" onClick={() => chain().unsetAllMarks().clearNodes().run()} aria-label="Hapus format">
        <Icon name="remove-formatting" />
      </Button>
    </div>
  );
}

// Color/highlight picker: a grid of brand swatches plus a "clear" action.
function SwatchButton({
  icon, label, colors, active, onPick, onClear,
}: {
  icon: string;
  label: string;
  colors: { label: string; value: string }[];
  active: boolean;
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ${active ? 'bg-muted text-foreground' : ''}`}
        aria-label={label}
        title={label}
      >
        <Icon name={icon} className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-2 p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => { onPick(c.value); setOpen(false); }}
              className="size-6 rounded-md border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { onClear(); setOpen(false); }}>
          <Icon name="ban" className="size-3.5" /> Hapus warna
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// Normalize a user-typed URL: add https:// to bare domains, leave mailto/anchors
// and already-schemed URLs alone.
function normalizeHref(input: string): string {
  const v = input.trim();
  if (!v) return '';
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
}

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [text, setText] = React.useState('');
  // Was there a non-empty text selection when the popover opened?
  const [hadSelection, setHadSelection] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setUrl(editor.getAttributes('link').href ?? '');
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    setHadSelection(selected.length > 0);
    setText(selected);
  }, [open, editor]);

  function apply() {
    const href = normalizeHref(url);
    if (!href) {
      // Empty URL → remove an existing link.
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setOpen(false);
      return;
    }
    if (hadSelection) {
      // Wrap the selected text.
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    } else {
      // No selection → insert the display text (fallback to the URL) as a link,
      // then drop the mark so typing afterwards isn't linked.
      const label = text.trim() || href;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: label,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .unsetMark('link')
        .run();
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`inline-flex size-7 items-center justify-center rounded-md hover:bg-muted ${editor.isActive('link') ? 'bg-muted text-foreground' : ''}`}
        aria-label="Tautan"
      >
        <Icon name="link" className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2" align="start">
        {!hadSelection && (
          <>
            <Label htmlFor="link-text" className="text-xs">Teks tautan</Label>
            <Input
              id="link-text"
              value={text}
              placeholder="Teks yang ditampilkan"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
            />
          </>
        )}
        <Label htmlFor="link-url" className="text-xs">URL Tautan</Label>
        <div className="flex gap-2">
          <Input
            id="link-url"
            value={url}
            autoFocus={hadSelection}
            placeholder="https://…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <Button size="sm" onClick={apply}>OK</Button>
        </div>
        {editor.isActive('link') && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setOpen(false); }}
          >
            <Icon name="unlink" className="size-3.5" /> Hapus tautan
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function TableControls({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();
  return (
    <>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button variant="ghost" size="icon-sm" onClick={() => chain().addColumnAfter().run()} aria-label="Tambah kolom">
        <Icon name="between-vertical-start" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().addRowAfter().run()} aria-label="Tambah baris">
        <Icon name="between-horizontal-start" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().deleteColumn().run()} aria-label="Hapus kolom">
        <Icon name="square-minus" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().deleteRow().run()} aria-label="Hapus baris">
        <Icon name="rows-3" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => chain().deleteTable().run()} aria-label="Hapus tabel">
        <Icon name="trash-2" />
      </Button>
    </>
  );
}

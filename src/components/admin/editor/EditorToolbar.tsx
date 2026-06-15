import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { Toggle } from './Toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '../icon';

interface Props {
  editor: Editor;
  onUploadImage: () => void;
}

// A deliberately rich toolbar ("tools berlimpah"): formatting, headings, lists,
// alignment, blocks, links, images, tables, and history.
export function EditorToolbar({ editor, onUploadImage }: Props) {
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
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists & blocks */}
      <Toggle active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} label="Daftar">
        <Icon name="list" />
      </Toggle>
      <Toggle active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} label="Daftar bernomor">
        <Icon name="list-ordered" />
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

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (open) setUrl(editor.getAttributes('link').href ?? '');
  }, [open, editor]);

  function apply() {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
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
        <Label htmlFor="link-url" className="text-xs">URL Tautan</Label>
        <div className="flex gap-2">
          <Input
            id="link-url"
            value={url}
            placeholder="https://…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <Button size="sm" onClick={apply}>OK</Button>
        </div>
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

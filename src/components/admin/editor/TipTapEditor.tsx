import * as React from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { buildExtensions } from './extensions';
import { EditorToolbar } from './EditorToolbar';
import { uploadMedia } from '@/lib/upload';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import './editor.css';

interface Props {
  initialContent?: JSONContent | null;
  onChange: (content: JSONContent, html: string, text: string) => void;
  placeholder?: string;
}

export interface EditorHandle {
  getHTML: () => string;
  getJSON: () => JSONContent;
  /** Insert HTML/text at the end of the document (used by the smart title paste). */
  appendContent: (content: string) => void;
  isEmpty: () => boolean;
}

function fileBaseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

const TipTapEditor = React.forwardRef<EditorHandle, Props>(function TipTapEditor(
  { initialContent, onChange, placeholder },
  ref,
) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  // Pending document upload awaiting a custom link label from the dialog.
  const [docDraft, setDocDraft] = React.useState<{ url: string; label: string } | null>(null);

  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: initialContent ?? '',
    immediatelyRender: false, // required for Astro islands / SSR
    editorProps: {
      attributes: { class: 'tiptap-content focus:outline-none' },
    },
    onCreate: ({ editor }) => {
      // Emit initial content so the parent ref is populated even if the user
      // never types (e.g. only edits cover image then saves).
      onChange(editor.getJSON(), editor.getHTML(), editor.getText());
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML(), editor.getText());
    },
  });

  React.useImperativeHandle(
    ref,
    () => ({
      getHTML: () => editor?.getHTML() ?? '',
      getJSON: () => editor?.getJSON() ?? { type: 'doc', content: [] },
      appendContent: (content: string) => {
        if (!editor) return;
        // Place caret at the very end, then insert so existing content is kept.
        editor.chain().focus('end').insertContent(content).run();
      },
      isEmpty: () => editor?.isEmpty ?? true,
    }),
    [editor],
  );

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !editor) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    const id = toast.loading('Mengunggah gambar…');
    try {
      const { publicUrl } = await uploadMedia(file, 'media');
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      toast.success('Gambar disisipkan', { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengunggah', { id });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Upload a document (PDF, Office, zip…) to the public media bucket, then open
  // a dialog so the editor can choose the link text shown in the article (the
  // raw URL stays hidden behind a readable title).
  async function handleDocFile(files: FileList | null) {
    if (!files || !files.length || !editor) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      toast.error('Gunakan tombol gambar untuk file gambar');
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }
    const id = toast.loading('Mengunggah dokumen…');
    try {
      const { publicUrl } = await uploadMedia(file, 'media');
      setDocDraft({ url: publicUrl, label: fileBaseName(file.name) });
      toast.success('Dokumen terunggah — beri teks tautan', { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengunggah', { id });
    } finally {
      if (docInputRef.current) docInputRef.current.value = '';
    }
  }

  function insertDocLink() {
    if (!editor || !docDraft) return;
    const label = docDraft.label.trim() || 'Unduh dokumen';
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: label,
        marks: [
          {
            type: 'link',
            attrs: { href: docDraft.url, target: '_blank', rel: 'noopener noreferrer nofollow' },
          },
        ],
      })
      // Drop the link mark so subsequent typing isn't linked too.
      .unsetMark('link')
      .insertContent(' ')
      .run();
    setDocDraft(null);
  }

  if (!editor) {
    return <div className="h-64 animate-pulse rounded-md border bg-muted/30" />;
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <EditorToolbar
        editor={editor}
        onUploadImage={() => fileInputRef.current?.click()}
        onUploadDoc={() => docInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={docInputRef}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv"
        className="hidden"
        onChange={(e) => handleDocFile(e.target.files)}
      />
      <EditorContent editor={editor} />
      <div className="flex justify-end gap-3 border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{words} kata</span>
        <span>{chars} karakter</span>
      </div>

      {/* Custom link-text dialog for uploaded documents. */}
      <Dialog open={Boolean(docDraft)} onOpenChange={(o) => !o && setDocDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teks tautan dokumen</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="doc-label" className="text-xs">Teks yang ditampilkan</Label>
            <Input
              id="doc-label"
              value={docDraft?.label ?? ''}
              autoFocus
              placeholder="mis. Unduh proposal kegiatan"
              onChange={(e) => setDocDraft((d) => (d ? { ...d, label: e.target.value } : d))}
              onKeyDown={(e) => e.key === 'Enter' && insertDocLink()}
            />
            <p className="text-xs text-muted-foreground">Pembaca melihat teks ini, bukan URL panjangnya.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDraft(null)}>Batal</Button>
            <Button onClick={insertDocLink}>Sisipkan tautan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default TipTapEditor;

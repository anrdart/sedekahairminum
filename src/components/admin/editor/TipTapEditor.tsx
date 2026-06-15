import * as React from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { buildExtensions } from './extensions';
import { EditorToolbar } from './EditorToolbar';
import { uploadMedia } from '@/lib/upload';
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
}

export default function TipTapEditor({ initialContent, onChange, placeholder }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  if (!editor) {
    return <div className="h-64 animate-pulse rounded-md border bg-muted/30" />;
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <EditorToolbar editor={editor} onUploadImage={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <EditorContent editor={editor} />
      <div className="flex justify-end gap-3 border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{words} kata</span>
        <span>{chars} karakter</span>
      </div>
    </div>
  );
}

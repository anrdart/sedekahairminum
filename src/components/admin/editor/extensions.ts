// TipTap v3 extension set. NOTE: StarterKit v3 already bundles Link, Underline,
// Strike, CodeBlock, HorizontalRule, Bold/Italic/Code, lists, heading, etc.
// We disable StarterKit's plain codeBlock and swap in CodeBlockLowlight for
// syntax highlighting, and only add extensions NOT already in StarterKit.

import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { createLowlight, common } from 'lowlight';
import type { AnyExtension } from '@tiptap/core';

const lowlight = createLowlight(common);

export function buildExtensions(placeholder = 'Tulis artikel di sini…'): AnyExtension[] {
  return [
    StarterKit.configure({
      // Replaced by CodeBlockLowlight below.
      codeBlock: false,
      // Configure the bundled Link mark (v3).
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      },
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { loading: 'lazy' } }),
    Placeholder.configure({ placeholder }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CharacterCount,
    Typography,
  ];
}

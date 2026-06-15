// Server-side HTML sanitizer for article content. The editor JSON is the source
// of truth; the rendered HTML (content_html) is sanitized here before being
// stored and later injected via set:html on the public blog.

import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'strong', 'em', 'u', 's', 'br', 'hr', 'span', 'mark', 'sub', 'sup',
  'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      span: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      '*': ['data-*'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'data'],
    allowedSchemesByTag: { img: ['https', 'http', 'data'] },
    // Force safe link behaviour.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer nofollow' } : {}),
        },
      }),
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
      },
    },
  });
}

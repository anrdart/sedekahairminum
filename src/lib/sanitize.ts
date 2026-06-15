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

// CSS color validation: 3, 4, 6, or 8 hex digits after `#`. Tightened from the
// original loose regex (which allowed `#0x` and arbitrary lengths).
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;

// Only safe image data URIs. SVG in data: is excluded because SVG can carry
// CSS exfil references; even inside <img>, defense-in-depth is cheap.
const IMAGE_DATA_SCHEMES = ['data:image/png', 'data:image/jpeg', 'data:image/jpg', 'data:image/webp', 'data:image/gif'];

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
    // No `data:` in anchor href — prevents data:text/html phishing links.
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      img: ['https', 'http', ...IMAGE_DATA_SCHEMES],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer nofollow' } : {}),
        },
      }),
      // Strip event handlers and javascript: URLs that slipped through scheme filtering.
      '*': (tagName, attribs) => {
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(attribs)) {
          if (k.startsWith('on')) continue; // onclick, onerror, etc.
          if (typeof v === 'string' && /javascript:/i.test(v)) continue;
          cleaned[k] = v;
        }
        return { tagName, attribs: cleaned };
      },
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        color: [HEX_COLOR, RGB_COLOR],
      },
    },
  });
}

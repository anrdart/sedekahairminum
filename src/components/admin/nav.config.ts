// Admin navigation model — drives the sidebar and breadcrumb labels. Keep route
// → label here so both stay in sync. `adminOnly` items are hidden from editors
// (middleware also enforces this server-side).

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name (resolved in Sidebar.tsx)
  adminOnly?: boolean;
  match?: 'exact' | 'prefix';
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Ringkasan',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'layout-dashboard', match: 'exact' },
      { label: 'Aktivitas', href: '/admin/activity', icon: 'activity', adminOnly: true },
    ],
  },
  {
    label: 'Blog',
    items: [
      { label: 'Artikel', href: '/admin/articles', icon: 'newspaper' },
      { label: 'Kategori', href: '/admin/categories', icon: 'folder-tree' },
      { label: 'Tag', href: '/admin/tags', icon: 'tags' },
      { label: 'Media', href: '/admin/media', icon: 'image' },
    ],
  },
  {
    label: 'Konten Situs',
    items: [
      { label: 'Penerima', href: '/admin/content/penerima', icon: 'building-2', adminOnly: true },
      { label: 'Hero', href: '/admin/content/hero', icon: 'panels-top-left', adminOnly: true },
      { label: 'Statistik', href: '/admin/content/stats', icon: 'chart-bar', adminOnly: true },
      { label: 'Fitur', href: '/admin/content/features', icon: 'sparkles', adminOnly: true },
      { label: 'Program', href: '/admin/content/program', icon: 'images', adminOnly: true },
      { label: 'Galeri', href: '/admin/content/gallery', icon: 'camera', adminOnly: true },
      { label: 'Testimoni', href: '/admin/content/testimonials', icon: 'quote', adminOnly: true },
      { label: 'FAQ', href: '/admin/content/faqs', icon: 'circle-help', adminOnly: true },
      { label: 'Nilai', href: '/admin/content/values', icon: 'gem', adminOnly: true },
      { label: 'Tim', href: '/admin/content/team', icon: 'users', adminOnly: true },
      { label: 'Misi', href: '/admin/content/misi', icon: 'target', adminOnly: true },
      { label: 'Rekening', href: '/admin/content/rekening', icon: 'landmark', adminOnly: true },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Pesan Masuk', href: '/admin/submissions', icon: 'inbox', adminOnly: true },
      { label: 'Pengaturan', href: '/admin/settings', icon: 'settings', adminOnly: true },
      { label: 'Pengguna', href: '/admin/users', icon: 'user-cog', adminOnly: true },
    ],
  },
];

/** Flattened label lookup for breadcrumbs. */
export const ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  NAV_SECTIONS.flatMap((s) => s.items.map((i) => [i.href, i.label])),
);

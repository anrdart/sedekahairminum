// Resolve a lucide icon by kebab-case name (as used in nav.config.ts).
// NOTE: lucide-react@1.14.0's `icons` record is missing a few entries that DO
// exist as top-level named exports (e.g. AlignLeft/AlignCenter/AlignRight/
// AlignJustify). Resolve from the module's named exports first, then fall back
// to the `icons` record, so no toolbar button silently renders blank.
import * as Lucide from 'lucide-react';
import { icons, type LucideProps } from 'lucide-react';

function toPascal(name: string): string {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

type IconComponent = React.ComponentType<LucideProps>;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const key = toPascal(name);
  const named = (Lucide as unknown as Record<string, IconComponent>)[key];
  const fromRecord = (icons as Record<string, IconComponent>)[key];
  const Cmp = named ?? fromRecord;
  if (!Cmp) return null;
  return <Cmp {...props} />;
}

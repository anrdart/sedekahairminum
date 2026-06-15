// Resolve a lucide icon by kebab-case name (as used in nav.config.ts).
import { icons, type LucideProps } from 'lucide-react';

function toPascal(name: string): string {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[toPascal(name)];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}

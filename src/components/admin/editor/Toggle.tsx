import * as React from 'react';
import { cn } from '@/lib/utils';

// Small toolbar toggle button with an active state (shadcn button styling).
export function Toggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}

import type { HTMLAttributes, ReactNode } from 'react';

export function SrOnly({
  children,
  ...props
}: { children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}

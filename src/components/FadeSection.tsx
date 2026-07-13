import type { HTMLAttributes, ReactNode } from 'react';
import { useContentFade } from '../hooks/useContentFade';

interface FadeSectionProps extends HTMLAttributes<HTMLElement> {
  show: boolean;
  as?: 'div' | 'section';
  children: ReactNode;
}

export default function FadeSection({
  show,
  as: Tag = 'div',
  className,
  children,
  onTransitionEnd: externalOnTransitionEnd,
  ...props
}: FadeSectionProps) {
  const { mounted, fadeClass, onTransitionEnd } = useContentFade(show);

  if (!mounted) return null;

  return (
    <Tag
      {...props}
      className={`content-fade ${fadeClass}${className ? ` ${className}` : ''}`}
      onTransitionEnd={(event) => {
        onTransitionEnd(event);
        externalOnTransitionEnd?.(event);
      }}
    >
      {children}
    </Tag>
  );
}

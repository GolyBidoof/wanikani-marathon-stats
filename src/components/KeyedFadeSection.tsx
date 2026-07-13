import type { HTMLAttributes, ReactNode } from 'react';
import { useKeyedFade } from '../hooks/useKeyedFade';

interface KeyedFadeSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  contentKey: string;
  as?: 'div' | 'section';
  children: ReactNode | ((displayKey: string) => ReactNode);
}

export default function KeyedFadeSection({
  contentKey,
  as: Tag = 'div',
  className,
  children,
  onTransitionEnd: externalOnTransitionEnd,
  ...props
}: KeyedFadeSectionProps) {
  const { displayKey, fadeClass, onTransitionEnd, isVisible } = useKeyedFade(contentKey);

  return (
    <Tag
      {...props}
      className={`content-fade ${fadeClass}${className ? ` ${className}` : ''}`}
      onTransitionEnd={(event) => {
        onTransitionEnd(event);
        externalOnTransitionEnd?.(event);
      }}
      aria-busy={!isVisible || undefined}
    >
      {typeof children === 'function' ? children(displayKey) : children}
    </Tag>
  );
}

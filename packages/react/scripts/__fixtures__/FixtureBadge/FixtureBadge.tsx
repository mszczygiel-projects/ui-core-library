import type { CSSProperties, ReactNode } from 'react';

/**
 * Fixture badge exercising every llms-transformer feature.
 *
 * @example
 * <FixtureBadge tone="danger" label="Deleted">3</FixtureBadge>
 */
export interface FixtureBadgeProps {
  /**
   * Visual tone of the fixture.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'danger';
  /** Required accessible name. */
  label: string;
  /** Badge content. */
  children?: ReactNode;
  /** Inline styles forwarded to the root element. */
  style?: CSSProperties;
}

export function FixtureBadge({ tone = 'neutral', label, children, style }: FixtureBadgeProps) {
  return (
    <span aria-label={label} data-tone={tone} style={style}>
      {children}
    </span>
  );
}

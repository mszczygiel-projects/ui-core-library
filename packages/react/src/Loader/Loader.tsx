import type { CSSProperties } from 'react';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import './Loader.css';

/**
 * Inline spinner indicating a pending asynchronous operation.
 *
 * @example
 * <Loader size="small" label="Loading results" />
 */
export interface LoaderProps {
  /**
   * Spinner diameter.
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  /**
   * Accessible name announced by screen readers.
   * @default `getUiCoreConfig().labels.loader.loading`
   */
  label?: string;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Loader({ size = 'default', label, className, style }: LoaderProps) {
  const config = getUiCoreConfig();
  const variant = config.loaderVariant;
  const resolvedLabel = label ?? config.labels.loader.loading;

  return (
    <span
      role="status"
      aria-label={resolvedLabel}
      aria-live="polite"
      className={['ui-loader', className].filter(Boolean).join(' ')}
      style={style}
    >
      {renderVariant(variant, size)}
    </span>
  );
}

function renderVariant(variant: string, size: NonNullable<LoaderProps['size']>) {
  switch (variant) {
    case 'spinner':
    default:
      return (
        <span aria-hidden="true" className={`ui-loader__spinner ui-loader__spinner--${size}`} />
      );
  }
}

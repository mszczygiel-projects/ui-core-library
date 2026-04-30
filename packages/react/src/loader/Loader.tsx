import type { CSSProperties } from 'react';
import { getUiCoreConfig } from '@ui-core/foundations';
import './loader.css';

export interface LoaderProps {
  size?: 'small' | 'default' | 'large';
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Loader({ size = 'default', label = 'Loading', className, style }: LoaderProps) {
  const variant = getUiCoreConfig().loaderVariant;

  return (
    <span
      role="status"
      aria-label={label}
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

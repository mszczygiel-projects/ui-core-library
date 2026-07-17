import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { IconClose } from '@mszczygiel-projects/ui-core-icons/react';
import './Chip.css';

export type ChipVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
export type ChipAppearance = 'solid' | 'subtle' | 'outline';
export type ChipSize = 'small' | 'medium';

/**
 * Interactive chip for filters, selections, and dismissible tags.
 *
 * @example
 * <Chip variant="brand" appearance="subtle" selected dismissible onDismiss={() => remove(id)}>
 *   Filter
 * </Chip>
 */
export interface ChipProps {
  /**
   * Semantic color scheme.
   * @default 'neutral'
   */
  variant?: ChipVariant;
  /**
   * Visual style — maps to the Figma `Style` property (renamed: `style` is the inline-style prop).
   * @default 'solid'
   */
  appearance?: ChipAppearance;
  /**
   * Overall chip height and typography scale.
   * @default 'small'
   */
  size?: ChipSize;
  /**
   * Selected (pressed) state — renders `aria-pressed="true"` on the action button.
   * @default false
   */
  selected?: boolean;
  /**
   * Disables the chip; the dismiss button is not rendered while disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the trailing dismiss button (hidden while `disabled`).
   * @default false
   */
  dismissible?: boolean;
  /**
   * Accessible name of the dismiss button.
   * @default 'Remove'
   */
  dismissLabel?: string;
  /** Leading icon. */
  icon?: ReactNode;
  /** Chip label content. */
  children?: ReactNode;
  /** Click handler for the main chip action. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Called when the dismiss button is clicked or Delete/Backspace is pressed on the chip. */
  onDismiss?: () => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Chip({
  variant = 'neutral',
  appearance = 'solid',
  size = 'small',
  selected = false,
  disabled = false,
  dismissible = false,
  dismissLabel = 'Remove',
  icon,
  children,
  onClick,
  onDismiss,
  className,
  style,
}: ChipProps) {
  const showDismiss = dismissible && !disabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && dismissible && !disabled) {
      event.preventDefault();
      onDismiss?.();
    }
  };

  const handleDismissClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Dismiss is independently interactive — never surfaces as a chip click.
    event.stopPropagation();
    onDismiss?.();
  };

  return (
    <span
      className={[
        'ui-chip',
        `ui-chip--${variant}`,
        `ui-chip--${appearance}`,
        size !== 'small' && `ui-chip--${size}`,
        selected && 'ui-chip--selected',
        disabled && 'ui-chip--disabled',
        showDismiss && 'ui-chip--dismissible',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <button
        type="button"
        className="ui-chip__action"
        disabled={disabled}
        aria-pressed={selected || undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        {icon && (
          <span className="ui-chip__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ui-chip__label">{children}</span>
      </button>
      {showDismiss && (
        <button
          type="button"
          className="ui-chip__dismiss"
          aria-label={dismissLabel}
          onClick={handleDismissClick}
        >
          <IconClose />
        </button>
      )}
    </span>
  );
}

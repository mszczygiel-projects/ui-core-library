import { type CSSProperties, type ReactNode } from 'react';
import {
  IconClose,
  IconDanger,
  IconCheck,
  IconInfo,
} from '@mszczygiel-projects/ui-core-icons/react';
import './Notification.css';

export type NotificationStatus = 'info' | 'success' | 'warning' | 'error';
export type NotificationVariant = 'default' | 'subtle';

/**
 * Banner communicating a status message; `error` renders as an assertive `role="alert"`.
 *
 * @example
 * <Notification status="success" heading="Changes saved" onClose={dismiss}>
 *   Your profile is now up to date.
 * </Notification>
 */
export interface NotificationProps {
  /**
   * Semantic tone; also picks the status icon and ARIA role.
   * @default 'info'
   */
  status?: NotificationStatus;
  /**
   * Visual style: solid accent or subtle tinted background.
   * @default 'default'
   */
  variant?: NotificationVariant;
  /** Heading text — the primary message. */
  heading: string;
  /** Optional description rendered below the heading. */
  children?: ReactNode;
  /**
   * Shows the status icon in front of the heading. Available in every variant.
   * @default true
   */
  hasLeadingIcon?: boolean;
  /**
   * Shows the × close button.
   * @default true
   */
  hasCloseButton?: boolean;
  /** Called when the close button is clicked. */
  onClose?: () => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

const statusIcons: Record<NotificationStatus, ReactNode> = {
  info: <IconInfo aria-hidden="true" />,
  success: <IconCheck aria-hidden="true" />,
  warning: <IconDanger aria-hidden="true" />,
  error: <IconDanger aria-hidden="true" />,
};

const statusRoles: Record<NotificationStatus, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  error: 'alert',
};

export function Notification({
  status = 'info',
  variant = 'default',
  heading,
  children,
  hasLeadingIcon = true,
  hasCloseButton = true,
  onClose,
  className,
  style,
}: NotificationProps) {
  const classes = [
    'ui-notification',
    `ui-notification--${variant}`,
    `ui-notification--${status}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role={statusRoles[status]} className={classes} style={style}>
      <div className="ui-notification__header">
        {hasLeadingIcon && (
          <span className="ui-notification__icon" aria-hidden="true">
            {statusIcons[status]}
          </span>
        )}
        <div className="ui-notification__heading">{heading}</div>
      </div>

      {children && <div className="ui-notification__description">{children}</div>}

      {hasCloseButton && (
        <button
          type="button"
          className="ui-notification__close"
          aria-label="Close notification"
          onClick={onClose}
        >
          <IconClose aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

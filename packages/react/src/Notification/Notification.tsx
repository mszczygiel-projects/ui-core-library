import { type CSSProperties, type ReactNode } from 'react';
import {
  IconClose,
  IconDanger,
  IconFlag,
  IconInfo,
} from '@mszczygiel-projects/ui-core-icons/react';
import './Notification.css';

export type NotificationStatus = 'info' | 'success' | 'warning' | 'error';
export type NotificationVariant = 'default' | 'subtle';

export interface NotificationProps {
  status?: NotificationStatus;
  variant?: NotificationVariant;
  heading: string;
  children?: ReactNode;
  hasCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
}

const statusIcons: Record<NotificationStatus, ReactNode> = {
  info: <IconInfo aria-hidden="true" />,
  success: <IconFlag aria-hidden="true" />,
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
        {/* Icon always in DOM — visibility driven by CSS var --_show-icon */}
        <span className="ui-notification__icon" aria-hidden="true">
          {statusIcons[status]}
        </span>
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

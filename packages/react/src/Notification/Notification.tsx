import type { CSSProperties } from 'react';
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
  title: string;
  description?: string;
  hasCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
}

const statusIcons: Record<NotificationStatus, React.ReactNode> = {
  info: <IconInfo aria-hidden="true" />,
  success: <IconFlag aria-hidden="true" />,
  warning: <IconDanger aria-hidden="true" />,
  error: <IconDanger aria-hidden="true" />,
};

export function Notification({
  status = 'info',
  variant = 'default',
  title,
  description,
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
    <div role="alert" className={classes} style={style}>
      <div className="ui-notification__header">
        {/* Icon is always rendered — CSS var --_show-icon controls visibility */}
        <span className="ui-notification__icon" aria-hidden="true">
          {statusIcons[status]}
        </span>
        <p className="ui-notification__title">{title}</p>
      </div>

      {description && <p className="ui-notification__description">{description}</p>}

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

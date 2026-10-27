'use client';

import { iconCheck, iconClose, iconDanger, iconInfo } from '@mszczygiel-projects/ui-core-icons';
import {
  notification,
  type NotificationDismissDetail,
  type NotificationProps as SharedNotificationProps,
  notificationRole,
  type NotificationTone,
  type NotificationVariant,
} from '@mszczygiel-projects/ui-core-shared/notification';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type ComponentPropsWithRef, useEffect, useId, useState } from 'react';

import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type { NotificationTone, NotificationVariant };

const { options } = notification;

/** The icon of each tone, a cue that does not rest on colour alone. */
const toneIcons: Record<NotificationTone, string> = {
  info: iconInfo,
  success: iconCheck,
  warning: iconDanger,
  error: iconDanger,
};

/** The props of Notification. Other attributes of a `div` and the ref go to its root element. */
export interface NotificationProps
  extends
    SharedNotificationProps,
    Omit<ComponentPropsWithRef<'div'>, keyof SharedNotificationProps> {
  /** Called when a user asks to remove the notification; the page removes it. */
  onDismiss?: (details: NotificationDismissDetail<Event>) => void;
}

/**
 * Tells the user about the state of the page or the result of an action, in one of the feedback
 * tones.
 *
 * The heading gives the message in one line, and the children describe it further. A
 * notification with `announce` is a live region, an alert for an error and a status for any other
 * tone; it shows its content one frame after it mounts, so that a screen reader reads a
 * notification that the page inserts. A dismissible notification adds a button named by the
 * dismiss label and the heading, which calls `onDismiss`; the page removes the notification.
 */
export function Notification({
  tone = 'info',
  variant = 'solid',
  heading,
  hasLeadingIcon = false,
  dismissible = false,
  dismissLabel,
  announce = false,
  onDismiss,
  children,
  className,
  ...rest
}: NotificationProps) {
  const { labels } = useUiCoreConfig();
  const id = useId();
  const headingId = `${id}-heading`;
  const dismissLabelId = `${id}-dismiss`;
  // A live region announces a change of its content, not content it had when it appeared, so an
  // announced notification mounts empty and shows its content a frame later. The server and the
  // first render on the client agree on the empty region.
  const [revealedOnce, setRevealedOnce] = useState(false);
  useEffect(() => {
    if (!announce) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      setRevealedOnce(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [announce]);
  const revealed = !announce || revealedOnce;
  const resolvedTone = oneOf(tone, options.tone.options, options.tone.default);
  const resolvedVariant = oneOf(variant, options.variant.options, options.variant.default);
  const hasHeading = heading !== undefined && heading !== '';
  return (
    <div
      {...rest}
      className={classNames(
        'ui-notification',
        'ui-notification__base',
        className,
        `ui-notification--${resolvedTone}`,
        `ui-notification--${resolvedVariant}`,
      )}
    >
      <div className="ui-notification__content" role={notificationRole(resolvedTone, announce)}>
        <div className="ui-notification__header" hidden={!revealed}>
          {hasLeadingIcon && (
            // The icons package holds trusted SVG strings, drawn in currentColor.
            <span
              className="ui-notification__icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: toneIcons[resolvedTone] }}
            />
          )}
          {hasHeading && (
            <span id={headingId} className="ui-notification__heading">
              {heading}
            </span>
          )}
        </div>
        {rendersContent(children) && (
          <div className="ui-notification__description" hidden={!revealed}>
            {children}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          className="ui-notification__dismiss"
          aria-labelledby={hasHeading ? `${dismissLabelId} ${headingId}` : dismissLabelId}
          onClick={(event) => {
            onDismiss?.({ originalEvent: event.nativeEvent });
          }}
        >
          <span id={dismissLabelId} hidden>
            {dismissLabel ?? labels.notification.dismiss}
          </span>
          <span
            className="ui-notification__dismiss-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconClose }}
          />
        </button>
      )}
    </div>
  );
}

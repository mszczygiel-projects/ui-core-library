import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Notification. */
export const notification = defineComponent({
  name: 'Notification',
  tag: 'ui-notification',
  category: 'Feedback',
  status: 'in-progress',
  figma: '1731:2969',
  design: {
    flags: [],
    booleans: ['hasLeadingIcon', 'dismissible'],
    codeOnly: ['announce'],
    previews: {
      description: {
        options: ['true', 'false'],
        default: 'true',
        note: 'Shows or hides the description below the heading. Code shows it when the notification has content.',
      },
    },
  },
  summary:
    'Tells the user about the state of the page or the result of an action, in one of the feedback tones.',
  options: {
    tone: { options: ['info', 'success', 'warning', 'error'], default: 'info' },
    variant: { options: ['solid', 'subtle'], default: 'solid' },
  },
  labels: ['dismiss'],
  parts: ['base', 'content', 'header', 'icon', 'heading', 'description', 'dismiss'],
  slots: [],
  events: ['ui-dismiss'],
  stories: ['Playground', 'Variants', 'Dismissible', 'Announced', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component is form-associated only to follow a disabled fieldset, as the native dismiss button of React does. It submits nothing and exposes no form API.',
    },
  ],
});

/** The feedback a notification gives: information, a success, a warning or an error. */
export type NotificationTone = OptionOf<typeof notification, 'tone'>;
/** The emphasis of a notification: a strong fill or a light tint with an accent border. */
export type NotificationVariant = OptionOf<typeof notification, 'variant'>;

/** The live-region role of a notification, or none for one that is not announced. */
export type NotificationRole = 'status' | 'alert' | undefined;

/**
 * The live-region role of a notification. Only an announced notification is a live region: an
 * error interrupts as an alert, and any other tone waits as a status.
 */
export function notificationRole(tone: NotificationTone, announce: boolean): NotificationRole {
  if (!announce) {
    return undefined;
  }
  return tone === 'error' ? 'alert' : 'status';
}

/** The detail of `ui-dismiss`: the native event that asked to remove the notification. */
export interface NotificationDismissDetail<OriginalEvent> {
  /** The click on the dismiss button. */
  readonly originalEvent: OriginalEvent;
}

/** The props both implementations of Notification share. */
export interface NotificationProps {
  /**
   * The feedback the notification gives.
   * @default 'info'
   */
  tone?: NotificationTone;
  /**
   * The emphasis of the notification.
   * @default 'solid'
   */
  variant?: NotificationVariant;
  /** The message in one short line. The content of the notification describes it further. */
  heading?: string;
  /**
   * Shows the icon of the tone before the heading.
   * @default false
   */
  hasLeadingIcon?: boolean;
  /**
   * Shows a button that asks to remove the notification. The notification only reports the
   * request; the page removes it.
   * @default false
   */
  dismissible?: boolean;
  /**
   * The word that names the dismiss button before the heading, falling back to
   * `labels.notification.dismiss`.
   */
  dismissLabel?: string;
  /**
   * Makes the notification a live region, so that a screen reader reads it when it appears or
   * changes: an alert for an error, a status for any other tone. Leave it off for a message that
   * is on the page from the start.
   * @default false
   */
  announce?: boolean;
}

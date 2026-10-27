import type { NotificationDismissDetail } from '@mszczygiel-projects/ui-core-shared/notification';

/**
 * The detail of the event of Notification, with the native event that caused it. It lives in a
 * module of its own so that the declarations Stencil writes can import it.
 */
export type NotificationDismiss = NotificationDismissDetail<Event>;

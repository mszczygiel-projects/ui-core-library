import type { CalendarChangeDetail } from '@mszczygiel-projects/ui-core-shared/calendar';

/**
 * The detail of the events of Calendar, with the native event that caused them. It lives in a
 * module of its own so that the declarations Stencil writes can import it.
 */
export type CalendarChange = CalendarChangeDetail<Event>;

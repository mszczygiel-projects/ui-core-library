import type {
  DateFieldOpenChangeDetail,
  DateFieldValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/date-field';

/** The canonical value and editable state accompanying ui-value-change. */
export type DateFieldValueChange = DateFieldValueChangeDetail<Event>;

/** Whether the calendar is open, with the native event, accompanying ui-open-change. */
export type DateFieldOpenChange = DateFieldOpenChangeDetail<Event>;

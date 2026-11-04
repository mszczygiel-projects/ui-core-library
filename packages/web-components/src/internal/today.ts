import { isoDateAt } from '@mszczygiel-projects/ui-core-shared/date';

/** Today's date where the user is, from the clock and time zone of the browser. */
export function browserToday(): string | undefined {
  try {
    return isoDateAt(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return undefined;
  }
}

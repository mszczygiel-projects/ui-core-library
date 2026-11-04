import { isoDateAt } from '@mszczygiel-projects/ui-core-shared/date';
import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => undefined;
const browserLanguage = () => navigator.language;
const serverValue = () => undefined;

function browserToday(): string | undefined {
  try {
    return isoDateAt(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return undefined;
  }
}

/**
 * The language of the browser, undefined on a server and while hydrating, so that both render with
 * the same locale and the browser's applies right after.
 */
export function useBrowserLanguage(): string | undefined {
  return useSyncExternalStore(subscribeNever, browserLanguage, serverValue);
}

/**
 * Today's date in the time zone of the browser, undefined on a server and while hydrating, since
 * a server's clock and time zone may name another day.
 */
export function useBrowserToday(): string | undefined {
  return useSyncExternalStore(subscribeNever, browserToday, serverValue);
}

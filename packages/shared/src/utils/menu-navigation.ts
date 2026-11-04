import type { MenuItem } from '../components/menu.ts';
import { firstEnabled, lastEnabled } from './listbox-navigation.ts';

/** What a key does to an open menu. */
export type MenuKeyAction =
  | { readonly kind: 'highlight'; readonly index: number }
  | { readonly kind: 'activate' }
  | { readonly kind: 'close' };

/**
 * The item that the trigger of a closed menu opens it on, or undefined for a key that does not
 * open it: Arrow Down opens on the first enabled item and Arrow Up on the last. Enter and Space
 * press the trigger as a button, so the press opens the menu on the first item.
 */
export function openingIndex(items: readonly MenuItem<unknown>[], key: string): number | undefined {
  if (key === 'ArrowDown') {
    return firstEnabled(items) ?? -1;
  }
  if (key === 'ArrowUp') {
    return lastEnabled(items) ?? -1;
  }
  return undefined;
}

/** The next enabled item from `current` in the direction of `step`, past the ends to the other. */
function wrapping(items: readonly MenuItem<unknown>[], current: number, step: 1 | -1): number {
  const count = items.length;
  // With nothing highlighted, Arrow Up starts past the last item, as Arrow Down before the first.
  const start = current < 0 && step === -1 ? count : current;
  for (let offset = 1; offset <= count; offset++) {
    const index = (((start + step * offset) % count) + count) % count;
    if (items[index]?.disabled !== true) {
      return index;
    }
  }
  return current;
}

/**
 * What a key does in an open menu whose item at `current` is highlighted, -1 for none: the arrows
 * move to the next or previous enabled item and wrap at the ends, Home and End go to the first and
 * last, Enter and Space activate the highlighted item and Escape closes the menu. Tab moves the
 * focus out as usual, and the focus leaving closes the menu. Returns undefined for any other key,
 * which a typeahead may take.
 */
export function menuKeyAction(
  items: readonly MenuItem<unknown>[],
  current: number,
  key: string,
): MenuKeyAction | undefined {
  switch (key) {
    case 'ArrowDown':
      return { kind: 'highlight', index: wrapping(items, current, 1) };
    case 'ArrowUp':
      return { kind: 'highlight', index: wrapping(items, current, -1) };
    case 'Home':
      return { kind: 'highlight', index: firstEnabled(items) ?? current };
    case 'End':
      return { kind: 'highlight', index: lastEnabled(items) ?? current };
    case 'Enter':
    case ' ':
      return { kind: 'activate' };
    case 'Escape':
      return { kind: 'close' };
    default:
      return undefined;
  }
}

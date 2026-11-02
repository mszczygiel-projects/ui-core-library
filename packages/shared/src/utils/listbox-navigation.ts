import type {
  ListboxGroup,
  ListboxItems,
  ListboxOption,
  ListboxValue,
} from '../components/listbox.ts';
import { matchText } from './text.ts';

/** Whether the items of a list are groups of options. */
export function isGrouped<Icon>(
  items: ListboxItems<Icon> | undefined,
): items is readonly ListboxGroup<Icon>[] {
  const first: unknown = items?.[0];
  return (
    typeof first === 'object' && first !== null && Array.isArray(Reflect.get(first, 'options'))
  );
}

/** The options of a list in their order, without their groups. */
export function flattenOptions<Icon>(
  items: ListboxItems<Icon> | undefined,
): readonly ListboxOption<Icon>[] {
  if (items === undefined) {
    return [];
  }
  return isGrouped(items) ? items.flatMap((group) => group.options) : items;
}

/** The chosen values as a list, whatever the shape of the value. Empty strings choose nothing. */
export function valuesOf(value: ListboxValue | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }
  const values = typeof value === 'string' ? [value] : value;
  return values.filter((item) => typeof item === 'string' && item !== '');
}

/**
 * The value in the shape a list holds: the first chosen value of a single choice, or `''`, and the
 * list of distinct chosen values of a multiple choice.
 */
export function normalizeValue(value: ListboxValue | undefined, multiple: boolean): ListboxValue {
  const values = valuesOf(value);
  return multiple ? [...new Set(values)] : (values[0] ?? '');
}

/** Whether an option is chosen. */
export function isChosen(value: ListboxValue | undefined, optionValue: string): boolean {
  return optionValue !== '' && valuesOf(value).includes(optionValue);
}

/** A multiple value with `optionValue` added, or removed when it was there. */
export function toggleValue(values: readonly string[], optionValue: string): readonly string[] {
  return values.includes(optionValue)
    ? values.filter((value) => value !== optionValue)
    : [...values, optionValue];
}

/** The index of the option that has the value, or -1. */
export function indexOfValue(options: readonly ListboxOption<unknown>[], value: string): number {
  return value === '' ? -1 : options.findIndex((option) => option.value === value);
}

function enabledFrom(
  options: readonly ListboxOption<unknown>[],
  start: number,
  step: 1 | -1,
): number | undefined {
  for (let index = start; index >= 0 && index < options.length; index += step) {
    if (options[index]?.disabled !== true) {
      return index;
    }
  }
  return undefined;
}

/** The first option a user can choose, or undefined when none can be chosen. */
export function firstEnabled(options: readonly ListboxOption<unknown>[]): number | undefined {
  return enabledFrom(options, 0, 1);
}

/** The last option a user can choose, or undefined when none can be chosen. */
export function lastEnabled(options: readonly ListboxOption<unknown>[]): number | undefined {
  return enabledFrom(options, options.length - 1, -1);
}

/** The keys that move the highlight of a list. */
const MOVES: Readonly<
  Record<string, { readonly from: 'next' | 'previous' | 'first' | 'last'; readonly page?: boolean }>
> = {
  ArrowDown: { from: 'next' },
  ArrowUp: { from: 'previous' },
  Home: { from: 'first' },
  End: { from: 'last' },
  PageDown: { from: 'next', page: true },
  PageUp: { from: 'previous', page: true },
};

/**
 * The option that a key highlights from the option at `current`, -1 for none: the arrows move to
 * the next or previous enabled option and stop at the ends, Home and End go to the first and last,
 * and Page Down and Page Up move by `pageSize` options. Returns undefined for any other key, and
 * `current` when the key cannot move.
 */
export function moveHighlight(
  options: readonly ListboxOption<unknown>[],
  current: number,
  key: string,
  pageSize = 10,
): number | undefined {
  const move = MOVES[key];
  if (move === undefined) {
    return undefined;
  }
  const found =
    move.from === 'first'
      ? firstEnabled(options)
      : move.from === 'last'
        ? lastEnabled(options)
        : current < 0
          ? move.from === 'next'
            ? firstEnabled(options)
            : lastEnabled(options)
          : move.page === true
            ? pageFrom(options, current, move.from === 'next' ? pageSize : -pageSize)
            : enabledFrom(
                options,
                current + (move.from === 'next' ? 1 : -1),
                move.from === 'next' ? 1 : -1,
              );
  return found ?? current;
}

function pageFrom(
  options: readonly ListboxOption<unknown>[],
  current: number,
  offset: number,
): number | undefined {
  const target = Math.min(Math.max(current + offset, 0), options.length - 1);
  const step = offset > 0 ? 1 : -1;
  // Past a disabled option, the nearest enabled one in the same direction, else the one before it.
  return enabledFrom(options, target, step === 1 ? -1 : 1) ?? enabledFrom(options, target, step);
}

/** How long, in milliseconds, the typed letters of a typeahead keep adding up. */
export const TYPEAHEAD_TIMEOUT = 500;

/** The value of a key that types one character, rather than naming a key such as `Enter`. */
const ONE_CHARACTER = /^.$/su;

/** What a typeahead remembers between keys. */
export interface TypeaheadState {
  readonly query: string;
  /** When the last letter was typed, in milliseconds of any clock that the caller keeps. */
  readonly time: number;
}

/** A typeahead without typed letters. */
export const EMPTY_TYPEAHEAD: TypeaheadState = { query: '', time: Number.NEGATIVE_INFINITY };

/**
 * Moves the highlight to the option whose label starts with the typed letters, ignoring case and
 * diacritics. Letters typed within {@link TYPEAHEAD_TIMEOUT} of each other add up; the same
 * letter typed again goes on to the next option that starts with it. `now` is the time of the key,
 * from the caller's clock. Returns undefined for a key that is not one printable character.
 */
export function typeahead(
  state: TypeaheadState,
  key: string,
  now: number,
  options: readonly ListboxOption<unknown>[],
  current: number,
): { readonly state: TypeaheadState; readonly index: number } | undefined {
  const previous = now - state.time > TYPEAHEAD_TIMEOUT ? '' : state.query;
  // A space only continues a query, since alone it chooses or toggles an option.
  if (!ONE_CHARACTER.test(key) || (key === ' ' && previous === '')) {
    return undefined;
  }
  const query = previous + key;
  const repeated = query.replaceAll(key, '') === '';
  // One letter, or the same letter again, starts after the current option; more letters keep it.
  const search = repeated ? key : query;
  const start = repeated ? current + 1 : Math.max(current, 0);
  const count = options.length;
  let index = current;
  for (let offset = 0; offset < count; offset++) {
    const candidate = (((start + offset) % count) + count) % count;
    const option = options[candidate];
    if (
      option !== undefined &&
      option.disabled !== true &&
      matchText(option.label, search, 'startsWith')
    ) {
      index = candidate;
      break;
    }
  }
  return { state: { query, time: now }, index };
}

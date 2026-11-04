import type { TextDirection } from './radio-navigation.ts';

/** The direction in which the tabs of a list follow each other. */
export type TabsAxis = 'horizontal' | 'vertical';

const FORWARD: Readonly<Record<TabsAxis, Readonly<Record<TextDirection, string>>>> = {
  horizontal: { ltr: 'ArrowRight', rtl: 'ArrowLeft' },
  vertical: { ltr: 'ArrowDown', rtl: 'ArrowDown' },
};

const BACKWARD: Readonly<Record<TabsAxis, Readonly<Record<TextDirection, string>>>> = {
  horizontal: { ltr: 'ArrowLeft', rtl: 'ArrowRight' },
  vertical: { ltr: 'ArrowUp', rtl: 'ArrowUp' },
};

/**
 * The tab that a key moves to from the tab at `current`, as the tabs pattern of WAI-ARIA has it:
 * the arrows along the axis of the list go to the next and previous enabled tab and wrap at the
 * ends, Home and End go to the first and last enabled one. In a horizontal list the arrows follow
 * the direction of text. The arrows across the axis do nothing, so they still scroll the page.
 * Returns undefined for any other key, or when no tab would take the focus.
 */
export function nextTab(
  key: string,
  current: number,
  enabled: readonly boolean[],
  axis: TabsAxis,
  direction: TextDirection,
): number | undefined {
  const count = enabled.length;
  if (key === 'Home') {
    return firstFrom(enabled, 0, 1);
  }
  if (key === 'End') {
    return firstFrom(enabled, count - 1, -1);
  }
  const step = key === FORWARD[axis][direction] ? 1 : key === BACKWARD[axis][direction] ? -1 : 0;
  if (step === 0) {
    return undefined;
  }
  for (let offset = 1; offset < count; offset++) {
    const index = (((current + step * offset) % count) + count) % count;
    if (enabled[index] === true) {
      return index;
    }
  }
  return undefined;
}

/** What the selection needs to know about one tab. */
export interface TabsEntry {
  readonly value: string;
  readonly disabled: boolean;
}

/**
 * The value of the selected tab: the given value when a tab has it, disabled or not, otherwise the
 * value of the first enabled tab, and undefined when no tab can be selected.
 */
export function selectedTabValue(
  value: string | undefined,
  tabs: readonly TabsEntry[],
): string | undefined {
  if (value !== undefined && tabs.some((tab) => tab.value === value)) {
    return value;
  }
  return tabs.find((tab) => !tab.disabled)?.value;
}

function firstFrom(enabled: readonly boolean[], start: number, step: 1 | -1): number | undefined {
  for (let index = start; index >= 0 && index < enabled.length; index += step) {
    if (enabled[index] === true) {
      return index;
    }
  }
  return undefined;
}

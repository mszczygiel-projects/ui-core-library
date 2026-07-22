import type { ReactNode } from 'react';

/** Single selectable entry in an option list. */
export interface ListboxOption {
  /** Value reported when the option is chosen. */
  value: string;
  /** Text shown in the list and in the trigger. */
  label: string;
  /** Renders the option grayed out and unselectable. */
  disabled?: boolean;
  /** Icon rendered before the label. */
  icon?: ReactNode;
}

/** Named set of options rendered under a sticky header. */
export interface ListboxOptionGroup {
  /** Header text for the group. */
  label: string;
  /** Options belonging to this group. */
  options: ListboxOption[];
}

/** Flat option list, or option groups — never a mix of the two. */
export type ListboxItems = ListboxOption[] | ListboxOptionGroup[];

/**
 * One navigable row. Rows are what arrow keys move through: every option
 * (including disabled ones, which are skipped) plus the optional create
 * affordance. Group headers are not rows — they are not selectable.
 */
export type ListboxRow =
  | { kind: 'option'; index: number; option: ListboxOption }
  | { kind: 'create'; index: number };

/** Narrowing guard: grouped items expose an `options` array on the first entry. */
export function isGroupedItems(items: ListboxItems): items is ListboxOptionGroup[] {
  const first = items?.[0] as ListboxOptionGroup | undefined;
  return !!first && Array.isArray(first.options);
}

/** Flattens grouped or flat items into a plain option array. */
export function flattenOptions(items: ListboxItems | undefined): ListboxOption[] {
  if (!items?.length) return [];
  if (!isGroupedItems(items)) return items as ListboxOption[];
  return items.flatMap((group) => group.options ?? []);
}

/**
 * Builds the navigable row list. The create affordance, when present, is the
 * last row — matching the Figma DropdownPanel/Create composition. Pass the
 * pending query; an empty one means there is nothing to create.
 */
export function buildRows(items: ListboxItems | undefined, createValue?: string): ListboxRow[] {
  const rows: ListboxRow[] = flattenOptions(items).map((option, index) => ({
    kind: 'option' as const,
    index,
    option,
  }));
  if (createValue) rows.push({ kind: 'create', index: rows.length });
  return rows;
}

/** True when the row can be activated (create rows always can). */
function isEnabledRow(row: ListboxRow | undefined): boolean {
  if (!row) return false;
  return row.kind === 'create' || !row.option.disabled;
}

/**
 * Next selectable row in `direction`, skipping disabled options. Stops at the
 * ends rather than wrapping, matching the previous select behaviour.
 */
export function nextEnabledRow(rows: ListboxRow[], current: number, direction: 1 | -1): number {
  let next = current + direction;
  while (next >= 0 && next < rows.length) {
    if (isEnabledRow(rows[next])) return next;
    next += direction;
  }
  return current;
}

/** First selectable row, or -1 when every row is disabled. */
export function firstEnabledRow(rows: ListboxRow[]): number {
  for (let i = 0; i < rows.length; i += 1) {
    if (isEnabledRow(rows[i])) return i;
  }
  return -1;
}

/** Row index holding `value`, or -1. */
export function rowIndexOfValue(rows: ListboxRow[], value: string): number {
  return rows.findIndex((row) => row.kind === 'option' && row.option.value === value);
}

/** DOM id of a rendered row — the target of `aria-activedescendant`. */
export function listboxOptionId(idPrefix: string, index: number): string {
  return `${idPrefix}-opt-${index}`;
}

/**
 * Keeps the active row visible while arrowing through a scrolling list.
 * No-ops where `scrollIntoView` is unavailable (jsdom, SSR).
 */
export function scrollRowIntoView(idPrefix: string, index: number): void {
  if (index < 0 || typeof document === 'undefined') return;
  const el = document.getElementById(listboxOptionId(idPrefix, index));
  if (typeof el?.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'nearest' });
  }
}

/** True when `optionValue` is part of the current selection. */
export function isOptionSelected(
  value: string | string[] | undefined,
  optionValue: string,
): boolean {
  if (Array.isArray(value)) return value.includes(optionValue);
  return value === optionValue && optionValue !== '';
}

/** Toggles `optionValue` within a multi-select value array. */
export function toggleValue(value: string[] | undefined, optionValue: string): string[] {
  const current = value ?? [];
  return current.includes(optionValue)
    ? current.filter((v) => v !== optionValue)
    : [...current, optionValue];
}

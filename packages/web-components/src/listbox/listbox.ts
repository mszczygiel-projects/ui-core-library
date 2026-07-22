import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import '../loader/loader.js';

/** Single selectable entry in an option list. */
export interface ListboxOption {
  /** Value reported when the option is chosen. */
  value: string;
  /** Text shown in the list and in the trigger. */
  label: string;
  /** Renders the option grayed out and unselectable. */
  disabled?: boolean;
  /** Name of an icon from the icon package, rendered before the label. */
  icon?: string;
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

/** Keeps the active row visible while arrowing through a scrolling list. */
export function scrollRowIntoView(
  root: ParentNode | null | undefined,
  idPrefix: string,
  index: number,
): void {
  if (!root || index < 0) return;
  const el = root.querySelector<HTMLElement>(`#${CSS.escape(listboxOptionId(idPrefix, index))}`);
  // Guarded: jsdom and SSR environments do not implement scrollIntoView.
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

export interface ListboxRenderConfig {
  /** Prefix for every generated DOM id; must be unique within the shadow root. */
  idPrefix: string;
  /** Options to render, flat or grouped. */
  items: ListboxItems | undefined;
  /** Selected value, or values when `multiple` is set. */
  value: string | string[] | undefined;
  /** Renders check marks and sets `aria-multiselectable`. */
  multiple?: boolean;
  /** Index of the active row, as tracked by the host. */
  activeIndex: number;
  /** Replaces the list with a loading message. */
  loading?: boolean;
  /** Text shown while `loading`. */
  loadingLabel?: string;
  /** Text shown when there are no options and it is not loading. */
  emptyLabel?: string;
  /**
   * Leading word of the create affordance, rendered in the strong weight.
   * @default 'Create'
   */
  createLabel?: string;
  /** Pending query; when set, the create affordance is rendered as the last row. */
  createValue?: string;
  /** Id of the element naming the list. */
  labelledBy?: string;
  /** Accessible name, used when `labelledBy` is absent. */
  label?: string;
  /** Called when a row is chosen by pointer. */
  onSelect: (row: ListboxRow) => void;
  /** Called when the pointer moves over a row, so the host can sync `activeIndex`. */
  onActivate: (index: number) => void;
}

function renderOptionRow(
  row: Extract<ListboxRow, { kind: 'option' }>,
  config: ListboxRenderConfig,
): TemplateResult {
  const { option, index } = row;
  const selected = isOptionSelected(config.value, option.value);
  return html`
    <div
      id=${listboxOptionId(config.idPrefix, index)}
      class=${classMap({
        option: true,
        'option--selected': selected,
        'option--active': index === config.activeIndex,
        'option--disabled': !!option.disabled,
      })}
      role="option"
      aria-selected=${selected ? 'true' : 'false'}
      aria-disabled=${option.disabled ? 'true' : nothing}
      @mousedown=${(event: MouseEvent) => {
        // Keep focus on the trigger so typing continues uninterrupted.
        event.preventDefault();
        if (!option.disabled) config.onSelect(row);
      }}
      @mousemove=${() => {
        if (!option.disabled) config.onActivate(index);
      }}
    >
      ${option.icon && svgMap[option.icon as keyof typeof svgMap]
        ? html`<span class="option__icon" aria-hidden="true"
            >${unsafeSVG(svgMap[option.icon as keyof typeof svgMap])}</span
          >`
        : nothing}
      <span class="option__label">${option.label}</span>
      ${config.multiple ? html`<span class="option__checkbox" aria-hidden="true"></span>` : nothing}
    </div>
  `;
}

function renderCreateRow(
  row: Extract<ListboxRow, { kind: 'create' }>,
  config: ListboxRenderConfig,
): TemplateResult {
  return html`
    <div
      id=${listboxOptionId(config.idPrefix, row.index)}
      class=${classMap({
        option: true,
        'option--create': true,
        'option--active': row.index === config.activeIndex,
      })}
      role="option"
      aria-selected="false"
      @mousedown=${(event: MouseEvent) => {
        event.preventDefault();
        config.onSelect(row);
      }}
      @mousemove=${() => config.onActivate(row.index)}
    >
      <span class="option__icon" aria-hidden="true">${unsafeSVG(svgMap['icon-plus'])}</span>
      <span class="option__label"
        ><span class="option__create-prefix">${config.createLabel ?? 'Create'}</span
        >${` "${config.createValue ?? ''}"`}</span
      >
    </div>
  `;
}

/**
 * Renders the option list into the caller's shadow root.
 *
 * Deliberately a function rather than a custom element: `aria-activedescendant`
 * and `aria-controls` are id references, and id references do not resolve
 * across a shadow boundary. Rendering here keeps the trigger and the options in
 * one tree so those relationships hold.
 */
export function renderListbox(config: ListboxRenderConfig): TemplateResult {
  const rows = buildRows(config.items, config.createValue);
  const options = flattenOptions(config.items);
  // While results are still arriving there is nothing to create yet.
  const createRow = config.loading ? undefined : rows.find((row) => row.kind === 'create');

  let body: TemplateResult | TemplateResult[];
  if (config.loading) {
    body = html`
      <div class="listbox__message" role="presentation">
        <ui-loader data-size="small" label=${config.loadingLabel ?? 'Loading'}></ui-loader>
        <span>${config.loadingLabel ?? 'Loading...'}</span>
      </div>
    `;
  } else if (options.length === 0 && !createRow) {
    body = html`
      <div class="listbox__message" role="presentation">
        ${config.emptyLabel ?? 'No results found'}
      </div>
    `;
  } else if (config.items && isGroupedItems(config.items)) {
    let cursor = 0;
    body = config.items.map((group, groupIndex) => {
      const headerId = `${config.idPrefix}-group-${groupIndex}`;
      const groupRows = (group.options ?? []).map((_, i) => rows[cursor + i]);
      cursor += group.options?.length ?? 0;
      return html`
        <div class="listbox__group" role="group" aria-labelledby=${headerId}>
          <div class="listbox__group-header" id=${headerId} role="presentation">${group.label}</div>
          <div class="listbox__group-options">
            ${groupRows.map((row) =>
              row?.kind === 'option' ? renderOptionRow(row, config) : nothing,
            )}
          </div>
        </div>
      `;
    });
  } else {
    body = rows
      .filter((row): row is Extract<ListboxRow, { kind: 'option' }> => row.kind === 'option')
      .map((row) => renderOptionRow(row, config));
  }

  return html`
    <div
      id=${config.idPrefix}
      class=${classMap({
        listbox: true,
        'listbox--grouped': !!config.items && isGroupedItems(config.items),
        'listbox--multiple': !!config.multiple,
      })}
      role="listbox"
      aria-multiselectable=${config.multiple ? 'true' : nothing}
      aria-labelledby=${config.labelledBy ?? nothing}
      aria-label=${config.labelledBy ? nothing : (config.label ?? nothing)}
      tabindex="-1"
    >
      ${body} ${createRow ? renderCreateRow(createRow, config) : nothing}
    </div>
  `;
}

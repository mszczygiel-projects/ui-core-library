import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { IconPlus } from '@mszczygiel-projects/ui-core-icons/react';
import { Loader } from '../Loader/Loader.js';
import {
  buildRows,
  flattenOptions,
  isGroupedItems,
  isOptionSelected,
  listboxOptionId,
} from './listbox-navigation.js';
import type { ListboxItems, ListboxRow } from './listbox-navigation.js';
import './Listbox.css';

export type {
  ListboxOption,
  ListboxOptionGroup,
  ListboxItems,
  ListboxRow,
} from './listbox-navigation.js';

export type ListboxSize = 'small' | 'default' | 'large';

/**
 * Option list surface shared by SelectField and Combobox: options, sticky
 * group headers, empty and loading messages, multi-select check marks and the
 * create affordance.
 *
 * Presentational and fully controlled — it owns no state and does no
 * positioning. The consumer keeps `activeIndex`, handles keyboard navigation
 * with the helpers exported alongside this component, and wraps the list in a
 * `Popover` when it needs to float.
 *
 * @example
 * <Listbox
 *   idPrefix="season"
 *   items={[{ value: '2025', label: '2025/26' }]}
 *   value={value}
 *   activeIndex={activeIndex}
 *   onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
 * />
 */
export interface ListboxProps {
  /** Prefix for every generated DOM id; must be unique on the page. */
  idPrefix: string;
  /** Options to render, flat or grouped. */
  items: ListboxItems;
  /** Selected value, or values when `multiple` is set. */
  value?: string | string[];
  /**
   * Renders check marks and sets `aria-multiselectable`.
   * @default false
   */
  multiple?: boolean;
  /**
   * Index of the active row, as tracked by the consumer.
   * @default -1
   */
  activeIndex?: number;
  /**
   * Option height and typography scale.
   * @default 'default'
   */
  size?: ListboxSize;
  /** Replaces the list with a loading message. */
  loading?: boolean;
  /**
   * Text shown while `loading`.
   * @default 'Loading...'
   */
  loadingLabel?: string;
  /**
   * Text shown when there are no options and it is not loading.
   * @default 'No results found'
   */
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
  /** Called when the pointer moves over a row, so the consumer can sync `activeIndex`. */
  onActivate?: (index: number) => void;
  /** Extra class names on the list element. */
  className?: string;
  /** Inline styles forwarded to the list element. */
  style?: CSSProperties;
}

export function Listbox({
  idPrefix,
  items,
  value,
  multiple = false,
  activeIndex = -1,
  size = 'default',
  loading = false,
  loadingLabel = 'Loading...',
  emptyLabel = 'No results found',
  createLabel = 'Create',
  createValue,
  labelledBy,
  label,
  onSelect,
  onActivate,
  className,
  style,
}: ListboxProps) {
  const rows = buildRows(items, createValue);
  const options = flattenOptions(items);
  // While results are still arriving there is nothing to create yet.
  const createRow = loading ? undefined : rows.find((row) => row.kind === 'create');

  const renderOption = (row: Extract<ListboxRow, { kind: 'option' }>) => {
    const { option, index } = row;
    const selected = isOptionSelected(value, option.value);
    const classes = [
      'ui-listbox__option',
      selected && 'ui-listbox__option--selected',
      index === activeIndex && 'ui-listbox__option--active',
      option.disabled && 'ui-listbox__option--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={option.value || `option-${index}`}
        id={listboxOptionId(idPrefix, index)}
        className={classes}
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled || undefined}
        onMouseDown={(event: ReactMouseEvent) => {
          // Keep focus on the trigger so typing continues uninterrupted.
          event.preventDefault();
          if (!option.disabled) onSelect(row);
        }}
        onMouseMove={() => {
          if (!option.disabled) onActivate?.(index);
        }}
      >
        {option.icon && (
          <span className="ui-listbox__icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span className="ui-listbox__label">{option.label}</span>
        {multiple && <span className="ui-listbox__checkbox" aria-hidden="true" />}
      </div>
    );
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="ui-listbox__message" role="presentation">
        <Loader size="small" label={loadingLabel} />
        <span>{loadingLabel}</span>
      </div>
    );
  } else if (options.length === 0 && !createRow) {
    body = (
      <div className="ui-listbox__message" role="presentation">
        {emptyLabel}
      </div>
    );
  } else if (isGroupedItems(items)) {
    let cursor = 0;
    body = items.map((group, groupIndex) => {
      const headerId = `${idPrefix}-group-${groupIndex}`;
      const groupRows = (group.options ?? []).map((_, i) => rows[cursor + i]);
      cursor += group.options?.length ?? 0;
      return (
        <div key={headerId} className="ui-listbox__group" role="group" aria-labelledby={headerId}>
          <div className="ui-listbox__group-header" id={headerId} role="presentation">
            {group.label}
          </div>
          <div className="ui-listbox__group-options">
            {groupRows.map((row) => (row?.kind === 'option' ? renderOption(row) : null))}
          </div>
        </div>
      );
    });
  } else {
    body = rows
      .filter((row): row is Extract<ListboxRow, { kind: 'option' }> => row.kind === 'option')
      .map(renderOption);
  }

  return (
    <div
      id={idPrefix}
      className={[
        'ui-listbox',
        `ui-listbox--${size}`,
        // Grouped panels inset the options instead of the panel itself.
        isGroupedItems(items) && 'ui-listbox--grouped',
        // Multi-select shows selection through the checkbox, not the row surface.
        multiple && 'ui-listbox--multiple',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      tabIndex={-1}
    >
      {body}
      {createRow && (
        <div
          id={listboxOptionId(idPrefix, createRow.index)}
          className={[
            'ui-listbox__option',
            'ui-listbox__option--create',
            createRow.index === activeIndex && 'ui-listbox__option--active',
          ]
            .filter(Boolean)
            .join(' ')}
          role="option"
          aria-selected={false}
          onMouseDown={(event: ReactMouseEvent) => {
            event.preventDefault();
            onSelect(createRow);
          }}
          onMouseMove={() => onActivate?.(createRow.index)}
        >
          <span className="ui-listbox__icon" aria-hidden="true">
            <IconPlus />
          </span>
          <span className="ui-listbox__label">
            <span className="ui-listbox__create-prefix">{createLabel}</span>
            {` "${createValue ?? ''}"`}
          </span>
        </div>
      )}
    </div>
  );
}

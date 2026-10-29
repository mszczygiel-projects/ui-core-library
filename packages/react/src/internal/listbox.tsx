import { iconCheckmark } from '@mszczygiel-projects/ui-core-icons';
import type {
  ListboxItems,
  ListboxOption,
  ListboxSize,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import { isChosen, isGrouped } from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, ReactNode, Ref } from 'react';

import { classNames } from './class-names.ts';

/** The options of a React component carry their icon as a React node. */
export type ReactListboxItems = ListboxItems<ReactNode>;

/**
 * The class names of an element of a list: the shared element of the list family, which carries
 * the styles, and the element of the component, which names the part.
 */
export function listPart(block: string, element: string): string {
  return `ui-list__${element} ui-${block}__${element}`;
}

/** The id of the option at `index`, which `aria-activedescendant` names. */
export function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${String(index)}`;
}

export interface ListboxViewProps {
  /** The block of the component, such as `select-field`. */
  readonly block: string;
  /** The id of the element with the role listbox. */
  readonly id: string;
  readonly items: ReactListboxItems;
  readonly value: ListboxValue;
  readonly multiple: boolean;
  readonly size: ListboxSize;
  /** The index of the highlighted option among all options, or -1. */
  readonly highlighted: number;
  readonly emptyLabel: string;
  readonly labelledBy?: string;
  readonly ariaLabel?: string;
  readonly describedBy?: string;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  /**
   * Whether the list itself takes the focus, as a standalone list does. A list in a popup leaves
   * the focus on its field, which names the highlighted option instead.
   */
  readonly focusable: boolean;
  /** Receives the element with the role listbox. */
  readonly ref?: Ref<HTMLDivElement>;
  /** The native attributes of the author, which the element with the role listbox receives. */
  readonly attributes?: Readonly<Record<string, unknown>>;
  readonly onChoose: (index: number, event: MouseEvent) => void;
  readonly onHighlight: (index: number) => void;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  readonly onFocus?: (event: FocusEvent<HTMLDivElement>) => void;
}

/** The index of the enabled option under a pointer event, from its data attribute. */
function enabledOptionAt(event: MouseEvent | PointerEvent): number | undefined {
  const target = event.target;
  const option = target instanceof Element ? target.closest('[role="option"]') : null;
  if (option === null || option.getAttribute('aria-disabled') === 'true') {
    return undefined;
  }
  const index = Number(option.getAttribute('data-index'));
  return Number.isInteger(index) ? index : undefined;
}

/**
 * The anatomy of every list of options: groups with their headings, options with an icon, a label
 * and a mark, and the message of an empty list. The list takes the presses of the pointer for its
 * options, which a list with `aria-activedescendant` never focuses.
 */
export function ListboxView({
  block,
  id,
  items,
  value,
  multiple,
  size,
  highlighted,
  emptyLabel,
  labelledBy,
  ariaLabel,
  describedBy,
  invalid,
  required,
  disabled,
  focusable,
  ref,
  attributes,
  onChoose,
  onHighlight,
  onKeyDown,
  onFocus,
}: ListboxViewProps) {
  let index = 0;
  const optionOf = (option: ListboxOption<ReactNode>) => {
    const at = index++;
    const chosen = isChosen(value, option.value);
    const inactive = option.disabled === true || disabled === true;
    return (
      <div
        key={at}
        id={optionId(id, at)}
        data-index={at}
        className={classNames(
          listPart(block, 'option'),
          at === highlighted && 'ui-list__option--highlighted',
          chosen && 'ui-list__option--selected',
          inactive && 'ui-list__option--disabled',
        )}
        role="option"
        aria-selected={chosen}
        aria-disabled={inactive || undefined}
      >
        {option.icon === undefined ? null : (
          <span className={listPart(block, 'option-icon')} aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span className={listPart(block, 'option-label')}>{option.label}</span>
        <span
          className={listPart(block, 'option-mark')}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: iconCheckmark }}
        />
      </div>
    );
  };
  let content: ReactNode;
  if (isGrouped(items)) {
    content = items.map((group, groupIndex) => {
      const labelId = `${id}-group-${String(groupIndex)}`;
      const labelled = group.label !== undefined && group.label !== '';
      return (
        <div
          key={labelId}
          className={listPart(block, 'group')}
          role="group"
          aria-labelledby={labelled ? labelId : undefined}
        >
          {labelled ? (
            <div id={labelId} className={listPart(block, 'group-label')} role="presentation">
              {group.label}
            </div>
          ) : groupIndex > 0 ? (
            <div className="ui-list__separator" role="presentation" />
          ) : null}
          {group.options.map(optionOf)}
        </div>
      );
    });
  } else {
    content = items.map(optionOf);
  }
  const empty = index === 0;
  return (
    <div
      {...attributes}
      id={id}
      ref={ref}
      className={classNames(
        listPart(block, 'listbox'),
        `ui-list__listbox--${size}`,
        multiple && 'ui-list__listbox--multiple',
      )}
      role="listbox"
      tabIndex={focusable ? (disabled === true ? -1 : 0) : -1}
      aria-multiselectable={multiple || undefined}
      aria-labelledby={labelledBy}
      aria-label={labelledBy === undefined ? ariaLabel : undefined}
      aria-describedby={describedBy}
      aria-invalid={invalid === true || undefined}
      aria-required={required === true || undefined}
      aria-disabled={disabled === true || undefined}
      aria-activedescendant={focusable && highlighted >= 0 ? optionId(id, highlighted) : undefined}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      // The pointer keeps the focus where it is, on the field or on the list.
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={(event) => {
        const at = enabledOptionAt(event);
        if (at !== undefined) {
          onChoose(at, event);
        }
      }}
      onPointerMove={(event) => {
        const at = enabledOptionAt(event);
        if (at !== undefined && at !== highlighted) {
          onHighlight(at);
        }
      }}
    >
      {empty ? (
        <div className={listPart(block, 'message')} role="presentation">
          {emptyLabel}
        </div>
      ) : (
        content
      )}
    </div>
  );
}

/**
 * The hidden native select of a list, which gives the form one entry for each chosen option, an
 * empty one for a single choice without an option, and the native validation of `required`.
 */
export function NativeSelect({
  ref,
  name,
  form,
  multiple,
  required,
  disabled,
  values,
  onInvalid,
}: {
  readonly ref: Ref<HTMLSelectElement>;
  readonly name?: string;
  readonly form?: string;
  readonly multiple: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  /** The chosen values that an option holds. */
  readonly values: readonly string[];
  readonly onInvalid: () => void;
}) {
  return (
    <select
      ref={ref}
      className="ui-list__native"
      hidden
      aria-hidden="true"
      tabIndex={-1}
      name={name}
      form={form}
      multiple={multiple}
      required={required}
      disabled={disabled}
      value={multiple ? [...values] : (values[0] ?? '')}
      onChange={() => undefined}
      onInvalid={onInvalid}
    >
      {multiple ? null : <option value="" />}
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </select>
  );
}

import { iconCheckmark } from '@mszczygiel-projects/ui-core-icons';
import type {
  ListboxItems,
  ListboxOption,
  ListboxSize,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import { isChosen, isGrouped } from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { h, type VNode } from '@stencil/core';

/** The options of a web component carry their icon as the SVG string of the icon package. */
export type WebListboxItems = ListboxItems<string>;

/** The id of the option at `index`, which `aria-activedescendant` names. */
export function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${String(index)}`;
}

export interface ListboxViewProps {
  /** The id of the element with the role listbox. */
  readonly id: string;
  readonly items: WebListboxItems;
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
  readonly onChoose: (index: number, event: MouseEvent) => void;
  readonly onHighlight: (index: number) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onFocus?: (event: FocusEvent) => void;
}

/**
 * The anatomy of every list of options: groups with their headings, options with an icon, a label
 * and a mark, and the message of an empty list. It renders into the shadow root of its component,
 * since `aria-activedescendant` and `aria-controls` name elements of their own tree.
 */
export function ListboxView(props: ListboxViewProps): VNode {
  const options: VNode[] = [];
  let index = 0;
  const optionOf = (option: ListboxOption<string>): VNode => {
    const at = index++;
    return <ListboxOptionView option={option} index={at} {...props} />;
  };
  if (isGrouped(props.items)) {
    props.items.forEach((group, groupIndex) => {
      const labelId = `${props.id}-group-${String(groupIndex)}`;
      const labelled = group.label !== undefined && group.label !== '';
      options.push(
        <div
          part="group"
          class="group"
          role="group"
          aria-labelledby={labelled ? labelId : undefined}
        >
          {labelled ? (
            <div id={labelId} part="group-label" class="group-label" role="presentation">
              {group.label}
            </div>
          ) : groupIndex > 0 ? (
            <div class="separator" role="presentation" />
          ) : null}
          {group.options.map(optionOf)}
        </div>,
      );
    });
  } else {
    options.push(...props.items.map(optionOf));
  }
  const empty = index === 0;
  return (
    <div
      id={props.id}
      part="listbox"
      class={`listbox ${props.size}${props.multiple ? ' multiple' : ''}`}
      role="listbox"
      tabIndex={props.focusable ? (props.disabled === true ? -1 : 0) : -1}
      aria-multiselectable={props.multiple ? 'true' : undefined}
      aria-labelledby={props.labelledBy}
      aria-label={props.labelledBy === undefined ? props.ariaLabel : undefined}
      aria-describedby={props.describedBy}
      aria-invalid={props.invalid === true ? 'true' : undefined}
      aria-required={props.required === true ? 'true' : undefined}
      aria-disabled={props.disabled === true ? 'true' : undefined}
      aria-activedescendant={
        props.focusable && props.highlighted >= 0
          ? optionId(props.id, props.highlighted)
          : undefined
      }
      onKeyDown={props.onKeyDown}
      onFocus={props.onFocus}
    >
      {empty ? (
        <div part="message" class="message" role="presentation">
          {props.emptyLabel}
        </div>
      ) : (
        options
      )}
    </div>
  );
}

interface ListboxOptionViewProps extends ListboxViewProps {
  readonly option: ListboxOption<string>;
  readonly index: number;
}

function ListboxOptionView(props: ListboxOptionViewProps): VNode {
  const { option, index } = props;
  const chosen = isChosen(props.value, option.value);
  const disabled = option.disabled === true || props.disabled === true;
  const classes = [
    'option',
    index === props.highlighted ? 'highlighted' : '',
    chosen ? 'selected' : '',
    disabled ? 'disabled' : '',
  ]
    .filter((name) => name !== '')
    .join(' ');
  return (
    <div
      id={optionId(props.id, index)}
      part="option"
      class={classes}
      role="option"
      aria-selected={chosen ? 'true' : 'false'}
      aria-disabled={disabled ? 'true' : undefined}
      // The pointer keeps the focus where it is, on the field or on the list.
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
      }}
      onClick={(event: MouseEvent) => {
        if (!disabled) {
          props.onChoose(index, event);
        }
      }}
      onPointerMove={() => {
        if (!disabled && index !== props.highlighted) {
          props.onHighlight(index);
        }
      }}
    >
      {option.icon === undefined ? null : (
        <span part="option-icon" class="option-icon" aria-hidden="true" innerHTML={option.icon} />
      )}
      <span part="option-label" class="option-label">
        {option.label}
      </span>
      <span part="option-mark" class="option-mark" aria-hidden="true" innerHTML={iconCheckmark} />
    </div>
  );
}

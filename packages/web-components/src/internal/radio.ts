/** What a group tells each of its options to render. */
export interface RadioOptionState {
  readonly checked: boolean;
  /** Whether the option is the one stop of the group in the order of the Tab key. */
  readonly tabbable: boolean;
  readonly required: boolean;
  /** Disabled by the group or by its fieldset. */
  readonly groupDisabled: boolean;
  readonly error: boolean;
  /** The position of the option in the group and the number of options, from 1. */
  readonly position: number;
  readonly count: number;
}

/** What an option gives its group. */
export interface RadioOption {
  readonly element: HTMLElement;
  value(): string;
  /** Disabled by its own prop. */
  disabled(): boolean;
  /** The rendered native radio button, or null before the first render. */
  input(): HTMLInputElement | null;
  update(state: RadioOptionState): void;
}

/** What a group gives its options. */
export interface RadioGroupChannel {
  /** An option joined or left the group, or changed its value or disabled state. */
  optionsChanged(): void;
  /** A user chose the option, with the native change event of its radio button. */
  choose(option: RadioOption, event: Event): void;
}

/**
 * The private channel between ui-radio-group and its ui-radio-field options. It lives in neither
 * public API: an option finds its group by the closest ancestor, and a group finds its options
 * among its descendants.
 */
const groups = new WeakMap<Element, RadioGroupChannel>();
const options = new WeakMap<Element, RadioOption>();

export function registerRadioGroup(element: Element, channel: RadioGroupChannel): void {
  groups.set(element, channel);
}

export function radioGroupOf(element: Element): RadioGroupChannel | undefined {
  const group = element.parentElement?.closest('ui-radio-group');
  return group === null || group === undefined ? undefined : groups.get(group);
}

export function registerRadioOption(option: RadioOption): void {
  options.set(option.element, option);
}

/** The upgraded options among the descendants of a group, in document order. */
export function radioOptionsOf(group: Element): RadioOption[] {
  return Array.from(group.querySelectorAll('ui-radio-field')).flatMap((element) => {
    const option = options.get(element);
    // An option of a nested group belongs to that group.
    return option !== undefined && element.parentElement?.closest('ui-radio-group') === group
      ? [option]
      : [];
  });
}

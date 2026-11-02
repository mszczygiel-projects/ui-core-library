import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  chip,
  type ChipProps,
  type ChipSize,
  type ChipVariant,
} from '@mszczygiel-projects/ui-core-shared/chip';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import type { ChipDismiss, ChipSelectedChange } from './events.ts';

const { options } = chip;

declare global {
  interface HTMLElementEventMap {
    'ui-selected-change': CustomEvent<ChipSelectedChange>;
    'ui-dismiss': CustomEvent<ChipDismiss>;
  }
}

/**
 * A compact choice that a user turns on and off, or a chosen value that a user removes.
 *
 * A selectable chip is a toggle button. Its `selected` attribute is the initial state and its
 * property the current one, as `checked` is for a checkbox; a click or Space toggles it and
 * dispatches `ui-selected-change`. A chip that is not selectable shows static text. A dismissible
 * chip adds a button named by the dismiss label and the text of the chip; it, Delete and
 * Backspace dispatch `ui-dismiss`, and the page removes the chip. The host reflects only
 * `disabled`. The host is form-associated only to follow a disabled fieldset; it submits nothing.
 * An `aria-label` that the page writes on the host names the chip instead of its text.
 *
 * @slot - The text of the chip.
 * @slot icon - A decorative icon before the text.
 * @part base - The surface of the chip, its fill, border and corners.
 * @part control - The toggle button of a selectable chip, or the static content of another.
 * @part icon - The box that sizes the icon.
 * @part label - The text of the chip.
 * @part dismiss - The button that asks to remove the chip.
 */
@Component({
  tag: 'ui-chip',
  styleUrl: 'chip.css',
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiChip implements ChipProps {
  @Element() host!: HTMLUiChipElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface of the chip. */
  @Prop() variant: ChipVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: ChipSize = 'medium';

  /** Makes the chip a toggle button that a user turns on and off. */
  @Prop() selectable = false;

  /**
   * Whether a selectable chip is on. The attribute sets the initial state; the property holds the
   * current one, which a user changes.
   */
  @Prop({ mutable: true }) selected = false;

  /** Disables the toggle and removes the dismiss button. */
  @Prop({ reflect: true }) disabled = false;

  /** Shows a button that asks to remove the chip. */
  @Prop() dismissible = false;

  /**
   * The word that names the dismiss button before the text of the chip, falling back to
   * `labels.chip.dismiss`.
   */
  @Prop() dismissLabel?: string;

  /**
   * Takes the dismiss button out of the Tab order, for a component that removes its chips with
   * keys of its own. A pointer and assistive technology still reach it.
   */
  @Prop() skipDismissInTabOrder = false;

  /** The user turned a selectable chip on or off. */
  @Event({ eventName: 'ui-selected-change' }) selectedChange!: EventEmitter<ChipSelectedChange>;

  /** The user asked to remove the chip, with its dismiss button, Delete or Backspace. */
  @Event({ eventName: 'ui-dismiss' }) dismiss!: EventEmitter<ChipDismiss>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  @State() private hasIcon = false;

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  private stopFollowing: (() => void)[] = [];

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  render(): VNode {
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const disabled = this.isDisabled();
    const selected = this.selectable && this.selected;
    const dismissible = this.dismissible && !disabled;
    const named = this.authorLabel !== null && this.authorLabel !== '';
    const classes = [
      'base',
      variant,
      size,
      // A disabled chip shows its disabled state over its selection.
      selected && !disabled && 'selected',
      disabled && 'disabled',
      dismissible && 'dismissible',
    ].filter(Boolean);
    const content = [
      <span part="icon" class="icon" aria-hidden="true" hidden={!this.hasIcon}>
        <slot name="icon" onSlotchange={this.onIconSlotChange} />
      </span>,
      <span id="label" part="label" class="label">
        <slot />
      </span>,
    ];
    return (
      <span part="base" class={classes.join(' ')}>
        {this.selectable ? (
          <button
            id="control"
            part="control"
            class="control"
            type="button"
            disabled={disabled}
            aria-pressed={selected ? 'true' : 'false'}
            aria-label={named ? (this.authorLabel ?? undefined) : undefined}
            aria-labelledby={named ? undefined : 'label'}
            onClick={this.onToggle}
            onKeyDown={this.onKeyDown}
          >
            {content}
          </button>
        ) : (
          <span
            id="control"
            part="control"
            class="control"
            aria-label={named ? (this.authorLabel ?? undefined) : undefined}
          >
            {content}
          </span>
        )}
        {dismissible && (
          <button
            part="dismiss"
            class="dismiss"
            type="button"
            tabIndex={this.skipDismissInTabOrder ? -1 : undefined}
            aria-labelledby={`dismiss-label ${named ? 'control' : 'label'}`}
            onClick={this.onDismiss}
            onKeyDown={this.onKeyDown}
          >
            <span id="dismiss-label" hidden>
              {this.dismissLabel ?? this.config.labels.chip.dismiss}
            </span>
            <span class="dismiss-icon" aria-hidden="true" innerHTML={iconClose} />
          </button>
        )}
      </span>
    );
  }

  private readonly onIconSlotChange = (event: Event): void => {
    this.hasIcon = hasAssignedContent(event);
  };

  private readonly onToggle = (event: MouseEvent): void => {
    this.selected = !this.selected;
    this.selectedChange.emit({ value: this.selected, originalEvent: event });
  };

  private readonly onDismiss = (event: MouseEvent): void => {
    // The dismiss button acts on its own, so a listener of clicks on the chip never sees it.
    event.stopPropagation();
    this.dismiss.emit({ originalEvent: event });
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      this.dismissible &&
      !this.isDisabled()
    ) {
      event.preventDefault();
      this.dismiss.emit({ originalEvent: event });
    }
  };

  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiChip, keyof ChipProps>;

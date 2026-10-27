import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Chip. */
export const chip = defineComponent({
  name: 'Chip',
  tag: 'ui-chip',
  category: 'Selection',
  status: 'in-progress',
  figma: '2068:2859',
  design: {
    flags: ['selected', 'disabled'],
    booleans: ['dismissible'],
    codeOnly: ['selectable'],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
    },
  },
  summary: 'A compact choice that a user turns on and off, or a chosen value that a user removes.',
  options: {
    variant: { options: ['outline', 'subtle'], default: 'outline' },
    size: { options: ['small', 'medium'], default: 'medium' },
  },
  labels: ['dismiss'],
  parts: ['base', 'control', 'icon', 'label', 'dismiss'],
  slots: ['icon'],
  events: ['ui-selected-change', 'ui-dismiss'],
  stories: ['Playground', 'Variants', 'Selectable', 'Dismissible', 'OnSurfaces'],
  exceptions: [
    {
      items: ['defaultSelected'],
      reason:
        'React uses defaultSelected for an uncontrolled initial state. The web component uses its selected attribute for that, and its property for the current state, as a native checkbox does with checked.',
    },
  ],
});

/** The surface of a chip: a border on the page, or a quiet fill. */
export type ChipVariant = OptionOf<typeof chip, 'variant'>;
/** The sizes of a chip, each following the density. */
export type ChipSize = OptionOf<typeof chip, 'size'>;

/**
 * What accompanies a change of the selected state: the native event that caused it. The package
 * knows no browser types, so each implementation names the type of the event.
 */
export interface ChipSelectedChangeDetails<OriginalEvent> {
  /** The click or key event that toggled the chip. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-selected-change`: the new state and the native event that caused it. */
export interface ChipSelectedChangeDetail<
  OriginalEvent,
> extends ChipSelectedChangeDetails<OriginalEvent> {
  /** Whether the chip is now selected. */
  readonly value: boolean;
}

/** The detail of `ui-dismiss`: the native event that asked to remove the chip. */
export interface ChipDismissDetail<OriginalEvent> {
  /** The click on the dismiss button, or the Delete or Backspace key. */
  readonly originalEvent: OriginalEvent;
}

/** The props both implementations of Chip share. */
export interface ChipProps {
  /**
   * The surface of the chip.
   * @default 'outline'
   */
  variant?: ChipVariant;
  /**
   * The size, which follows the density.
   * @default 'medium'
   */
  size?: ChipSize;
  /**
   * Makes the chip a toggle button that a user turns on and off. Without it, the text is static
   * and only the dismiss button is interactive.
   * @default false
   */
  selectable?: boolean;
  /**
   * Whether a selectable chip is on. It has no effect on a chip that is not selectable.
   * @default false
   */
  selected?: boolean;
  /**
   * Disables the toggle and removes the dismiss button.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows a button that asks to remove the chip. The chip only reports the request; the page
   * removes it.
   * @default false
   */
  dismissible?: boolean;
  /**
   * The word that names the dismiss button before the text of the chip, falling back to
   * `labels.chip.dismiss`.
   */
  dismissLabel?: string;
}

import { defineComponent, type OptionOf } from './component.ts';

/** The sides on which a popup beside its trigger opens. */
export const popupPlacements = ['bottom', 'top', 'start', 'end'] as const;

/** The specification of Popover. */
export const popover = defineComponent({
  name: 'Popover',
  tag: 'ui-popover',
  category: 'Overlays',
  status: 'done',
  figma: '2090:2086',
  design: {
    flags: ['open', 'showArrow'],
    booleans: [],
    codeOnly: ['placement', 'label'],
    previews: {},
  },
  summary:
    'A panel that a button opens beside it, over the page, with content that the page around it can still be used with.',
  options: {
    placement: { options: popupPlacements, default: 'bottom' },
  },
  labels: [],
  parts: ['base', 'panel', 'arrow'],
  slots: ['trigger'],
  events: ['ui-open-change'],
  stories: ['Playground', 'Placements', 'WithForm', 'OnSurfaces'],
  exceptions: [
    {
      items: ['placement'],
      reason:
        'A popup beside its trigger also opens above it, so placement adds top to the edges of the vocabulary. start and end follow the direction of the text.',
    },
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'The web component dispatches the event before it opens or closes, and an author may cancel it, for example to keep a form with unsaved changes open. React keeps a controlled popover as it is instead.',
    },
    {
      items: ['trigger'],
      reason:
        'The popover writes aria-expanded and aria-haspopup on the element of its trigger slot, which the page gives it, so that the button announces the panel it opens.',
    },
  ],
});

/** The side on which a popup opens beside its trigger. */
export type PopupPlacement = (typeof popupPlacements)[number];

/** The side on which a popover opens. */
export type PopoverPlacement = OptionOf<typeof popover, 'placement'>;

/**
 * What opened or closed a popover: a press on its trigger, Escape, a press outside it and its
 * trigger, or the focus leaving both.
 */
export type PopoverOpenChangeReason = 'trigger' | 'escape' | 'outside' | 'focus-out';

/**
 * What accompanies a popover that opens or closes at the request of the user. The package knows
 * no browser types, so each implementation names the type of the event.
 */
export interface PopoverOpenChangeDetails<OriginalEvent> {
  readonly reason: PopoverOpenChangeReason;
  /** The pointer, key or focus event that asked the popover to open or close. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: the new state and what asked for it. */
export interface PopoverOpenChangeDetail<
  OriginalEvent,
> extends PopoverOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/** The props both implementations of Popover share. */
export interface PopoverProps {
  /**
   * Whether the panel is open. A press on the trigger opens and closes it, and Escape, a press
   * outside and the focus leaving close it.
   * @default false
   */
  open?: boolean;
  /**
   * The side of the trigger on which the panel opens. It opens on the opposite side when the
   * window has no room, and stays inside the window.
   * @default 'bottom'
   */
  placement?: PopoverPlacement;
  /**
   * Shows an arrow that points at the middle of the trigger.
   * @default false
   */
  showArrow?: boolean;
  /** The accessible name of the panel, which nothing visible gives. */
  label?: string;
}

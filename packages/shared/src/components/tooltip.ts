import { defineComponent, type OptionOf } from './component.ts';
import { popupPlacements } from './popover.ts';

/** The specification of Tooltip. */
export const tooltip = defineComponent({
  name: 'Tooltip',
  tag: 'ui-tooltip',
  category: 'Overlays',
  status: 'in-progress',
  figma: '3168:47',
  design: { flags: ['showArrow'], booleans: [], codeOnly: ['placement'], previews: {} },
  summary:
    'A short text that names or describes an element while the pointer rests on it or the keyboard focuses it.',
  options: {
    placement: { options: popupPlacements, default: 'top' },
  },
  labels: [],
  parts: ['base', 'bubble', 'arrow'],
  slots: [],
  events: [],
  stories: ['Playground', 'Placements', 'OnSurfaces'],
  exceptions: [
    {
      items: ['placement'],
      reason:
        'A tooltip opens above its trigger by default, and placement adds top to the edges of the vocabulary. start and end follow the direction of the text.',
    },
    {
      items: ['content'],
      reason:
        'The text of a tooltip is plain text, so it is a prop. Content with links or buttons belongs in a Popover, which a user can reach.',
    },
    {
      items: ['ariaDescribedByElements'],
      reason:
        'The web component writes its text into an element of its own light DOM, slotted into the bubble, and gives it to ariaDescribedByElements of its trigger, since an element reference cannot reach into its shadow root. It writes nothing else on the trigger or the host.',
    },
  ],
});

/** The side on which a tooltip opens. */
export type TooltipPlacement = OptionOf<typeof tooltip, 'placement'>;

/** The props both implementations of Tooltip share. */
export interface TooltipProps {
  /** The text of the tooltip, which describes its trigger. */
  content?: string;
  /**
   * The side of the trigger on which the tooltip opens. It opens on the opposite side when the
   * window has no room, and stays inside the window.
   * @default 'top'
   */
  placement?: TooltipPlacement;
  /**
   * Shows an arrow that points at the middle of the trigger.
   * @default false
   */
  showArrow?: boolean;
}

import { defineComponent, type OptionOf } from './component.ts';
import type { OverlayProps } from './dialog.ts';

/** The specification of Drawer. */
export const drawer = defineComponent({
  name: 'Drawer',
  tag: 'ui-drawer',
  category: 'Overlays',
  status: 'done',
  figma: '2381:2696',
  design: {
    flags: ['hideCloseButton'],
    booleans: ['dragToDismiss'],
    codeOnly: ['open', 'label', 'closeLabel'],
    previews: {},
  },
  summary:
    'A modal panel at an edge of the window that holds secondary content, such as filters, navigation or details.',
  options: {
    placement: { options: ['start', 'end', 'bottom'], default: 'end' },
  },
  labels: ['close'],
  parts: ['base', 'grabber', 'header', 'close', 'body'],
  slots: [],
  events: ['ui-open-change'],
  stories: ['Playground', 'Placements', 'WithForm', 'Draggable', 'OnSurfaces'],
  exceptions: [
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'A modal closes on its own at the request of the user, so the web component dispatches the event before it closes, and an author may cancel it, for example to keep a form with unsaved changes. React keeps a controlled drawer open instead.',
    },
    {
      items: ['aria-labelledby'],
      reason:
        'Nothing visible names a drawer, so label is required. React may name it from a heading of the content with aria-labelledby instead; a reference by id cannot cross the shadow root of the web component.',
    },
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason: 'A drawer holds form controls but is none, so it is not form-associated.',
    },
  ],
});

/** The edge of the window that a drawer sits at: the start or the end of a line, or the bottom. */
export type DrawerPlacement = OptionOf<typeof drawer, 'placement'>;

/** The props both implementations of Drawer share. */
export interface DrawerProps extends OverlayProps {
  /**
   * The edge the drawer sits at. `start` and `end` follow the direction of the text, and span the
   * height of the window; `bottom` takes the height of its content.
   * @default 'end'
   */
  placement?: DrawerPlacement;
  /** The accessible name of the drawer, which nothing visible gives it. */
  label?: string;
}

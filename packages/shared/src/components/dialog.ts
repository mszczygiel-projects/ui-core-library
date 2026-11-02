import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Dialog. */
export const dialog = defineComponent({
  name: 'Dialog',
  tag: 'ui-dialog',
  category: 'Overlays',
  status: 'in-progress',
  figma: '2216:3109',
  design: {
    flags: ['hideCloseButton'],
    booleans: [],
    codeOnly: ['open', 'alert', 'label', 'closeLabel', 'dragToDismiss'],
    previews: {
      hasDescription: {
        options: ['true', 'false'],
        default: 'true',
        note: 'Shows or hides the description below the heading. Code shows it when the dialog has a description.',
      },
      hasFooter: {
        options: ['true', 'false'],
        default: 'true',
        note: 'Shows or hides the row of actions. Code shows it when the footer slot has content.',
      },
    },
  },
  summary:
    'A modal window over the page that asks the user to read, decide or enter something before going on.',
  options: {
    size: { options: ['small', 'medium', 'large', 'fullscreen'], default: 'medium' },
  },
  labels: ['close'],
  parts: ['base', 'grabber', 'header', 'heading', 'description', 'close', 'body', 'footer'],
  slots: ['footer'],
  events: ['ui-open-change'],
  stories: ['Playground', 'Sizes', 'Alert', 'WithForm', 'Draggable', 'OnSurfaces'],
  exceptions: [
    {
      items: ['size'],
      reason:
        'Besides the three sizes of the vocabulary, fullscreen fills the window. The size of a dialog is the width of its window, not a density, so it is one prop.',
    },
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'A modal closes on its own at the request of the user, so the web component dispatches the event before it closes, and an author may cancel it, for example to keep a form with unsaved changes. React keeps a controlled dialog open instead.',
    },
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason: 'A dialog holds form controls but is none, so it is not form-associated.',
    },
  ],
});

/** The width of a dialog: three widths, or the whole window. */
export type DialogSize = OptionOf<typeof dialog, 'size'>;

/**
 * Why a modal closed: Escape or another close request of the platform, a press on the backdrop,
 * its close button, a drag down, or a form with `method="dialog"` inside it.
 */
export type OverlayCloseReason = 'escape' | 'backdrop' | 'close-button' | 'drag' | 'form';

/**
 * What accompanies a modal that closes at the request of the user. The package knows no browser
 * types, so each implementation names the type of the event.
 */
export interface OverlayOpenChangeDetails<OriginalEvent> {
  /** What asked the modal to close. */
  readonly reason: OverlayCloseReason;
  /**
   * The value of the submit button of a form with `method="dialog"`, which the native dialog keeps
   * as its return value. Any other reason has the empty string.
   */
  readonly returnValue: string;
  /** The key, pointer or submit event that asked the modal to close. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: the new state, always false, and what asked for it. */
export interface OverlayOpenChangeDetail<
  OriginalEvent,
> extends OverlayOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/** The props that Dialog and Drawer share in both implementations. */
export interface OverlayProps {
  /**
   * Whether the modal is open. Only the author opens it; it closes on its own at the request of
   * the user, and reports why.
   * @default false
   */
  open?: boolean;
  /**
   * Hides the close button. Escape, the backdrop and the actions of the content still close it.
   * @default false
   */
  hideCloseButton?: boolean;
  /** The name of the close button, falling back to `labels.<component>.close`. */
  closeLabel?: string;
  /**
   * Lets a user drag the panel down to close it, from its handle, when it sits at the bottom of
   * the window. The other ways to close it stay.
   * @default false
   */
  dragToDismiss?: boolean;
}

/** The props both implementations of Dialog share. */
export interface DialogProps extends OverlayProps {
  /**
   * The width of the window. Below the breakpoint, the dialog rises from the bottom of the window
   * as a sheet, at its full width.
   * @default 'medium'
   */
  size?: DialogSize;
  /**
   * Makes the dialog an alert dialog, which interrupts the user with an urgent question. A press
   * on the backdrop does not close it.
   * @default false
   */
  alert?: boolean;
  /** The heading, which names the dialog. */
  heading?: string;
  /** The text below the heading, which describes the dialog. */
  description?: string;
  /** The accessible name of a dialog without a heading. */
  label?: string;
}

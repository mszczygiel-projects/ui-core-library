import type { OverlayCloseReason } from '@mszczygiel-projects/ui-core-shared/dialog';
import {
  dragOffset,
  type DragState,
  moveDrag,
  shouldDismissDrag,
  startDrag,
} from '@mszczygiel-projects/ui-core-shared/drag-dismiss';

import { lockPage, unlockPage } from './scroll-lock.ts';

/** What a modal gives the controller of its native dialog. */
export interface OverlayOptions {
  /** The native dialog, in the shadow root of the modal. */
  readonly dialog: () => HTMLDialogElement | null;
  /** The elements of the content, in order, whose first focusable element takes the focus. */
  readonly content: () => readonly Element[];
  /** Whether a press on the backdrop closes the modal. */
  readonly closesOnBackdrop: () => boolean;
  /** The elements a drag down starts from, or none while the modal cannot be dragged. */
  readonly dragHandles: () => readonly Element[];
  /** Elements inside a handle that a press activates instead of dragging, such as the close button. */
  readonly dragExcluded: () => readonly Element[];
  /**
   * The user asked the modal to close. It returns whether the modal closes, which an author may
   * refuse unless `forced`: the browser closed the native dialog already.
   */
  readonly onCloseRequest: (request: CloseRequest) => boolean;
  /** Whether the panel follows a drag, to switch off its transition meanwhile. */
  readonly onDragging: (dragging: boolean) => void;
}

/** A request of the user to close a modal. */
export interface CloseRequest {
  readonly reason: OverlayCloseReason;
  readonly returnValue: string;
  readonly originalEvent: Event;
  /** The browser closed the native dialog itself, so the request cannot be refused. */
  readonly forced: boolean;
}

/** The selector of the element that the author marks to take the focus when a modal opens. */
const AUTOFOCUS = '[autofocus], [data-autofocus]';

/**
 * A modal on a native dialog, opened with `showModal()`: in the top layer, with the rest of the
 * page inert. It turns Escape, a press on the backdrop, a form with `method="dialog"` and a drag
 * down into requests to close, which the modal may refuse, locks the scroll of the page while it
 * is open, and gives the focus to the content. Closing returns the focus where it was.
 */
export class Overlay {
  private events?: AbortController;

  private pressedBackdrop = false;

  /** The path of the latest click, which names a custom submit button. */
  private pressed: readonly EventTarget[] = [];

  private drag?: { readonly pointerId: number; state: DragState };

  private readonly options: OverlayOptions;

  constructor(options: OverlayOptions) {
    this.options = options;
  }

  get open(): boolean {
    return this.events !== undefined;
  }

  show(): void {
    const dialog = this.options.dialog();
    if (this.open || !dialog?.isConnected) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    lockPage(this);
    this.events = new AbortController();
    const { signal } = this.events;
    // Escape is a request; the browser fires `cancel` without closing when the request is refused.
    dialog.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault();
        this.request('escape', event);
      },
      { signal },
    );
    // The browser closes a dialog itself when a page refuses Escape too often without a gesture.
    dialog.addEventListener(
      'close',
      (event) => {
        // The event of an earlier closing can arrive after the dialog opened again.
        if (dialog.open) {
          return;
        }
        this.options.onCloseRequest({
          reason: 'escape',
          returnValue: dialog.returnValue,
          originalEvent: event,
          forced: true,
        });
      },
      { signal },
    );
    // The root of the dialog hears a submission after the handlers of the page between, React's
    // delegated `onSubmit` included, so that they can still cancel it.
    dialog.getRootNode().addEventListener('submit', this.onSubmit, { signal });
    dialog.addEventListener('pointerdown', this.onPointerDown, { signal });
    dialog.addEventListener('pointermove', this.onPointerMove, { signal });
    dialog.addEventListener('pointerup', this.onPointerUp, { signal });
    dialog.addEventListener('pointercancel', this.onPointerCancel, { signal });
    dialog.addEventListener(
      'click',
      (event) => {
        // A custom button may submit after the click has passed, within the same task.
        this.pressed = event.composedPath();
        setTimeout(() => {
          this.pressed = [];
        });
      },
      { signal, capture: true },
    );
    dialog.addEventListener('click', this.onClick, { signal });
    this.focusContent(dialog);
  }

  hide(returnValue = ''): void {
    const dialog = this.options.dialog();
    this.events?.abort();
    this.events = undefined;
    this.endDrag(dialog);
    // A dialog that leaves the page closes without a `close` event, and restores no focus.
    if (dialog?.open === true) {
      dialog.close(returnValue);
    }
    unlockPage(this);
  }

  /**
   * The element the author marked, else the first focusable element of the content, else the
   * dialog itself. The close button comes before the content, so the browser would choose it.
   */
  private focusContent(dialog: HTMLDialogElement): void {
    const content = this.options.content();
    const marked = content.flatMap((root) => [
      ...(root.matches(AUTOFOCUS) ? [root] : []),
      ...root.querySelectorAll(AUTOFOCUS),
    ]);
    // A marked element takes the focus outside the order of Tab too, such as a paragraph with
    // `tabindex="-1"` to read first.
    for (const candidate of marked) {
      if (tryFocus(candidate, true)) {
        return;
      }
    }
    for (const candidate of content.flatMap(descendants)) {
      if (tryFocus(candidate, false)) {
        return;
      }
    }
    dialog.focus();
  }

  private request(reason: OverlayCloseReason, originalEvent: Event, returnValue = ''): void {
    this.options.onCloseRequest({ reason, returnValue, originalEvent, forced: false });
  }

  private readonly onSubmit = (event: Event): void => {
    const dialog = this.options.dialog();
    const form = event.target;
    if (
      !(event instanceof SubmitEvent) ||
      !(form instanceof HTMLFormElement) ||
      event.defaultPrevented ||
      submissionMethod(form, event.submitter) !== 'dialog' ||
      // A form of a dialog inside the content belongs to that dialog.
      event.composedPath().find((target) => target instanceof HTMLDialogElement) !== dialog
    ) {
      return;
    }
    // The modal closes the dialog when the request is granted; a refused one keeps it open.
    event.preventDefault();
    this.request('form', event, submittedValue(form, event.submitter, this.pressed));
  };

  private readonly onClick = (event: MouseEvent): void => {
    const dialog = this.options.dialog();
    const fromBackdrop = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (
      dialog !== null &&
      fromBackdrop &&
      onBackdrop(dialog, event) &&
      this.options.closesOnBackdrop()
    ) {
      this.request('backdrop', event);
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const dialog = this.options.dialog();
    if (dialog === null) {
      return;
    }
    // A press that starts on the content and ends on the backdrop, such as a selection of text,
    // is no press on the backdrop.
    this.pressedBackdrop = onBackdrop(dialog, event);
    if (this.drag !== undefined || !event.isPrimary || event.button !== 0) {
      return;
    }
    const path = event.composedPath();
    const onHandle = this.options.dragHandles().some((handle) => path.includes(handle));
    const excluded = this.options.dragExcluded().some((element) => path.includes(element));
    if (!onHandle || excluded) {
      return;
    }
    this.drag = { pointerId: event.pointerId, state: startDrag(event.clientY, event.timeStamp) };
    dialog.setPointerCapture(event.pointerId);
    this.options.onDragging(true);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const dialog = this.options.dialog();
    if (dialog === null || this.drag?.pointerId !== event.pointerId) {
      return;
    }
    this.drag.state = moveDrag(this.drag.state, event.clientY, event.timeStamp);
    dialog.style.setProperty('--_drag-offset', `${String(dragOffset(this.drag.state))}px`);
    event.preventDefault();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const dialog = this.options.dialog();
    if (dialog === null || this.drag?.pointerId !== event.pointerId) {
      return;
    }
    const state = moveDrag(this.drag.state, event.clientY, event.timeStamp);
    this.endDrag(dialog);
    if (shouldDismissDrag(state, dialog.offsetHeight)) {
      this.request('drag', event);
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.drag?.pointerId === event.pointerId) {
      this.endDrag(this.options.dialog());
    }
  };

  private endDrag(dialog: HTMLDialogElement | null): void {
    if (this.drag === undefined) {
      return;
    }
    if (dialog?.hasPointerCapture(this.drag.pointerId) === true) {
      dialog.releasePointerCapture(this.drag.pointerId);
    }
    this.drag = undefined;
    dialog?.style.removeProperty('--_drag-offset');
    this.options.onDragging(false);
  }
}

/**
 * Whether a pointer event lands on the backdrop: the browser targets the dialog itself, at a point
 * outside its box.
 */
function onBackdrop(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.composedPath()[0] !== dialog) {
    return false;
  }
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

/** The method of a submission: that of its submit button when the button overrides the form's. */
function submissionMethod(form: HTMLFormElement, submitter: HTMLElement | null): string {
  if (
    (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) &&
    submitter.hasAttribute('formmethod')
  ) {
    return submitter.formMethod;
  }
  return form.method;
}

/**
 * The value of the button that submits a form. A submit button that is a custom element, such as
 * `ui-button`, submits without a submitter, so the latest click names it.
 */
function submittedValue(
  form: HTMLFormElement,
  submitter: HTMLElement | null,
  pressed: readonly EventTarget[],
): string {
  if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
    return submitter.value;
  }
  const custom = pressed.find(
    (target) =>
      target instanceof HTMLElement &&
      target.localName.includes('-') &&
      Reflect.get(target, 'type') === 'submit' &&
      Reflect.get(target, 'form') === form,
  );
  const value: unknown = custom === undefined ? undefined : Reflect.get(custom, 'value');
  return typeof value === 'string' ? value : '';
}

/** A root of the content and every element inside it, in the order of the document. */
function descendants(root: Element): Element[] {
  return [root, ...root.querySelectorAll('*')];
}

/**
 * Focuses an element and reports whether it took the focus. Only a marked element may be outside
 * the order of Tab.
 */
function tryFocus(element: Element, marked: boolean): boolean {
  if (!(element instanceof HTMLElement) || !element.checkVisibility()) {
    return false;
  }
  const delegates = element.shadowRoot?.delegatesFocus === true;
  if (!marked && element.tabIndex < 0 && !delegates) {
    return false;
  }
  element.focus();
  return activeElements().some((active) => active === element || element.contains(active));
}

/**
 * The element with the focus in the document and in every shadow root down to it. A modal inside
 * a shadow root sees only the host of that root as the active element of the document.
 */
function activeElements(): Element[] {
  const chain: Element[] = [];
  let active = document.activeElement;
  while (active !== null) {
    chain.push(active);
    active = active.shadowRoot?.activeElement ?? null;
  }
  return chain;
}

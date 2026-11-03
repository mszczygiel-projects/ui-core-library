import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  OverlayOpenChangeDetails,
  OverlayProps,
} from '@mszczygiel-projects/ui-core-shared/dialog';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import type { AccessibleNode } from '../browser.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';

/**
 * The content a harness renders inside a modal, with the components of its own framework:
 * `fields` two text fields, `autofocus` the same with the second marked to take the focus, `form`
 * a form with `method="dialog"` and two native submit buttons, `buttons` the same with two Buttons
 * of the library, `methods` a button of method post in a dialog form and a button of method dialog
 * in a form of the page, `reading` a marked paragraph outside the order of Tab before a field,
 * `select` a SelectField and `long` enough paragraphs to scroll.
 */
export type OverlayContent =
  'text' | 'fields' | 'autofocus' | 'form' | 'buttons' | 'methods' | 'reading' | 'select' | 'long';

/** The props of a modal in a contract, plus what each harness translates. */
export interface OverlayContractProps extends OverlayProps {
  readonly content?: OverlayContent;
  /**
   * The user asked the modal to close. Returning false refuses: the web component cancels its
   * `ui-open-change`, and the parent of the React component keeps `open`.
   */
  readonly onOpenChange?: (
    open: boolean,
    details: OverlayOpenChangeDetails<Event>,
  ) => boolean | undefined;
}

/** The width of the window above the breakpoint, where a dialog is no sheet. */
export const WIDE = { width: 1280, height: 800 };

/** The width of the window below the breakpoint, where a dialog rises from the bottom as a sheet. */
export const NARROW = { width: 414, height: 800 };

/** The native dialog of a modal: the part `base`. */
export function nativeDialog(modal: Mounted<object>): HTMLDialogElement {
  const base = modal.part('base');
  if (!(base instanceof HTMLDialogElement)) {
    throw new Error('The base of a modal is no native dialog');
  }
  return base;
}

/** The node of the modal in the accessibility tree of the browser. */
export async function modalNode(modal: Mounted<object>): Promise<AccessibleNode | undefined> {
  return (await modal.accessibleTree()).find(
    (node) => node.role === 'dialog' || node.role === 'alertdialog',
  );
}

/** The element that has the focus, inside shadow roots too. */
export function focused(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/**
 * The box of a panel where it rests, in the window. The bounding box moves while the panel slides
 * in, and the offsets of a panel in the top layer are relative to the window.
 */
export function restingBox(panel: HTMLElement) {
  return {
    left: panel.offsetLeft,
    top: panel.offsetTop,
    right: panel.offsetLeft + panel.offsetWidth,
    bottom: panel.offsetTop + panel.offsetHeight,
    width: panel.offsetWidth,
    height: panel.offsetHeight,
  };
}

/** Whether the scroll of the page is locked. */
export function pageLocked(): boolean {
  return getComputedStyle(document.documentElement).overflow === 'hidden';
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

function pointer(type: string, target: Element, clientY: number, clientX = 0): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      pointerId: 1,
      isPrimary: true,
      pointerType: 'touch',
      button: 0,
      clientX,
      clientY,
    }),
  );
}

/**
 * Drags a handle down by `distance` pixels in `duration` milliseconds, as a finger does: a press,
 * a move and a release on the same pointer.
 */
export async function dragDown(handle: Element, distance: number, duration = 0): Promise<void> {
  const box = handle.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  pointer('pointerdown', handle, y, x);
  if (duration > 0) {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }
  pointer('pointermove', handle, y + distance, x);
  pointer('pointerup', handle, y + distance, x);
  await nextFrame();
  await nextFrame();
}

/** What a modal needs to show in a contract: a name, and its content. */
export interface OverlayFixture<Props extends OverlayContractProps> {
  readonly name: string;
  readonly defaults: Props;
  /** The label group of the modal in `configureUiCore`. */
  readonly labels: 'dialog' | 'drawer';
  /** The props that let a user drag the modal down, in a window of the given width. */
  readonly draggable: Partial<Props>;
  /** The window the drag needs: a dialog is a sheet only below the breakpoint. */
  readonly dragWindow: { readonly width: number; readonly height: number };
}

/**
 * The behaviour every modal shares, Dialog and Drawer, applied unchanged to the web component and
 * the React component.
 */
export function overlayContract<Props extends OverlayContractProps>(
  adapter: Mount<Props>,
  fixture: OverlayFixture<Props>,
): void {
  const mounted: Mounted<Props>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: Partial<OverlayContractProps> = {}, options?: MountOptions) {
    // The cases set only the props every modal shares, which leave the rest of Props as it was.
    const modal = await adapter({ ...fixture.defaults, open: true, ...props }, options);
    mounted.push(modal);
    return modal;
  }
  function opener(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'Open';
    document.body.append(button);
    fixtures.push(button);
    button.focus();
    return button;
  }
  const closeName = async (modal: Mounted<Props>) =>
    (await modal.accessibleTree()).find((node) => node.role === 'button' && node.name !== 'OK')
      ?.name;

  beforeEach(async () => {
    await page.viewport(WIDE.width, WIDE.height);
  });

  afterEach(async () => {
    for (const modal of mounted.splice(0)) {
      await modal.unmount();
    }
    for (const element of fixtures.splice(0)) {
      element.remove();
    }
  });

  it('opens as a modal in the top layer, and leaves the rest of the page inert', async () => {
    const button = opener();
    const modal = await mount({ content: 'fields' });
    const dialog = nativeDialog(modal);
    expect(dialog.matches(':modal')).toBe(true);
    button.focus();
    expect(document.activeElement).not.toBe(button);
    for (let press = 0; press < 4; press += 1) {
      await userEvent.tab();
      expect(focused()).not.toBe(button);
    }
  });

  it('gives the focus to the first field of its content, not to the close button', async () => {
    const modal = await mount({ content: 'fields' });
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('First');
    expect(modal.element.isConnected).toBe(true);
  });

  it('gives the focus to the element the author marks', async () => {
    await mount({ content: 'autofocus' });
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('Second');
  });

  it('gives the focus to a marked element outside the order of Tab', async () => {
    await mount({ content: 'reading' });
    await expect.poll(() => focused()?.textContent).toBe('Read this first');
  });

  it('gives the focus to its content inside a shadow root', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    fixtures.push(host);
    const parent = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(parent);
    await mount({ content: 'autofocus' }, { parent });
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('Second');
  });

  it('gives the focus to the panel when its content has nothing focusable', async () => {
    const modal = await mount({ hideCloseButton: true });
    await expect.poll(() => focused()).toBe(nativeDialog(modal));
  });

  it('closes with Escape and gives the focus back to the element that opened it', async () => {
    const button = opener();
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({
      open: false,
      content: 'fields',
      onOpenChange: changed,
    });
    await modal.update({ open: true } as Partial<Props>);
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('First');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => nativeDialog(modal).open).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.lastCall?.[0]).toBe(false);
    expect(changed.mock.lastCall?.[1].reason).toBe('escape');
    expect(changed.mock.lastCall?.[1].originalEvent).toBeInstanceOf(Event);
    expect(document.activeElement).toBe(button);
  });

  it('closes with a press on its backdrop, but not after a press that starts on the content', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ content: 'text', onOpenChange: changed });
    const dialog = nativeDialog(modal);
    const box = restingBox(dialog);
    const outsideX = box.left > 20 ? box.left - 10 : box.right + 10;
    // A selection of text that ends on the backdrop: the browser targets the click at the dialog.
    pointer(
      'pointerdown',
      modal.screen.getByText('Content').element(),
      box.top + 10,
      box.left + 10,
    );
    dialog.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, clientX: outsideX, clientY: 10 }),
    );
    expect(changed).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const moved = dialog.getBoundingClientRect();
    await userEvent.click(dialog, {
      position: { x: outsideX - moved.left, y: 10 - moved.top },
      force: true,
    });
    await expect.poll(() => dialog.open).toBe(false);
    expect(changed.mock.lastCall?.[1].reason).toBe('backdrop');
  });

  it('closes with its close button, named by closeLabel, else by its label', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ onOpenChange: changed });
    expect(await closeName(modal)).toBe('Close');
    configureUiCore({ labels: pseudoLabels });
    await expect.poll(() => closeName(modal)).toBe(pseudoLabels[fixture.labels].close);
    await modal.update({ closeLabel: 'Dismiss' } as Partial<Props>);
    expect(await closeName(modal)).toBe('Dismiss');
    await userEvent.click(modal.part('close'));
    await expect.poll(() => nativeDialog(modal).open).toBe(false);
    expect(changed.mock.lastCall?.[1].reason).toBe('close-button');
  });

  it('has no close button with hideCloseButton', async () => {
    const modal = await mount({ hideCloseButton: true });
    expect((await modal.accessibleTree()).some((node) => node.role === 'button')).toBe(false);
  });

  it('closes with a form of method dialog, with the value of its submit button', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ content: 'form', onOpenChange: changed });
    await userEvent.click(modal.screen.getByRole('button', { name: 'Confirm' }));
    await expect.poll(() => nativeDialog(modal).open).toBe(false);
    expect(changed.mock.lastCall?.[1]).toMatchObject({ reason: 'form', returnValue: 'confirm' });
    expect(nativeDialog(modal).returnValue).toBe('confirm');
  });

  it('closes with a form of method dialog, with the value of its submit Button', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ content: 'buttons', onOpenChange: changed });
    await userEvent.click(modal.screen.getByRole('button', { name: 'Confirm' }));
    await expect.poll(() => nativeDialog(modal).open).toBe(false);
    expect(changed.mock.lastCall?.[1]).toMatchObject({ reason: 'form', returnValue: 'confirm' });
    expect(nativeDialog(modal).returnValue).toBe('confirm');
  });

  it('follows the method of the submit button over that of its form', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>(() => false);
    const modal = await mount({ content: 'methods', onOpenChange: changed });
    // The page keeps itself from navigating, after the modal has seen the submission.
    const cancelled: boolean[] = [];
    const guard = (event: Event) => {
      cancelled.push(event.defaultPrevented);
      event.preventDefault();
    };
    window.addEventListener('submit', guard);
    try {
      await userEvent.click(modal.screen.getByRole('button', { name: 'Save' }));
      await expect.poll(() => cancelled).toEqual([false]);
      expect(changed).not.toHaveBeenCalled();
      await userEvent.click(modal.screen.getByRole('button', { name: 'Done' }));
      await expect
        .poll(() => changed.mock.lastCall?.[1])
        .toMatchObject({
          reason: 'form',
          returnValue: 'done',
        });
      expect(nativeDialog(modal).matches(':modal')).toBe(true);
    } finally {
      window.removeEventListener('submit', guard);
    }
  });

  it('stays open and modal when the page refuses to close it', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>(() => false);
    const modal = await mount({ content: 'fields', onOpenChange: changed });
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('First');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(modal.part('close'));
    expect(changed.mock.calls.map(([, details]) => details.reason)).toEqual([
      'escape',
      'close-button',
    ]);
    expect(nativeDialog(modal).matches(':modal')).toBe(true);
    expect(pageLocked()).toBe(true);
  });

  it('follows a dialog that the browser closed by force, and asks nothing more of the page', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>(() => false);
    const modal = await mount({ onOpenChange: changed });
    nativeDialog(modal).close();
    await expect.poll(() => changed.mock.calls.length).toBe(1);
    expect(changed.mock.lastCall?.[1].reason).toBe('escape');
    await nextFrame();
    expect(nativeDialog(modal).open).toBe(false);
    expect(pageLocked()).toBe(false);
    if (modal.element.tagName.startsWith('UI-')) {
      expect(modal.element.hasAttribute('open')).toBe(false);
    }
  });

  it('opens and closes with its prop without reporting a request', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ onOpenChange: changed });
    await modal.update({ open: false } as Partial<Props>);
    expect(nativeDialog(modal).open).toBe(false);
    await modal.update({ open: true } as Partial<Props>);
    // The close event of the first closing arrives in a later task, while the dialog is open.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(nativeDialog(modal).matches(':modal')).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('locks the scroll of the page while open, and restores the style of the page', async () => {
    const root = document.documentElement;
    root.style.overflow = 'clip';
    try {
      const modal = await mount();
      expect(pageLocked()).toBe(true);
      await modal.update({ open: false } as Partial<Props>);
      expect(root.style.overflow).toBe('clip');
    } finally {
      root.style.removeProperty('overflow');
    }
  });

  it('releases the page when it leaves the page open', async () => {
    const button = opener();
    const modal = await mount();
    await modal.unmount();
    mounted.splice(mounted.indexOf(modal), 1);
    expect(pageLocked()).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('lets Escape close an open list of a SelectField inside it, and stays open', async () => {
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ content: 'select', onOpenChange: changed });
    const field = modal.screen.getByRole('combobox', { name: 'Fruit' });
    await userEvent.click(field);
    const listbox = modal.screen.getByRole('listbox');
    await expect.element(listbox).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(listbox).not.toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
    expect(nativeDialog(modal).open).toBe(true);
  });

  it('closes when the user drags it down far enough, and comes back after a short drag', async () => {
    await page.viewport(fixture.dragWindow.width, fixture.dragWindow.height);
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({ ...fixture.draggable, onOpenChange: changed });
    const dialog = nativeDialog(modal);
    const grabber = modal.part('grabber');
    expect(grabber.checkVisibility()).toBe(true);
    // The handle spans the panel, so a drag can start anywhere along its bar.
    expect(grabber.offsetWidth).toBe(dialog.clientWidth);
    await dragDown(grabber, 10, 200);
    expect(changed).not.toHaveBeenCalled();
    expect(dialog.style.getPropertyValue('--_drag-offset')).toBe('');
    await dragDown(grabber, dialog.offsetHeight / 2, 200);
    await expect.poll(() => dialog.open).toBe(false);
    expect(changed.mock.lastCall?.[1].reason).toBe('drag');
  });

  it('cannot be dragged without dragToDismiss', async () => {
    await page.viewport(fixture.dragWindow.width, fixture.dragWindow.height);
    const changed = vi.fn<NonNullable<OverlayContractProps['onOpenChange']>>();
    const modal = await mount({
      ...fixture.draggable,
      dragToDismiss: false,
      onOpenChange: changed,
    });
    await dragDown(modal.part('header'), 300);
    expect(changed).not.toHaveBeenCalled();
    expect(nativeDialog(modal).open).toBe(true);
  });

  it('opens without motion when the user prefers reduced motion', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const modal = await mount();
    const style = getComputedStyle(nativeDialog(modal));
    expect(style.transitionDuration.split(',').every((value) => value.trim() === '0s')).toBe(true);
  });

  it('takes the colour of its backdrop from its own token', async () => {
    const modal = await mount();
    modal.element.style.setProperty(`--color-${fixture.labels}-backdrop`, 'rgb(1, 2, 3)');
    expect(getComputedStyle(nativeDialog(modal), '::backdrop').backgroundColor).toBe(
      'rgb(1, 2, 3)',
    );
  });
}

/**
 * Two modals share one lock of the scroll of the page, whatever their component and package:
 * closing the first leaves the page locked under the second.
 */
export function sharedScrollLockContract<
  First extends OverlayContractProps,
  Second extends OverlayContractProps,
>(first: Mount<First>, firstProps: First, second: Mount<Second>, secondProps: Second): void {
  it('keeps the page locked until the last of two modals closes', async () => {
    const under = await first({ ...firstProps, open: true });
    const over = await second({ ...secondProps, open: true });
    try {
      expect(pageLocked()).toBe(true);
      await under.update({ open: false } as Partial<First>);
      expect(pageLocked()).toBe(true);
      await over.update({ open: false } as Partial<Second>);
      expect(pageLocked()).toBe(false);
    } finally {
      await over.unmount();
      await under.unmount();
    }
  });
}

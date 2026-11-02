import { dialog, type DialogProps } from '@mszczygiel-projects/ui-core-shared/dialog';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import {
  modalNode,
  NARROW,
  nativeDialog,
  overlayContract,
  type OverlayContractProps,
  restingBox,
  WIDE,
} from './overlay.contract.ts';

/** The props of the specification, plus what each harness translates: the content and a footer. */
export interface DialogContractProps extends DialogProps, OverlayContractProps {
  /** The text of a button in the footer. */
  readonly footer?: string;
}

const { options } = dialog;

/** The behaviour of Dialog, applied unchanged to the web component and the React component. */
export function dialogContract(adapter: Mount<DialogContractProps>): void {
  overlayContract(adapter, {
    name: 'Dialog',
    labels: 'dialog',
    defaults: { heading: 'Delete file' },
    draggable: { dragToDismiss: true },
    dragWindow: NARROW,
  });

  const mounted: Mounted<DialogContractProps>[] = [];
  async function mount(props: DialogContractProps = {}, mountOptions?: MountOptions) {
    const modal = await adapter({ heading: 'Delete file', open: true, ...props }, mountOptions);
    mounted.push(modal);
    return modal;
  }
  const shadowOf = (part: HTMLElement) => getComputedStyle(part).boxShadow;

  beforeEach(async () => {
    await page.viewport(WIDE.width, WIDE.height);
  });

  afterEach(async () => {
    for (const modal of mounted.splice(0)) {
      await modal.unmount();
    }
  });

  it('is a dialog named by its heading and described by its description', async () => {
    const modal = await mount({ description: 'It cannot be restored.' });
    expect(await modalNode(modal)).toEqual({
      role: 'dialog',
      name: 'Delete file',
      description: 'It cannot be restored.',
    });
  });

  it('is an alert dialog with alert, which a press on the backdrop does not close', async () => {
    const modal = await mount({ alert: true, content: 'text' });
    expect((await modalNode(modal))?.role).toBe('alertdialog');
    const dialogElement = nativeDialog(modal);
    const box = restingBox(dialogElement);
    dialogElement.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        composed: true,
        clientX: box.left - 10,
        clientY: 10,
      }),
    );
    dialogElement.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        clientX: box.left - 10,
        clientY: 10,
      }),
    );
    expect(dialogElement.open).toBe(true);
  });

  it('is named by label without a heading, and by the aria-label of the page above both', async () => {
    const labelled = await mount({ heading: '', label: 'Settings' });
    expect((await modalNode(labelled))?.name).toBe('Settings');
    const named = await mount({ label: 'Settings' }, { attributes: { 'aria-label': 'Account' } });
    expect((await modalNode(named))?.name).toBe('Account');
  });

  it('gives two dialogs open at once their own names and descriptions', async () => {
    const first = await mount({ heading: 'First', description: 'One' });
    const second = await mount({ heading: 'Second', description: 'Two' });
    // Only the dialog on top is in the tree: the one under it is inert.
    expect(await modalNode(second)).toMatchObject({ name: 'Second', description: 'Two' });
    await second.update({ open: false });
    expect(await modalNode(first)).toMatchObject({ name: 'First', description: 'One' });
  });

  it('uses the documented size and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ size: 'medium' });
    const width = nativeDialog(explicit).offsetWidth;
    expect(nativeDialog(defaults).offsetWidth).toBe(width);
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({ size: value } as unknown as DialogContractProps);
      expect(nativeDialog(defaults).offsetWidth).toBe(width);
    }
  });

  it('takes the width of each size from its own token, and fills the window when fullscreen', async () => {
    for (const size of options.size.options) {
      const modal = await mount({ size });
      modal.element.style.setProperty(`--dialog-${size}-max-width`, '333px');
      const width = nativeDialog(modal).offsetWidth;
      if (size === 'fullscreen') {
        expect(width).toBe(window.innerWidth);
      } else {
        expect(width).toBe(333);
      }
    }
  });

  it('shows its footer only with content, and separators only where the content scrolls on', async () => {
    const plain = await mount();
    expect(plain.part('footer').checkVisibility()).toBe(false);
    const modal = await mount({ content: 'long', footer: 'OK' });
    const header = modal.part('header');
    const footer = modal.part('footer');
    expect(footer.checkVisibility()).toBe(true);
    await expect.poll(() => shadowOf(header)).toBe('none');
    await expect.poll(() => shadowOf(footer)).not.toBe('none');
    const body = modal.part('body');
    body.scrollTop = body.scrollHeight;
    body.dispatchEvent(new Event('scroll'));
    await expect.poll(() => shadowOf(header)).not.toBe('none');
    await expect.poll(() => shadowOf(footer)).toBe('none');
  });

  it('rises from the bottom of a narrow window as a sheet, with a handle when it can be dragged', async () => {
    const wide = await mount({ dragToDismiss: true });
    expect(wide.part('grabber').checkVisibility()).toBe(false);
    const box = restingBox(nativeDialog(wide));
    expect(Math.abs(box.top - (window.innerHeight - box.bottom))).toBeLessThan(2);
    await page.viewport(NARROW.width, NARROW.height);
    await expect.poll(() => wide.part('grabber').checkVisibility()).toBe(true);
    const sheet = restingBox(nativeDialog(wide));
    expect(sheet.bottom).toBe(window.innerHeight);
    expect(sheet.width).toBe(window.innerWidth);
  });
}

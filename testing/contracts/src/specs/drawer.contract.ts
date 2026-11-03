import { drawer, type DrawerProps } from '@mszczygiel-projects/ui-core-shared/drawer';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import {
  modalNode,
  nativeDialog,
  overlayContract,
  type OverlayContractProps,
  restingBox,
  WIDE,
} from './overlay.contract.ts';

/** The props of the specification, plus what each harness translates: the content. */
export interface DrawerContractProps extends DrawerProps, OverlayContractProps {}

const { options } = drawer;

/** The behaviour of Drawer, applied unchanged to the web component and the React component. */
export function drawerContract(adapter: Mount<DrawerContractProps>): void {
  overlayContract(adapter, {
    name: 'Drawer',
    labels: 'drawer',
    defaults: { label: 'Filters' },
    draggable: { placement: 'bottom', dragToDismiss: true },
    dragWindow: WIDE,
  });

  const mounted: Mounted<DrawerContractProps>[] = [];
  async function mount(props: DrawerContractProps = {}, mountOptions?: MountOptions) {
    const modal = await adapter({ label: 'Filters', open: true, ...props }, mountOptions);
    mounted.push(modal);
    return modal;
  }
  /** The edge of the window the panel touches. */
  const edge = (modal: Mounted<DrawerContractProps>) => {
    const box = restingBox(nativeDialog(modal));
    if (box.width < window.innerWidth) {
      return box.left === 0 ? 'left' : box.right === window.innerWidth ? 'right' : 'none';
    }
    return box.bottom === window.innerHeight && box.top > 0 ? 'bottom' : 'none';
  };

  beforeEach(async () => {
    await page.viewport(WIDE.width, WIDE.height);
  });

  afterEach(async () => {
    for (const modal of mounted.splice(0)) {
      await modal.unmount();
    }
  });

  it('is a dialog named by its label, and by the aria-label of the page above it', async () => {
    const modal = await mount();
    expect(await modalNode(modal)).toMatchObject({ role: 'dialog', name: 'Filters' });
    const named = await mount({}, { attributes: { 'aria-label': 'Sort' } });
    expect((await modalNode(named))?.name).toBe('Sort');
  });

  it('sits at the edge of its placement, which follows the direction of the text', async () => {
    const expected = {
      ltr: { start: 'left', end: 'right', bottom: 'bottom' },
      rtl: { start: 'right', end: 'left', bottom: 'bottom' },
    } as const;
    for (const dir of ['ltr', 'rtl'] as const) {
      for (const placement of options.placement.options) {
        const modal = await mount({ placement, content: 'text' }, { dir });
        expect([dir, placement, edge(modal)]).toEqual([dir, placement, expected[dir][placement]]);
      }
    }
  });

  it('uses the documented placement and falls back after invalid runtime settings', async () => {
    const modal = await mount();
    expect(edge(modal)).toBe('right');
    for (const value of ['unsupported', null, 42]) {
      await modal.update({ placement: value } as unknown as DrawerContractProps);
      expect(edge(modal)).toBe('right');
    }
  });

  it('takes its width from its own token', async () => {
    const modal = await mount();
    modal.element.style.setProperty('--drawer-width', '345px');
    expect(nativeDialog(modal).offsetWidth).toBe(345);
  });

  it('shows a handle only at the bottom with dragToDismiss', async () => {
    const side = await mount({ dragToDismiss: true });
    expect(side.element.querySelector('.ui-drawer__grabber')).toBeNull();
    expect(side.element.shadowRoot?.querySelector('[part~="grabber"]') ?? null).toBeNull();
    const bottom = await mount({ placement: 'bottom', dragToDismiss: true });
    expect(bottom.part('grabber').checkVisibility()).toBe(true);
  });
}

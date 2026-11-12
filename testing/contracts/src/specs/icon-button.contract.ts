import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type { IconButtonProps } from '@mszczygiel-projects/ui-core-shared/icon-button';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { iconSize } from '../harness/icon.tsx';
import { type Mount, type Mounted, type MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenNumber, tokenValue } from '../tokens.ts';
import {
  actionFormContract,
  actionShapeContract,
  actionSurfaceContract,
  formFixtures,
} from './action.contract.ts';
import { popupTriggerContract } from './popup-trigger.contract.ts';

/** The props of the specification, plus the icon as a flag, which each harness renders. */
export interface IconButtonContractProps extends IconButtonProps {
  readonly icon?: boolean;
}

const NAMED: IconButtonContractProps = { label: 'Close panel', icon: true };

/** The behaviour of IconButton, applied unchanged to the web component and the React component. */
export function iconButtonContract(adapter: Mount<IconButtonContractProps>): void {
  const mounted: Mounted<IconButtonContractProps>[] = [];
  async function mount(props: Partial<IconButtonContractProps> = {}, options?: MountOptions) {
    const button = await adapter({ ...NAMED, ...props }, options);
    mounted.push(button);
    return button;
  }
  const { formFixture } = formFixtures();

  actionFormContract(adapter, NAMED);
  actionSurfaceContract(adapter, NAMED);
  actionShapeContract(adapter, NAMED);

  afterEach(async () => {
    for (const button of mounted.splice(0)) {
      await button.unmount();
    }
  });

  popupTriggerContract(() => mount(), { role: 'button', popup: true });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ variant: 'primary', size: 'medium', type: 'button' });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    expect(base.getAttribute('type')).toBe('button');
    expect(base.hasAttribute('disabled')).toBe(false);
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        variant: value,
        size: value,
        type: value,
      } as unknown as IconButtonContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
      expect(base.getAttribute('type')).toBe('button');
    }
  });

  it('exposes one accessible button named by its label, with a decorative icon', async () => {
    const button = await mount();
    const tree = await button.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: 'Close panel' },
    ]);
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
    expect(tree.some((node) => node.role === 'form')).toBe(false);
    await button.update({ label: 'Open panel' });
    expect((await button.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Open panel',
    );
  });

  it('prefers an author aria-label to its label', async () => {
    const button = await mount({}, { attributes: { 'aria-label': 'Author name' } });
    expect((await button.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Author name',
    );
  });

  it('retains focus and its name while loading, blocking every activation', async () => {
    const { form, fieldset, submitted } = formFixture();
    const button = await mount(
      { type: 'submit', name: 'action', value: 'close' },
      { parent: fieldset },
    );
    const base = button.part('base');
    base.focus();
    await button.update({ loading: true });
    expect(button.part('base')).toBe(base);
    expect(base.matches(':focus')).toBe(true);
    expect(base.matches(':disabled')).toBe(false);
    expect(getComputedStyle(button.part('icon')).opacity).toBe('0');
    expect(base.getAttribute('aria-busy')).toBe('true');
    expect(base.getAttribute('aria-disabled')).toBe('true');
    const clicked = vi.fn();
    button.element.addEventListener('click', clicked);
    // Browser automation treats aria-disabled as disabled, so use the native click method here.
    base.click();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).not.toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();
    expect([...new FormData(form)]).toEqual([['title', 'Draft']]);
    const tree = await button.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: 'Close panel', description: 'Loading' },
    ]);
    expect(tree.some((node) => node.role === 'progressbar')).toBe(false);
    await button.update({ loading: false });
    expect(base.matches(':focus')).toBe(true);
    expect(getComputedStyle(button.part('icon')).opacity).toBe('1');
  });

  it('uses configurable loading text, follows live changes, and prefers its prop', async () => {
    configureUiCore({ labels: pseudoLabels });
    const button = await mount({ loading: true });
    const description = async () =>
      (await button.accessibleTree()).find((node) => node.role === 'button')?.description;
    expect(await description()).toBe(pseudoLabels.iconButton.loading);
    configureUiCore({ labels: { iconButton: { loading: 'Zamykanie' } } });
    await expect.poll(description).toBe('Zamykanie');
    await button.update({ loadingLabel: 'Closing panel' });
    expect(await description()).toBe('Closing panel');
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`is a square as tall as a button of each size in ${density} density`, async () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const button = await mount({ size }, { density });
        const prefix = size === 'medium' ? '--button' : `--button-${size}`;
        const side =
          // The line height is a ratio in CSS; its Figma number is the height of the line.
          tokenNumber(`${prefix}-line-height`, { density }) +
          // The border lies inside the box.
          2 * pixels(tokenValue(`${prefix}-padding-stack`, { density }));
        const base = button.part('base');
        expect(base.offsetHeight).toBe(side);
        expect(base.offsetWidth).toBe(side);
        expect(Math.min(base.offsetWidth, base.offsetHeight)).toBeGreaterThanOrEqual(24);
        const iconSide = pixels(tokenValue(`${prefix}-icon-size`, { density }));
        // The page wraps the 1em artwork of the icons package; it still takes the icon size.
        await expect
          .poll(() => iconSize(button.element))
          .toEqual({
            width: iconSide,
            height: iconSide,
          });
      }
    });
  }

  it('centres a correctly sized loader in the action colour', async () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const button = await mount({ size, loading: true, variant: 'danger' });
      const loader = button.part('loader').firstElementChild;
      if (!(loader instanceof HTMLElement)) {
        throw new Error('Missing embedded loader');
      }
      const bounds = button.part('base').getBoundingClientRect();
      const indicator = loader.getBoundingClientRect();
      expect(indicator.width).toBe(
        pixels(tokenValue(size === 'large' ? '--loader-size' : '--loader-small-size')),
      );
      expect(indicator.x + indicator.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 1);
      expect(indicator.y + indicator.height / 2).toBeCloseTo(bounds.y + bounds.height / 2, 1);
      expect(getComputedStyle(loader).color).toBe(getComputedStyle(button.part('base')).color);
    }
  });
}

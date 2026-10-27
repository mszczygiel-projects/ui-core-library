import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { iconSize } from '../harness/icon.tsx';
import { type Mount, type Mounted, type MountOptions, required } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';
import { actionFormContract, actionSurfaceContract, formFixtures } from './action.contract.ts';

/**
 * The props of the specification, plus content as text and icons as flags, which the harness of
 * each framework turns into its own children and icons.
 */
export interface ButtonContractProps extends ButtonProps {
  readonly children?: string;
  readonly leadingIcon?: boolean;
  readonly trailingIcon?: boolean;
}

/** One behaviour contract, applied unchanged to the web component and the React component. */
export function buttonContract(adapter: Mount<ButtonContractProps>): void {
  const mounted: Mounted<ButtonContractProps>[] = [];
  async function mount(props: ButtonContractProps = {}, options?: MountOptions) {
    const button = await adapter({ children: 'Save draft', ...props }, options);
    mounted.push(button);
    return button;
  }
  const { formFixture } = formFixtures();
  actionFormContract(adapter, { children: 'Save draft' });
  actionSurfaceContract(adapter, { children: 'Save draft' });

  afterEach(async () => {
    for (const button of mounted.splice(0)) {
      await button.unmount();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ variant: 'primary', size: 'medium', type: 'button' });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    expect(base.getAttribute('type')).toBe('button');
    expect(base.hasAttribute('disabled')).toBe(false);
    expect(base.getAttribute('aria-busy')).not.toBe('true');
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        variant: value,
        size: value,
        type: value,
      } as unknown as ButtonContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
      expect(base.getAttribute('type')).toBe('button');
    }
  });

  it('exposes one accessible button, named by its content, with decorative icons', async () => {
    const button = await mount({ leadingIcon: true, trailingIcon: true });
    const tree = await button.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      {
        role: 'button',
        name: tokenValue('--button-text-uppercase') === 'uppercase' ? 'SAVE DRAFT' : 'Save draft',
      },
    ]);
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
    // An element the component needs inside, such as a form, adds no node of its own.
    expect(tree.some((node) => node.role === 'form')).toBe(false);
  });

  it('prefers a label to content and an author aria-label to either', async () => {
    const button = await mount({ label: 'Save article' });
    expect((await button.accessibleTree()).filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: 'Save article' },
    ]);
    await button.update({ label: 'Publish article' });
    expect((await button.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Publish article',
    );
    const named = await mount(
      { label: 'Ignored' },
      { attributes: { 'aria-label': 'Author name' } },
    );
    expect((await named.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Author name',
    );
  });

  it('retains focus, width and its action name while loading, blocking every activation', async () => {
    const { form, fieldset, submitted } = formFixture();
    const button = await mount(
      { type: 'submit', name: 'action', value: 'save', leadingIcon: true },
      { parent: fieldset },
    );
    const base = button.part('base');
    base.focus();
    const width = base.getBoundingClientRect().width;
    await button.update({ loading: true });
    expect(button.part('base')).toBe(base);
    expect(base.matches(':focus')).toBe(true);
    expect(base.matches(':disabled')).toBe(false);
    expect(base.getBoundingClientRect().width).toBe(width);
    expect(getComputedStyle(button.part('content')).opacity).toBe('0');
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
      {
        role: 'button',
        name: tokenValue('--button-text-uppercase') === 'uppercase' ? 'SAVE DRAFT' : 'Save draft',
        description: 'Loading',
      },
    ]);
    expect(tree.some((node) => node.role === 'progressbar')).toBe(false);
    // The description lives inside the component, which stays one element on the page.
    expect(required(button.element.parentElement, 'the frame').childElementCount).toBe(1);
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(base.matches(':focus')).toBe(true);
    await button.update({ loading: false });
    expect(base.matches(':focus')).toBe(true);
    expect(getComputedStyle(button.part('content')).opacity).toBe('1');
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('uses configurable loading text, follows live changes, and prefers its prop', async () => {
    configureUiCore({ labels: pseudoLabels });
    const button = await mount({ loading: true });
    const description = async () =>
      (await button.accessibleTree()).find((node) => node.role === 'button')?.description;
    expect(await description()).toBe(pseudoLabels.button.loading);
    configureUiCore({ labels: { button: { loading: 'Zapisywanie' } } });
    await expect.poll(description).toBe('Zapisywanie');
    await button.update({ loadingLabel: 'Saving article' });
    expect(await description()).toBe('Saving article');
    await button.update({ disabled: true });
    await expect.poll(() => button.part('base').matches(':disabled')).toBe(true);
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`uses each size's geometry tokens in ${density} density`, async () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const button = await mount({ size, leadingIcon: true }, { density });
        const prefix = size === 'medium' ? '--button' : `--button-${size}`;
        const style = getComputedStyle(button.part('base'));
        expect(Number.parseFloat(style.paddingBlockStart)).toBe(
          pixels(tokenValue(`${prefix}-padding-stack`, { density })),
        );
        expect(Number.parseFloat(style.fontSize)).toBe(
          pixels(tokenValue(`${prefix}-font-size`, { density })),
        );
        const iconSide = pixels(tokenValue(`${prefix}-icon-size`, { density }));
        await expect
          .poll(() => button.part('leading-icon').getBoundingClientRect().width)
          .toBe(iconSide);
        // The page wraps the 1em artwork of the icons package; it still takes the icon size.
        expect(iconSize(button.element)).toEqual({ width: iconSide, height: iconSide });
      }
    });
  }

  it('puts leading and trailing icons in reading order in RTL', async () => {
    const button = await mount({ leadingIcon: true, trailingIcon: true }, { dir: 'rtl' });
    await expect
      .poll(() => button.part('leading-icon').getBoundingClientRect().x)
      .toBeGreaterThan(button.part('label').getBoundingClientRect().x);
    expect(button.part('trailing-icon').getBoundingClientRect().x).toBeLessThan(
      button.part('label').getBoundingClientRect().x,
    );
  });

  it('centres a correctly sized loader in the action colour', async () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const button = await mount({ size, loading: true, variant: 'danger' });
      const loader = button.part('loader').firstElementChild;
      if (!(loader instanceof HTMLElement)) {
        throw new Error('Missing embedded loader');
      }
      const base = button.part('base');
      const bounds = base.getBoundingClientRect();
      const indicator = loader.getBoundingClientRect();
      expect(indicator.width).toBe(
        pixels(tokenValue(size === 'large' ? '--loader-size' : '--loader-small-size')),
      );
      // Layout rounds the two rectangles independently to fractions of a CSS pixel.
      expect(indicator.x + indicator.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 1);
      expect(indicator.y + indicator.height / 2).toBeCloseTo(bounds.y + bounds.height / 2, 1);
      expect(getComputedStyle(loader).color).toBe(getComputedStyle(base).color);
    }
  });

  it('respects the uppercase token', async () => {
    const button = await mount();
    button.element.style.setProperty('--button-text-uppercase', 'uppercase');
    expect(getComputedStyle(button.part('base')).textTransform).toBe('uppercase');
  });
}

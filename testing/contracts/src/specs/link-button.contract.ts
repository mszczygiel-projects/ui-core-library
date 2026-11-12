import type { LinkButtonProps } from '@mszczygiel-projects/ui-core-shared/link-button';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { iconSize } from '../harness/icon.tsx';
import { type Mount, type Mounted, type MountOptions, required } from '../harness/types.ts';
import { pixels, tokenNumber, tokenValue } from '../tokens.ts';
import { actionShapeContract, actionSurfaceContract, resolvedColor } from './action.contract.ts';
import { popupTriggerContract } from './popup-trigger.contract.ts';

/**
 * The props of the specification, plus content as text and icons as flags, which the harness of
 * each framework turns into its own children and icons.
 */
export interface LinkButtonContractProps extends LinkButtonProps {
  readonly children?: string;
  readonly leadingIcon?: boolean;
  readonly trailingIcon?: boolean;
}

// A fragment of the test page, so that following the link never leaves it.
const NAMED: LinkButtonContractProps = { href: '#pricing', children: 'See pricing' };

/** The behaviour of LinkButton, applied unchanged to the web component and the React component. */
export function linkButtonContract(adapter: Mount<LinkButtonContractProps>): void {
  const mounted: Mounted<LinkButtonContractProps>[] = [];
  async function mount(props: Partial<LinkButtonContractProps> = {}, options?: MountOptions) {
    const link = await adapter({ ...NAMED, ...props }, options);
    mounted.push(link);
    return link;
  }
  /** Records whether the page saw each click of a frame, and whether it was allowed to navigate. */
  function clicksOf(link: Mounted<LinkButtonContractProps>) {
    const frame = required(link.element.parentElement, 'the frame');
    const clicks: { prevented: boolean }[] = [];
    frame.addEventListener('click', (event) => {
      clicks.push({ prevented: event.defaultPrevented });
      // The case has seen the navigation; the page stays where it is.
      event.preventDefault();
    });
    return clicks;
  }

  actionSurfaceContract(adapter, NAMED);
  actionShapeContract(adapter, NAMED);

  afterEach(async () => {
    for (const link of mounted.splice(0)) {
      await link.unmount();
    }
    history.replaceState(null, '', location.pathname + location.search);
  });

  popupTriggerContract(() => mount(), { role: 'link', popup: false });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ variant: 'primary', size: 'medium' });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({ variant: value, size: value } as unknown as LinkButtonContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    }
  });

  it('exposes one native link, named by its content, with decorative icons', async () => {
    const link = await mount({ leadingIcon: true, trailingIcon: true });
    const base = link.part('base');
    expect(base.localName).toBe('a');
    expect(base.getAttribute('href')).toBe('#pricing');
    const tree = await link.accessibleTree();
    expect(tree.filter((node) => node.role === 'link')).toEqual([
      {
        role: 'link',
        name: tokenValue('--button-text-uppercase') === 'uppercase' ? 'SEE PRICING' : 'See pricing',
      },
    ]);
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
  });

  it('prefers a label to content and an author aria-label to either', async () => {
    const link = await mount({ label: 'Pricing plans' });
    const name = async () =>
      (await link.accessibleTree()).find((node) => node.role === 'link')?.name;
    expect(await name()).toBe('Pricing plans');
    await link.update({ label: 'Compare plans' });
    expect(await name()).toBe('Compare plans');
    const named = await mount(
      { label: 'Ignored' },
      { attributes: { 'aria-label': 'Author name' } },
    );
    expect((await named.accessibleTree()).find((node) => node.role === 'link')?.name).toBe(
      'Author name',
    );
  });

  it('follows its address with the pointer and Enter, once each', async () => {
    const link = await mount();
    const clicks = clicksOf(link);
    await page.elementLocator(link.part('base')).click();
    link.part('base').focus();
    await userEvent.keyboard('{Enter}');
    expect(clicks).toEqual([{ prevented: false }, { prevented: false }]);
  });

  it('writes target, rel and download as given, with no relationship of its own', async () => {
    const link = await mount({ target: '_blank' });
    const base = link.part('base');
    expect(base.getAttribute('target')).toBe('_blank');
    expect(base.hasAttribute('rel')).toBe(false);
    expect(base.hasAttribute('download')).toBe(false);
    await link.update({ rel: 'external', download: 'pricing.pdf' });
    expect(base.getAttribute('rel')).toBe('external');
    expect(base.getAttribute('download')).toBe('pricing.pdf');
    await link.update({ download: '' });
    expect(base.getAttribute('download')).toBe('');
  });

  it('has no address while disabled, so nothing can focus or follow it', async () => {
    const before = document.createElement('button');
    before.textContent = 'Before';
    document.body.prepend(before);
    try {
      const link = await mount({ disabled: true, target: '_blank', download: 'pricing.pdf' });
      const base = link.part('base');
      for (const attribute of ['href', 'target', 'download']) {
        expect(base.hasAttribute(attribute)).toBe(false);
      }
      expect(base.getAttribute('aria-disabled')).toBe('true');
      expect((await link.accessibleTree()).filter((node) => node.role === 'link')).toEqual([
        {
          role: 'link',
          name:
            tokenValue('--button-text-uppercase') === 'uppercase' ? 'SEE PRICING' : 'See pricing',
        },
      ]);
      before.focus();
      await userEvent.tab();
      expect(base.matches(':focus')).toBe(false);
      const clicks = clicksOf(link);
      base.click();
      expect(clicks).toEqual([]);
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue('--color-button-primary-text-disabled')),
      );
      await link.update({ disabled: false });
      expect(base.getAttribute('href')).toBe('#pricing');
      expect(base.getAttribute('target')).toBe('_blank');
      expect(base.hasAttribute('aria-disabled')).toBe(false);
    } finally {
      before.remove();
    }
  });

  it('cancels a click on a disabled link where it starts, before it bubbles to the page', async () => {
    const link = await mount({ disabled: true });
    const frame = required(link.element.parentElement, 'the frame');
    const captured: Event[] = [];
    const bubbled = vi.fn();
    frame.addEventListener(
      'click',
      (event) => {
        captured.push(event);
      },
      true,
    );
    frame.addEventListener('click', bubbled);
    link.part('base').click();
    expect(captured).toHaveLength(1);
    expect(captured[0]?.defaultPrevented).toBe(true);
    expect(bubbled).not.toHaveBeenCalled();
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`is as tall as a button of each size in ${density} density`, async () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const link = await mount({ size, leadingIcon: true }, { density });
        const prefix = size === 'medium' ? '--button' : `--button-${size}`;
        const height =
          // The line height is a ratio in CSS; its Figma number is the height of the line.
          tokenNumber(`${prefix}-line-height`, { density }) +
          2 * pixels(tokenValue(`${prefix}-padding-stack`, { density })) +
          2 * pixels(tokenValue('--button-border-width', { density }));
        const style = getComputedStyle(link.part('base'));
        expect(link.part('base').offsetHeight).toBe(height);
        expect(Number.parseFloat(style.paddingInlineStart)).toBe(
          pixels(tokenValue(`${prefix}-padding-inline`, { density })),
        );
        expect(style.textDecorationLine).toBe('none');
        const iconSide = pixels(tokenValue(`${prefix}-icon-size`, { density }));
        await expect
          .poll(() => iconSize(link.element))
          .toEqual({
            width: iconSide,
            height: iconSide,
          });
      }
    });
  }

  it('puts leading and trailing icons in reading order in RTL', async () => {
    const link = await mount({ leadingIcon: true, trailingIcon: true }, { dir: 'rtl' });
    await expect
      .poll(() => link.part('leading-icon').getBoundingClientRect().x)
      .toBeGreaterThan(link.part('label').getBoundingClientRect().x);
    expect(link.part('trailing-icon').getBoundingClientRect().x).toBeLessThan(
      link.part('label').getBoundingClientRect().x,
    );
  });
}

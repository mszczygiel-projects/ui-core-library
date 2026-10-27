import { badge, type BadgeProps } from '@mszczygiel-projects/ui-core-shared/badge';
import { afterEach, expect, it } from 'vitest';

import { appearance } from '../appearance.ts';
import { textContrast } from '../contrast.ts';
import { iconSize } from '../harness/icon.tsx';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';

/** The props of the specification, plus the text and the icon as a flag, which each harness renders. */
export interface BadgeContractProps extends BadgeProps {
  readonly children?: string;
  readonly icon?: boolean;
}

const { options } = badge;

/** The behaviour of Badge, applied unchanged to the web component and the React component. */
export function badgeContract(adapter: Mount<BadgeContractProps>): void {
  const mounted: Mounted<BadgeContractProps>[] = [];
  async function mount(props: BadgeContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ children: 'Active', ...props }, mountOptions);
    mounted.push(component);
    return component;
  }

  afterEach(async () => {
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({
      tone: 'neutral',
      variant: 'solid',
      size: 'medium',
      shape: 'rounded',
    });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    expect(getComputedStyle(base).borderTopLeftRadius).toBe(
      getComputedStyle(explicit.part('base')).borderTopLeftRadius,
    );
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        tone: value,
        variant: value,
        size: value,
        shape: value,
      } as unknown as BadgeContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    }
  });

  it('is named by its text, with a decorative icon', async () => {
    const component = await mount({ icon: true, label: 'Ignored' });
    expect(component.element.textContent).toContain('Active');
    const tree = await component.accessibleTree();
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
    expect(tree.some((node) => node.role === 'image')).toBe(false);
    expect(tree.some((node) => node.name === 'Ignored')).toBe(false);
  });

  it('becomes one image named by its label when it shows only an icon', async () => {
    const component = await mount({ icon: true, children: '', label: 'Verified' });
    const images = (await component.accessibleTree()).filter((node) => node.role === 'image');
    expect(images).toEqual([{ role: 'image', name: 'Verified' }]);
    await component.update({ label: 'Checked' });
    expect((await component.accessibleTree()).find((node) => node.role === 'image')?.name).toBe(
      'Checked',
    );
  });

  it('prefers an author aria-label to its label when it shows only an icon', async () => {
    const component = await mount(
      { icon: true, children: '', label: 'Verified' },
      { attributes: { 'aria-label': 'Author name' } },
    );
    const images = (await component.accessibleTree()).filter((node) => node.role === 'image');
    expect(images).toEqual([{ role: 'image', name: 'Author name' }]);
  });

  it('keeps a role and a name that the page writes on it', async () => {
    const component = await mount(
      { tone: 'success' },
      { attributes: { role: 'status', 'aria-label': 'Build state' } },
    );
    const kept = () => [
      component.element.getAttribute('role'),
      component.element.getAttribute('aria-label'),
    ];
    // With only an icon, the role of the page still wins over the image role.
    await component.update({ label: 'Passing', icon: true, children: '' });
    expect(kept()).toEqual(['status', 'Build state']);
    expect((await component.accessibleTree()).some((node) => node.role === 'status')).toBe(true);
    await component.update({ children: 'Passing' });
    expect(kept()).toEqual(['status', 'Build state']);
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`takes the height of its size, and with only an icon is a square, in ${density} density`, async () => {
      for (const size of options.size.options) {
        const context = { density };
        const height = pixels(tokenValue(`--badge-${size}-height`, context));
        const text = await mount({ size }, context);
        expect(text.part('base').getBoundingClientRect().height).toBe(height);
        const icon = await mount({ size, icon: true, children: '', label: 'Verified' }, context);
        const box = icon.part('base').getBoundingClientRect();
        expect(box.height).toBe(height);
        expect(box.width).toBe(height);
        const side = pixels(tokenValue(`--badge-${size}-icon-size`, context));
        await expect.poll(() => iconSize(icon.element)).toEqual({ width: side, height: side });
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`keeps text readable on its fill for every tone and variant on every ${theme} surface`, async () => {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const tone of options.tone.options) {
          for (const variant of options.variant.options) {
            const component = await adapter(
              { children: 'Active', tone, variant },
              { theme, surface },
            );
            const ratio = textContrast(component.part('base'));
            expect(ratio, `${tone} ${variant} on ${surface}`).toBeGreaterThanOrEqual(4.5);
            await component.unmount();
          }
        }
      }
    });
  }
}

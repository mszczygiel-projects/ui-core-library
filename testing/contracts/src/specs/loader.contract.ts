import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import { expect, it } from 'vitest';
import { commands } from 'vitest/browser';

import type { Mount } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';

const TOKEN_OF_SIZE = {
  small: '--loader-small-size',
  medium: '--loader-size',
  large: '--loader-large-size',
} as const;

/** The diameter in pixels that the token of a size has in a density, from the manifest. */
function expectedDiameter(
  size: keyof typeof TOKEN_OF_SIZE,
  density: 'comfortable' | 'compact',
): number {
  return pixels(tokenValue(TOKEN_OF_SIZE[size], { density }));
}

/**
 * The size an element takes in the layout. The arc turns, and the box around a turned element
 * grows, so its bounding box depends on the moment it is measured.
 */
function layoutSize(element: HTMLElement): { width: number; height: number } {
  return { width: element.offsetWidth, height: element.offsetHeight };
}

/** Whether an element is turning: one of its animations changes its transform. */
function turns(element: Element): boolean {
  return element
    .getAnimations()
    .some(
      (animation) =>
        animation.effect instanceof KeyframeEffect &&
        animation.effect.getKeyframes().some((keyframe) => 'transform' in keyframe),
    );
}

/** The sides of an element that show a border: drawn, wider than zero and not transparent. */
function visibleBorders(element: Element): number {
  const style = getComputedStyle(element);
  return ['top', 'right', 'bottom', 'left'].filter(
    (side) =>
      style.getPropertyValue(`border-${side}-style`) !== 'none' &&
      Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
      style.getPropertyValue(`border-${side}-color`) !== 'rgba(0, 0, 0, 0)',
  ).length;
}

/**
 * The behaviour of the Loader in both implementations. It registers its cases in the `describe`
 * of a runner, which passes the mount of its framework.
 */
export function loaderContract(mount: Mount<LoaderProps>): void {
  it('uses medium geometry by default and for unsupported runtime sizes', async () => {
    const loader = await mount({});
    try {
      expect(Number.parseFloat(getComputedStyle(loader.part('indicator')).width)).toBe(
        expectedDiameter('medium', 'comfortable'),
      );
      for (const size of ['unsupported', null, 42]) {
        await loader.update({ size } as unknown as LoaderProps);
        expect(Number.parseFloat(getComputedStyle(loader.part('indicator')).width)).toBe(
          expectedDiameter('medium', 'comfortable'),
        );
      }
    } finally {
      await loader.unmount();
    }
  });

  it('is a progress indicator named by its label', async () => {
    const loader = await mount({ label: 'Saving' });
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Saving' });
    await loader.unmount();
  });

  it('takes its name from the configuration when it has no label', async () => {
    const loader = await mount({});
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Loading' });
    await loader.unmount();
  });

  it('takes every text from the configuration, in any language', async () => {
    configureUiCore({ labels: pseudoLabels });
    const loader = await mount({});
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: pseudoLabels.loader.label });
    await loader.unmount();
  });

  it('follows a change of the configuration while it is on the page', async () => {
    const loader = await mount({});
    configureUiCore({ labels: { loader: { label: 'Wird geladen' } } });
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Wird geladen' });
    await loader.unmount();
  });

  it('prefers its label to the configuration, and follows a new label', async () => {
    configureUiCore({ labels: { loader: { label: 'Wird geladen' } } });
    const loader = await mount({ label: 'Saving' });
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Saving' });
    await loader.update({ label: 'Sending' });
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Sending' });
    await loader.unmount();
  });

  it('keeps the name that the author of the page gave it', async () => {
    const loader = await mount(
      { label: 'Saving' },
      { attributes: { 'aria-label': 'Fetching orders' } },
    );
    await expect
      .poll(() => loader.accessibleNode())
      .toEqual({ role: 'progressbar', name: 'Fetching orders' });
    await loader.unmount();
  });

  it('renders no text of its own', async () => {
    const loader = await mount({});
    expect(loader.text().trim()).toBe('');
    await loader.unmount();
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`has the diameter of the token of each size in the ${density} density`, async () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const loader = await mount({ size }, { density });
        const { width, height } = layoutSize(loader.part('indicator'));
        expect({ size, width, height }).toEqual({
          size,
          width: expectedDiameter(size, density),
          height: expectedDiameter(size, density),
        });
        await loader.unmount();
      }
    });
  }

  it('changes its diameter with its size', async () => {
    const loader = await mount({ size: 'small' });
    await loader.update({ size: 'large' });
    expect(layoutSize(loader.part('indicator')).width).toBe(
      expectedDiameter('large', 'comfortable'),
    );
    await loader.unmount();
  });

  it('turns, and stops turning but keeps fading when the user prefers less motion', async () => {
    const loader = await mount({});
    const indicator = loader.part('indicator');
    expect(turns(indicator)).toBe(true);
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => turns(indicator)).toBe(false);
    expect(indicator.getAnimations()).not.toHaveLength(0);
    await loader.unmount();
  });

  it('keeps the gap in its arc in forced colours, so that its turning shows', async () => {
    const loader = await mount({});
    expect(visibleBorders(loader.part('indicator'))).toBe(3);
    await commands.emulateMedia({ forcedColors: 'active' });
    await expect.poll(() => visibleBorders(loader.part('indicator'))).toBe(3);
    await loader.unmount();
  });
}

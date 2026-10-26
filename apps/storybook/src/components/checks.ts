import { expect } from 'storybook/test';

import { contrastRatio } from '../contrast.ts';

/**
 * Checks that every loader in a story has a contrast of at least 3:1 with the surface it stands
 * on (WCAG 1.4.11). axe checks the contrast of text only, and the arc of a loader is a graphic.
 */
export async function expectGraphicContrast(canvas: HTMLElement, selector: string): Promise<void> {
  const elements = [...canvas.querySelectorAll<HTMLElement>(selector)];
  await expect(elements.length).toBeGreaterThan(0);
  for (const element of elements) {
    const frame = element.closest('[data-surface]');
    if (frame === null) {
      throw new Error(`${selector} stands on no surface`);
    }
    const ratio = contrastRatio(
      getComputedStyle(element).color,
      getComputedStyle(frame).backgroundColor,
    );
    await expect(ratio).toBeGreaterThanOrEqual(3);
  }
}

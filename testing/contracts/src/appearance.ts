import { expect } from 'vitest';

import type { Mounted, MountOptions } from './harness/types.ts';
import { tokenValue } from './tokens.ts';

/** Stable computed values for comparing defaults with explicit settings, without DOM snapshots. */
export function appearance(element: HTMLElement): readonly string[] {
  const style = getComputedStyle(element);
  return [
    'height',
    'font-size',
    'padding-block-start',
    'padding-inline-start',
    'border-top-width',
    'border-top-color',
    'background-color',
    'color',
    'position',
  ].map((property) => style.getPropertyValue(property));
}

/** Checks the shadow geometry and colour together, including a consumer override. */
export function expectTokenShadow(
  component: Mounted<object>,
  part: string,
  geometryToken: string,
  colourToken: string,
  theme: MountOptions['theme'],
): void {
  const element = component.part(part);
  const geometry = tokenValue(geometryToken, { theme });
  const reference = document.createElement('div');
  document.body.append(reference);
  try {
    reference.style.boxShadow = `${geometry} ${tokenValue('--color-shadow-default', { theme })}`;
    expect(getComputedStyle(element).boxShadow).toBe(getComputedStyle(reference).boxShadow);

    const customColour = 'rgb(123 45 67 / 60%)';
    component.element.style.setProperty(colourToken, customColour);
    reference.style.boxShadow = `${geometry} ${customColour}`;
    expect(getComputedStyle(element).boxShadow).toBe(getComputedStyle(reference).boxShadow);
  } finally {
    component.element.style.removeProperty(colourToken);
    reference.remove();
  }
}

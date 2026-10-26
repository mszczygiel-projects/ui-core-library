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

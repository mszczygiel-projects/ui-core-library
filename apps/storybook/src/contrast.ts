/** A colour as the browser computes it: `rgb(r, g, b)` or `rgba(r, g, b, a)`. */
function channels(color: string): [number, number, number, number] {
  const match = /^rgba?\(([^)]+)\)$/.exec(color.trim());
  const parts =
    match?.[1]
      ?.split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number) ?? [];
  const [r = Number.NaN, g = Number.NaN, b = Number.NaN, a = 1] = parts;
  if ([r, g, b, a].some(Number.isNaN)) {
    throw new Error(`Cannot read the colour ${color}`);
  }
  return [r, g, b, a];
}

function luminance(r: number, g: number, b: number): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The contrast ratio of WCAG between a colour and an opaque background, the colour composited
 * onto the background first when it is partly transparent.
 */
export function contrastRatio(color: string, background: string): number {
  const [r, g, b, a] = channels(color);
  const [br, bg, bb] = channels(background);
  const mix = (front: number, back: number) => front * a + back * (1 - a);
  const front = luminance(mix(r, br), mix(g, bg), mix(b, bb));
  const back = luminance(br, bg, bb);
  return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
}

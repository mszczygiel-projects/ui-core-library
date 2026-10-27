/** A colour as the browser computes it: sRGB channels from 0 to 255 and an alpha from 0 to 1. */
interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

function parse(color: string): Rgba {
  const channels = /rgba?\(([^)]+)\)/
    .exec(color)?.[1]
    ?.split(/[\s,/]+/)
    .filter(Boolean);
  if (channels === undefined || channels.length < 3) {
    throw new Error(`Cannot read the colour ${color}`);
  }
  const [r, g, b, a] = channels.map(Number);
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: a ?? 1 };
}

function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (front: number, back: number) => front * top.a + back * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function parentAcrossShadow(element: Element): Element | null {
  if (element.parentElement !== null) {
    return element.parentElement;
  }
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

/**
 * The opaque colour behind an element: its background composited over those of its ancestors,
 * across shadow roots, and over white at the top of the page.
 */
export function backgroundBehind(element: Element): Rgba {
  const layers: Rgba[] = [];
  for (let node: Element | null = element; node !== null; node = parentAcrossShadow(node)) {
    const layer = parse(getComputedStyle(node).backgroundColor);
    if (layer.a > 0) {
      layers.push(layer);
      if (layer.a === 1) {
        break;
      }
    }
  }
  return layers.reduceRight<Rgba>((below, layer) => over(layer, below), {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  });
}

function luminance({ r, g, b }: Rgba): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The WCAG contrast ratio of the text of an element against the colour behind it. */
export function textContrast(element: Element): number {
  const background = backgroundBehind(element);
  const text = over(parse(getComputedStyle(element).color), background);
  const [light, dark] = [luminance(text), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

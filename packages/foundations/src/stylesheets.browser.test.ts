import { afterEach, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';

import type { TailwindOrder } from './stylesheets.browser.ts';

const OVERRIDE = 'rgb(1, 2, 3)';
const CANDIDATES = ['bg-background-default', 'p-4'];

interface Page {
  /** The stylesheets in the order of the page, each in its own `<style>`. */
  readonly styles: readonly string[];
  readonly theme?: 'dark';
}

const frames: HTMLIFrameElement[] = [];

afterEach(() => {
  for (const frame of frames.splice(0)) {
    frame.remove();
  }
});

/** A page with the stylesheets, and its probe: an element with the utilities of the candidates. */
async function probeOf({ styles, theme }: Page): Promise<HTMLElement> {
  const frame = document.createElement('iframe');
  frames.push(frame);
  const loaded = new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
  });
  const head = styles.map((css) => `<style>${css}</style>`).join('');
  const themeAttribute = theme === undefined ? '' : ` data-theme="${theme}"`;
  frame.srcdoc = `<!doctype html><html${themeAttribute}><head>${head}</head><body><div id="probe" class="${CANDIDATES.join(' ')}" style="color: var(--color-background-default)"></div></body></html>`;
  document.body.append(frame);
  await loaded;
  const probe = frame.contentDocument?.getElementById('probe');
  if (probe === null || probe === undefined) {
    throw new Error('The page has no probe');
  }
  return probe;
}

/** What the probe resolves, read at once, since computed styles are live. */
async function resolved(page: Page) {
  const style = getComputedStyle(await probeOf(page));
  return {
    token: style.color,
    background: style.backgroundColor,
    padding: style.paddingTop,
    fontMono: style.getPropertyValue('--font-mono').trim(),
  };
}

const brandOverride = `:root { --color-background-default: ${OVERRIDE}; }`;

describe('tokens.css', () => {
  it('resolves every theme, and loses to a declaration outside any layer imported before it', async () => {
    const tokens = await commands.readStylesheet('tokens.css');
    const light = await resolved({ styles: [tokens] });
    const dark = await resolved({ styles: [tokens], theme: 'dark' });
    expect(light.token).toMatch(/^rgb/);
    expect(dark.token).toMatch(/^rgb/);
    expect(dark.token).not.toBe(light.token);
    expect((await resolved({ styles: [brandOverride, tokens] })).token).toBe(OVERRIDE);
    expect((await resolved({ styles: [tokens, brandOverride] })).token).toBe(OVERRIDE);
  });

  it('loses to a layer of the page that comes after its own in the order of the layers', async () => {
    const tokens = await commands.readStylesheet('tokens.css');
    const layered = `@layer app { ${brandOverride} }`;
    expect((await resolved({ styles: [tokens, layered] })).token).toBe(OVERRIDE);
    expect((await resolved({ styles: [layered, tokens] })).token).not.toBe(OVERRIDE);
    const ordered = `@layer theme, base, components, utilities, ui-core-tokens, app; ${layered}`;
    expect((await resolved({ styles: [ordered, tokens] })).token).toBe(OVERRIDE);
  });
});

describe('tailwind.css', () => {
  const orders: readonly TailwindOrder[] = ['tailwind-first', 'tokens-first'];

  it('declares no token again as a var() of itself', async () => {
    const css = await commands.compileTailwind('tailwind-first', CANDIDATES);
    expect(css).not.toMatch(/(--[\w-]+):\s*var\(\1\)/);
  });

  for (const order of orders) {
    it(`gives the utilities the values of the tokens, ${order}`, async () => {
      const tokens = await commands.readStylesheet('tokens.css');
      const tailwind = await commands.compileTailwind(order, CANDIDATES);
      for (const theme of [undefined, 'dark'] as const) {
        const alone = await resolved({ styles: [tokens], theme });
        const page = await resolved({ styles: [tailwind], theme });
        expect(page.token).toBe(alone.token);
        expect(page.background).toBe(alone.token);
        expect(page.fontMono).toBe(alone.fontMono);
        expect(page.padding).toBe('16px');
      }
      const overridden = await resolved({ styles: [brandOverride, tailwind] });
      expect(overridden.background).toBe(OVERRIDE);
    });
  }
});

import '../../dist/components/ui-link-button.js';

import type { LinkButtonProps } from '@mszczygiel-projects/ui-core-shared/link-button';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

function create(): HTMLUiLinkButtonElement {
  return document.createElement('ui-link-button');
}

async function mount(props: Partial<LinkButtonProps> = {}): Promise<HTMLUiLinkButtonElement> {
  const link = Object.assign(create(), { href: '#pricing', ...props });
  link.textContent = 'See pricing';
  document.body.append(link);
  await nextRender();
  return link;
}

function anchor(link: HTMLElement): HTMLAnchorElement | null | undefined {
  return link.shadowRoot?.querySelector('a');
}

afterEach(() => {
  document.querySelectorAll('ui-link-button').forEach((node) => {
    node.remove();
  });
  history.replaceState(null, '', location.pathname + location.search);
});

describe('ui-link-button', () => {
  it('reflects only disabled to its host', async () => {
    const link = await mount({ target: '_blank', variant: 'outline', size: 'small' });
    expect(link.getAttributeNames()).toEqual([]);
    link.disabled = true;
    await nextRender();
    expect(link.getAttributeNames()).toEqual(['disabled']);
  });

  it('reads its public attributes and renders its defaults for unknown values', async () => {
    const link = create();
    for (const [name, value] of Object.entries({
      href: '/pricing',
      target: '_blank',
      rel: 'external',
      download: 'pricing.pdf',
      variant: 'tertiary',
      size: 'huge',
      label: 'Pricing plans',
    })) {
      link.setAttribute(name, value);
    }
    document.body.append(link);
    await nextRender();
    const native = anchor(link);
    expect(native?.getAttribute('href')).toBe('/pricing');
    expect(native?.getAttribute('target')).toBe('_blank');
    expect(native?.getAttribute('rel')).toBe('external');
    expect(native?.getAttribute('download')).toBe('pricing.pdf');
    expect(native?.getAttribute('aria-label')).toBe('Pricing plans');
    expect(native?.className).toBe('base action primary medium');
  });

  it('forwards a changing aria-label without writing author attributes', async () => {
    const link = await mount();
    link.setAttribute('aria-label', 'Pricing plans');
    await nextRender();
    expect(anchor(link)?.getAttribute('aria-label')).toBe('Pricing plans');
    expect(link.hasAttribute('role')).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('delegates focus and click to its native link', async () => {
    const link = await mount();
    link.focus();
    expect(link.shadowRoot?.activeElement).toBe(anchor(link));
    const clicked = vi.fn((event: Event) => {
      event.preventDefault();
    });
    link.addEventListener('click', clicked);
    link.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('clicks as any element before its first render', () => {
    const link = create();
    const clicked = vi.fn();
    link.addEventListener('click', clicked);
    link.click();
    expect(clicked).toHaveBeenCalledOnce();
  });
});

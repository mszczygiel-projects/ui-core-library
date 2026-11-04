import { describe, expect, it } from 'vitest';

import { breadcrumbListJsonLd } from './breadcrumb-list.ts';

const resolveUrl = (href: string) =>
  href.startsWith('/') ? `https://example.com${href}` : `https://example.com/shop/${href}`;

describe('breadcrumbListJsonLd', () => {
  it('lists the trail with positions, names and absolute URLs', () => {
    const json: unknown = JSON.parse(
      breadcrumbListJsonLd(
        [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop/' }, { label: 'Shoes' }],
        { resolveUrl },
      ),
    );
    expect(json).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://example.com/shop/' },
        { '@type': 'ListItem', position: 3, name: 'Shoes' },
      ],
    });
  });

  it('leaves out an item without an address before the last, and numbers the rest', () => {
    const json = JSON.parse(
      breadcrumbListJsonLd(
        [
          { label: 'Home', href: '/' },
          { label: 'Archive' },
          { label: 'Shoes', href: '' },
          { label: 'Boots', href: 'boots' },
        ],
        { resolveUrl },
      ),
    ) as { itemListElement: unknown[] };
    expect(json.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'Boots', item: 'https://example.com/shop/boots' },
    ]);
  });

  it('escapes a label that would close the script element', () => {
    const text = breadcrumbListJsonLd([{ label: '</script><b>' }], { resolveUrl });
    expect(text).not.toContain('<');
    expect(JSON.parse(text)).toEqual(
      expect.objectContaining({
        itemListElement: [{ '@type': 'ListItem', position: 1, name: '</script><b>' }],
      }),
    );
  });

  it('gives an empty list for an empty trail', () => {
    expect(JSON.parse(breadcrumbListJsonLd([], { resolveUrl }))).toEqual(
      expect.objectContaining({ itemListElement: [] }),
    );
  });
});

/** A step of a trail, as Breadcrumbs takes it: the icon plays no part in structured data. */
export interface BreadcrumbListItem {
  readonly label: string;
  readonly href?: string;
}

/** How the addresses of the items become the absolute URLs that structured data requires. */
export interface BreadcrumbListOptions {
  /**
   * Turns the address of an item into an absolute URL, such as
   * `(href) => new URL(href, 'https://example.com').href`. The package reads no page, so the
   * application gives the origin.
   */
  readonly resolveUrl: (href: string) => string;
}

/**
 * The trail of Breadcrumbs as schema.org `BreadcrumbList` JSON-LD, the text of a
 * `<script type="application/ld+json">`. A search engine shows it as the path of the page in its
 * results. An item before the last one without an address is left out, since every item but the
 * last must name a URL; the last one, the current page, names it only when it has one. The text
 * escapes `<`, so a label cannot close the script element.
 */
export function breadcrumbListJsonLd(
  items: readonly BreadcrumbListItem[],
  options: BreadcrumbListOptions,
): string {
  const listed = items.filter(
    (item, index) => index === items.length - 1 || (item.href !== undefined && item.href !== ''),
  );
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: listed.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href === undefined || item.href === ''
        ? {}
        : { item: options.resolveUrl(item.href) }),
    })),
  };
  return JSON.stringify(list).replaceAll('<', '\\u003c');
}

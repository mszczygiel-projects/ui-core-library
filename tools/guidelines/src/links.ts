import { toId } from 'storybook/internal/csf';

import type { DocumentedComponent } from './ui-library.ts';

/** The documentation site, which `storybook.yml` publishes from main. */
export const SITE_URL = 'https://mszczygiel-projects.github.io/ui-core-library/';

/** The title the `<Meta>` block of a documentation page gives it in the sidebar. */
export function titleOf(page: string): string {
  const title = /<Meta\s[^>]*title="([^"]+)"/.exec(page)?.[1];
  if (title === undefined) {
    throw new Error('The page has no <Meta title="…"> block');
  }
  return title;
}

/**
 * The address of a documentation page on the site. Storybook builds the id of an MDX page from its
 * title and the name Docs, so its own function builds it here.
 */
export function documentationUrl(page: string): string {
  return `${SITE_URL}?path=/docs/${toId(titleOf(page), 'Docs')}`;
}

/** A component set of [Core] UI Library and the page that its documentation link opens. */
export interface DocumentationLink {
  readonly name: string;
  readonly url: string;
}

/**
 * The documentation links of the component sets, by node in [Core] UI Library. A part links to the
 * page of the component it belongs to, which documents it.
 */
export function documentationLinks(
  components: readonly DocumentedComponent[],
): Record<string, DocumentationLink> {
  return Object.fromEntries(
    components.flatMap(({ spec, page }) =>
      spec.figma === null ? [] : [[spec.figma, { name: spec.name, url: documentationUrl(page) }]],
    ),
  );
}

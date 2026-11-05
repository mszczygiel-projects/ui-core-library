import { specs } from '@mszczygiel-projects/ui-core-shared/components';
import { describe, expect, it } from 'vitest';

import { documentedComponents } from './build.ts';
import { documentationLinks, documentationUrl, SITE_URL, titleOf } from './links.ts';

const links = documentationLinks(documentedComponents());

describe('the documentation links of the component sets', () => {
  it.each(specs.filter((spec) => spec.figma !== null).map((spec) => [spec.name, spec] as const))(
    'open the page of %s, or of the component it belongs to',
    (_name, spec) => {
      const page = `Components/${spec.category}/${spec.partOf ?? spec.name}/Docs`;
      const id = page.toLowerCase().replaceAll('/', '-');
      expect(links[spec.figma ?? '']).toEqual({
        name: spec.name,
        url: `${SITE_URL}?path=/docs/${id}--docs`,
      });
    },
  );

  it('cover every component set of [Core] UI Library and nothing else', () => {
    expect(Object.keys(links).sort()).toEqual(
      specs.flatMap((spec) => (spec.figma === null ? [] : [spec.figma])).sort(),
    );
  });

  it('read the title of the Meta block, wherever its attributes are', () => {
    expect(
      titleOf('import x from "y";\n\n<Meta of={x} title="Components/Actions/Button/Docs" />'),
    ).toBe('Components/Actions/Button/Docs');
    expect(documentationUrl('<Meta title="Components/Content/Tabs/Docs" />')).toBe(
      `${SITE_URL}?path=/docs/components-content-tabs-docs--docs`,
    );
  });

  it('reject a page without a title', () => {
    expect(() => titleOf('# Button')).toThrow('<Meta title');
  });
});

import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { AccordionItem } from '../accordion-item/AccordionItem.tsx';
import { Accordion } from './Accordion.tsx';

describe('Accordion', () => {
  it('passes its ref and the attributes of the page to its root element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Accordion ref={ref} data-testid="faq">
        <AccordionItem label="Shipping">Content</AccordionItem>
      </Accordion>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.dataset['testid']).toBe('faq');
  });
});

import { Accordion } from '@mszczygiel-projects/ui-core-react';
import type { AccordionItemOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/accordion-item';

import type { AccordionContractProps } from '../specs/accordion.contract.ts';
import { ControlledAccordionItem } from './accordion-item.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties and the sections as ui-accordion-item children, as a page would. */
export const mountWebComponentAccordion = webComponentMount<AccordionContractProps>(
  'ui-accordion',
  (element, { sections, onOpenChange, ...properties }) => {
    Object.assign(element, properties);
    if (sections !== undefined && element.childElementCount === 0) {
      element.replaceChildren(
        ...sections.map(({ content, ...section }) => {
          const item = Object.assign(document.createElement('ui-accordion-item'), section);
          item.textContent = content;
          if (onOpenChange !== undefined) {
            item.addEventListener('ui-open-change', (event) => {
              const { detail } = event as CustomEvent<AccordionItemOpenChangeDetail<Event>>;
              const { value, ...details } = detail;
              if (onOpenChange(section.label, value, details) === false) {
                event.preventDefault();
              }
            });
          }
          return item;
        }),
      );
    }
  },
);

/** The sections, expressed as controlled AccordionItem children. */
function ReactAccordion({ sections = [], onOpenChange, ...props }: AccordionContractProps) {
  return (
    <Accordion {...props}>
      {sections.map(({ content, ...section }) => (
        <ControlledAccordionItem
          key={section.label}
          {...section}
          onOpenChange={(open, details) => onOpenChange?.(section.label, open, details)}
        >
          {content}
        </ControlledAccordionItem>
      ))}
    </Accordion>
  );
}

export const mountReactAccordion = reactMount(ReactAccordion, 'ui-accordion');

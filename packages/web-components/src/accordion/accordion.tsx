import type { AccordionProps } from '@mszczygiel-projects/ui-core-shared/accordion';
import { Component, Element, h, Prop, type VNode } from '@stencil/core';

import { accordionSectionsOf, registerAccordion } from '../internal/accordion.ts';

/**
 * A stack of sections whose headings show and hide their content.
 *
 * Its children are `ui-accordion-item` elements. Without `multiple`, a section that the user opens
 * closes the others; setting `open` on a section is left as it is. A line separates the sections.
 *
 * @slot - The sections, ui-accordion-item elements.
 * @part base - The wrapper of the sections.
 */
@Component({ tag: 'ui-accordion', styleUrl: 'accordion.css', shadow: true })
export class UiAccordion implements AccordionProps {
  @Element() host!: HTMLUiAccordionElement;

  /** Lets several sections stay open at once. Without it, opening a section closes the others. */
  @Prop() multiple = false;

  connectedCallback(): void {
    registerAccordion(this.host, {
      opened: (opened) => {
        if (this.multiple) {
          return;
        }
        for (const section of accordionSectionsOf(this.host)) {
          if (section !== opened) {
            section.close();
          }
        }
      },
    });
  }

  render(): VNode {
    return (
      <div part="base" class="base">
        <slot />
      </div>
    );
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiAccordion, keyof AccordionProps>;

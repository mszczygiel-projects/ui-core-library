import type { AccordionItemOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/accordion-item';

/**
 * The detail of `ui-open-change` of AccordionItem, with the event that asked it to open or close.
 * It lives in a module of its own so that the declarations Stencil writes can import it.
 */
export type AccordionItemOpenChange = AccordionItemOpenChangeDetail<Event>;

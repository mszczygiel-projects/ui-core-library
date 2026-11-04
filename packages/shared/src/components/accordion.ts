import { defineComponent } from './component.ts';

/** The specification of Accordion. */
export const accordion = defineComponent({
  name: 'Accordion',
  tag: 'ui-accordion',
  category: 'Content',
  status: 'in-progress',
  figma: '3215:70',
  design: { flags: [], booleans: [], codeOnly: ['multiple'], previews: {} },
  summary: 'A stack of sections whose headings show and hide their content.',
  options: {},
  labels: [],
  parts: ['base'],
  slots: [],
  events: [],
  stories: ['Playground', 'Multiple', 'WithDisabledItem', 'OnSurfaces'],
  exceptions: [
    {
      items: ['ui-open-change'],
      reason:
        'Each AccordionItem reports its own request to open or close. When one opens and multiple is off, the group closes the others by setting their open, which the web component reports as nothing, since setting open reports nothing. React calls onOpenChange of each closed item with the reason group, because a controlled item stays open until its parent agrees.',
    },
  ],
});

/** The props both implementations of Accordion share. */
export interface AccordionProps {
  /**
   * Lets several sections stay open at once. Without it, opening a section closes the others.
   * @default false
   */
  multiple?: boolean;
}

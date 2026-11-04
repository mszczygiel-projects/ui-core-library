// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3215-68
// source=packages/react/src/accordion-item/AccordionItem.tsx
// component=AccordionItem
import figma from 'figma';

const instance = figma.selectedInstance;
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');

// Interaction previews browser states; the content is the page's own.
export default {
  example: figma.code`<AccordionItem label={${JSON.stringify(label)}}${open ? ' defaultOpen' : ''}${disabled ? ' disabled' : ''}>Content</AccordionItem>`,
  imports: ['import { AccordionItem } from "@mszczygiel-projects/ui-core-react"'],
  id: 'accordion-item',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3215-70
// source=packages/react/src/accordion/Accordion.tsx
// component=Accordion
import figma from 'figma';

const instance = figma.selectedInstance;
// The sections are the AccordionItem instances of the accordion, each with its own snippet.
const sections = instance
  .findConnectedInstances((node) => node.codeConnectId() === 'accordion-item')
  .flatMap((section) => (section.type === 'INSTANCE' ? [section.executeTemplate().example] : []));

export default {
  example: figma.code`<Accordion>${sections}</Accordion>`,
  imports: ['import { Accordion } from "@mszczygiel-projects/ui-core-react"'],
  id: 'accordion',
  metadata: { nestable: true },
};

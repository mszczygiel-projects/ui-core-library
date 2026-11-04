// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3215-70
// source=packages/web-components/src/accordion/accordion.tsx
// component=ui-accordion
import figma from 'figma';

const instance = figma.selectedInstance;
// The sections are the AccordionItem instances of the accordion, each with its own snippet.
const sections = instance
  .findConnectedInstances((node) => node.codeConnectId() === 'ui-accordion-item')
  .flatMap((section) => (section.type === 'INSTANCE' ? [section.executeTemplate().example] : []));

export default {
  example: figma.code`<ui-accordion>${sections}</ui-accordion>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/accordion'"],
  id: 'ui-accordion',
  metadata: { nestable: true },
};

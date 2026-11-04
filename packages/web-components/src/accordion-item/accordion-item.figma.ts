// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3215-68
// source=packages/web-components/src/accordion-item/accordion-item.tsx
// component=ui-accordion-item
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');

// Interaction previews browser states; the content is the page's own.
export default {
  example: figma.code`<ui-accordion-item label="${escape(label)}"${open ? ' open' : ''}${disabled ? ' disabled' : ''}>Content</ui-accordion-item>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/accordion-item'"],
  id: 'ui-accordion-item',
  metadata: { nestable: true },
};

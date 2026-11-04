// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3225-158
// source=packages/web-components/src/tab/tab.tsx
// component=ui-tab
import figma from 'figma';

const instance = figma.selectedInstance;
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const label = instance.getString('label');
const value = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

// The icon is a property that takes an SVG string, which a script sets; variant, orientation and
// selected follow Tabs, and interaction previews browser states.
export default {
  example: figma.code`<ui-tab value="${escape(value)}" label="${escape(label)}"${disabled ? ' disabled' : ''}>Content</ui-tab>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/tab'"],
  id: 'ui-tab',
  metadata: { nestable: true },
};

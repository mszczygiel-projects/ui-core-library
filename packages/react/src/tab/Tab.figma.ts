// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3225-158
// source=packages/react/src/tab/Tab.tsx
// component=Tab
import figma from 'figma';

const instance = figma.selectedInstance;
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const value = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
const icon = instance.getInstanceSwap('icon');
const shown =
  instance.getBoolean('hasIcon') && icon?.type === 'INSTANCE'
    ? icon.executeTemplate().example
    : undefined;

// Variant, orientation and selected follow Tabs, and interaction previews browser states.
export default {
  example: figma.code`<Tab value=${JSON.stringify(value)} label=${JSON.stringify(label)}${shown ? figma.code` icon={${shown}}` : ''}${disabled ? ' disabled' : ''}>Content</Tab>`,
  imports: ['import { Tab } from "@mszczygiel-projects/ui-core-react"'],
  id: 'tab',
  metadata: { nestable: true },
};

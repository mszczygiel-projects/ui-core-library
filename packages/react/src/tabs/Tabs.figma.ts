// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3226-82
// source=packages/react/src/tabs/Tabs.tsx
// component=Tabs
import figma from 'figma';

const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', { underline: 'underline', segmented: 'segmented' });
const orientation = instance.getEnum('orientation', {
  horizontal: 'horizontal',
  vertical: 'vertical',
});
// The tabs are the Tab instances of the list, each with its own snippet.
const tabs = instance
  .findConnectedInstances((node) => node.codeConnectId() === 'tab')
  .flatMap((tab) => (tab.type === 'INSTANCE' ? [tab.executeTemplate().example] : []));

export default {
  example: figma.code`<Tabs${variant === 'underline' ? '' : figma.code` variant="${variant}"`}${orientation === 'horizontal' ? '' : figma.code` orientation="${orientation}"`}>${tabs}</Tabs>`,
  imports: ['import { Tabs } from "@mszczygiel-projects/ui-core-react"'],
  id: 'tabs',
  metadata: { nestable: true },
};

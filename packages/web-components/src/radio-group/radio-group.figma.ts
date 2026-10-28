// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2997-163
// source=packages/web-components/src/radio-group/radio-group.tsx
// component=ui-radio-group
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const orientation = instance.getEnum('orientation', {
  vertical: 'vertical',
  horizontal: 'horizontal',
});
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
// The options are the RadioField instances of the group, each with its own snippet.
const options = instance
  .findConnectedInstances((node) => node.codeConnectId() === 'ui-radio-field')
  .flatMap((option) => (option.type === 'INSTANCE' ? [option.executeTemplate().example] : []));

export default {
  example: figma.code`<ui-radio-group${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${orientation === 'vertical' ? '' : figma.code` orientation="${orientation}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}>${options}</ui-radio-group>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/radio-group'"],
  id: 'ui-radio-group',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2997-163
// source=packages/react/src/radio-group/RadioGroup.tsx
// component=RadioGroup
import figma from 'figma';

const instance = figma.selectedInstance;
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
  .findConnectedInstances((node) => node.codeConnectId() === 'radio-field')
  .flatMap((option) => (option.type === 'INSTANCE' ? [option.executeTemplate().example] : []));

export default {
  example: figma.code`<RadioGroup${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${orientation === 'vertical' ? '' : figma.code` orientation="${orientation}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}>${options}</RadioGroup>`,
  imports: ['import { RadioGroup } from "@mszczygiel-projects/ui-core-react"'],
  id: 'radio-group',
  metadata: { nestable: true },
};

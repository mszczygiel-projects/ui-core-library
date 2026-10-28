// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1141
// source=packages/react/src/checkbox-field/CheckboxField.tsx
// component=CheckboxField
import figma from 'figma';

const instance = figma.selectedInstance;
const checked = instance.getEnum('checked', { false: 'false', true: 'true' }) === 'true';
const indeterminate =
  instance.getEnum('indeterminate', { false: 'false', true: 'true' }) === 'true';
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;

// Interaction previews browser states; it is not a component prop.
export default {
  example: figma.code`<CheckboxField${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${checked ? ' defaultChecked' : ''}${indeterminate ? ' indeterminate' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''} />`,
  imports: ['import { CheckboxField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'checkbox-field',
  metadata: { nestable: true },
};

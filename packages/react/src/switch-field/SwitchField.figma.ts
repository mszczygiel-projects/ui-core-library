// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2251-2499
// source=packages/react/src/switch-field/SwitchField.tsx
// component=SwitchField
import figma from 'figma';

const instance = figma.selectedInstance;
const checked = instance.getEnum('checked', { false: 'false', true: 'true' }) === 'true';
const labelPosition = instance.getEnum('labelPosition', { start: 'start', end: 'end' });
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
const glyph = (property: string) => {
  const icon = instance.getInstanceSwap(property);
  return instance.getBoolean('showIcons') && icon?.type === 'INSTANCE'
    ? icon.executeTemplate().example
    : undefined;
};
const iconOn = glyph('iconOn');
const iconOff = glyph('iconOff');

// Interaction previews browser states; it is not a component prop.
export default {
  example: figma.code`<SwitchField${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${labelPosition === 'end' ? '' : figma.code` labelPosition="${labelPosition}"`}${checked ? ' defaultChecked' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}${iconOn ? figma.code` iconOn={${iconOn}}` : ''}${iconOff ? figma.code` iconOff={${iconOff}}` : ''} />`,
  imports: ['import { SwitchField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'switch-field',
  metadata: { nestable: true },
};

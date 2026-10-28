// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1217-1382
// source=packages/react/src/radio-field/RadioField.tsx
// component=RadioField
import figma from 'figma';

const instance = figma.selectedInstance;
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
// Figma has no value: the snippet derives one from the label for the developer to replace.
const value = label.toLowerCase().trim().replaceAll(/\s+/g, '-');

// Checked and state preview what the group sets; interaction previews browser states.
export default {
  example: figma.code`<RadioField value={${JSON.stringify(value)}}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${disabled ? ' disabled' : ''} />`,
  imports: ['import { RadioField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'radio-field',
  metadata: { nestable: true },
};

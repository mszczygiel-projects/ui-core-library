// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1217-1382
// source=packages/web-components/src/radio-field/radio-field.tsx
// component=ui-radio-field
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
// Figma has no value: the snippet derives one from the label for the developer to replace.
const value = label.toLowerCase().trim().replaceAll(/\s+/g, '-');

// Checked and state preview what the group sets; interaction previews browser states.
export default {
  example: figma.code`<ui-radio-field value="${escape(value)}"${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${disabled ? ' disabled' : ''}></ui-radio-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/radio-field'"],
  id: 'ui-radio-field',
  metadata: { nestable: true },
};

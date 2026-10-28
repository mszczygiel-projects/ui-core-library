// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1141
// source=packages/web-components/src/checkbox-field/checkbox-field.tsx
// component=ui-checkbox-field
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const checked = instance.getEnum('checked', { false: 'false', true: 'true' }) === 'true';
const indeterminate =
  instance.getEnum('indeterminate', { false: 'false', true: 'true' }) === 'true';
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;

// Interaction previews browser states; it is not an element attribute.
export default {
  example: figma.code`<ui-checkbox-field${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${checked ? ' checked' : ''}${indeterminate ? ' indeterminate' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}></ui-checkbox-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/checkbox-field'"],
  id: 'ui-checkbox-field',
  metadata: { nestable: true },
};

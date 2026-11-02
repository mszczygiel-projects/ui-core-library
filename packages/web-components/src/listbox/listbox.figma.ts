// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3031-560
// source=packages/web-components/src/listbox/listbox.tsx
// component=ui-listbox
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const multiple = instance.getEnum('multiple', { false: 'false', true: 'true' }) === 'true';
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;

// The options are data, which a script sets as the options property of the element.
export default {
  example: figma.code`<ui-listbox${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${multiple ? ' multiple' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}></ui-listbox>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/listbox'"],
  id: 'ui-listbox',
  metadata: { nestable: true },
};

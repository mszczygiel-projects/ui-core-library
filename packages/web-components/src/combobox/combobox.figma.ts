// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2273-665
// source=packages/web-components/src/combobox/combobox.tsx
// component=ui-combobox
import figma from 'figma';
const instance = figma.selectedInstance;
// Each variant holds an exposed TextField, named field, whose properties designers set. Its value
// shows the query or the label of the chosen option, and its trailing icon is the arrow of this
// component. The variant open only previews the list, which code opens.
const nested = instance.findInstance('field');
const field = nested.type === 'INSTANCE' ? nested : instance;
const variant = field.getEnum('variant', {
  outline: 'outline',
  filled: 'filled',
  underlined: 'underlined',
});
const size = field.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });
const labelPlacement = field.getEnum('labelPlacement', {
  top: 'top',
  floating: 'floating',
  inner: 'inner',
});
const state = field.getEnum('state', { default: 'default', error: 'error', success: 'success' });
const disabled = field.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = field.getString('label');
const placeholder = field.getString('placeholder');
const hint = field.getBoolean('showHint') ? field.getString('hint') : undefined;
const clearable = instance.getBoolean('clearable');
const multiple = instance.getEnum('multiple', { false: 'false', true: 'true' }) === 'true';
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
// The options are data, which a script sets as the options property of the element.
export default {
  example: figma.code`<ui-combobox${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${multiple ? ' multiple' : ''}${clearable ? ' clearable' : ''}${disabled ? ' disabled' : ''}></ui-combobox>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/combobox'"],
  id: 'ui-combobox',
  metadata: { nestable: true },
};

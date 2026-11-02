// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1370-179
// source=packages/web-components/src/select-field/select-field.tsx
// component=ui-select-field
import figma from 'figma';
const instance = figma.selectedInstance;
// Each variant holds an exposed TextField, named field, whose properties designers set. Its value
// shows the label of the chosen option, and its trailing icon is the arrow of this component.
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
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
// The options are data, which a script sets as the options property of the element.
export default {
  example: figma.code`<ui-select-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${clearable ? ' clearable' : ''}${disabled ? ' disabled' : ''}></ui-select-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/select-field'"],
  id: 'ui-select-field',
  metadata: { nestable: true },
};

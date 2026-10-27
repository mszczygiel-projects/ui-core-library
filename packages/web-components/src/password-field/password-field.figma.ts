// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=229-3491
// source=packages/web-components/src/password-field/password-field.tsx
// component=ui-password-field
import figma from 'figma';
const instance = figma.selectedInstance;
// Each variant holds an exposed TextField, named field, whose properties designers set. Its icon
// properties hold the button of this component and never become props.
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
const value = field.getString('value');
const hint = field.getBoolean('showHint') ? field.getString('hint') : undefined;
const revealed = instance.getEnum('revealed', { false: 'false', true: 'true' }) === 'true';
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
export default {
  example: figma.code`<ui-password-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${value ? figma.code` value="${escape(value)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${disabled ? ' disabled' : ''}${revealed ? ' revealed' : ''}></ui-password-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/password-field'"],
  id: 'ui-password-field',
  metadata: { nestable: true },
};

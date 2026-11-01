// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2193-2228
// source=packages/web-components/src/number-field/number-field.tsx
// component=ui-number-field
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
// Figma display text cannot determine a canonical value or its locale.
const hint = field.getBoolean('showHint') ? field.getString('hint') : undefined;
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const controls = instance.getEnum('controls', { none: 'none', inline: 'inline' });
export default {
  example: figma.code`<ui-number-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${disabled ? ' disabled' : ''}${controls === 'inline' ? ' controls="inline"' : ''}></ui-number-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/number-field'"],
  id: 'ui-number-field',
  metadata: { nestable: true },
};

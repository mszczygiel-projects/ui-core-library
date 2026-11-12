// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2175-457
// source=packages/web-components/src/textarea-field/textarea-field.tsx
// component=ui-textarea-field
import figma from 'figma';
const instance = figma.selectedInstance;
const field = instance;
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
// showLabel stands for hideLabel inverted, since a Figma boolean can only show a layer.
const hideLabel = !field.getBoolean('showLabel');
const labelHint = field.getBoolean('showLabelHint') ? field.getString('labelHint') : undefined;
// interaction (rest, active, focus) and valueState (empty, filled) preview browser-derived states.
// Neither becomes a prop. Keep valueState consistent with value in Figma.
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
export default {
  example: figma.code`<ui-textarea-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${value ? figma.code` value="${escape(value)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${labelHint ? figma.code` label-hint="${escape(labelHint)}"` : ''}${hideLabel ? ' hide-label' : ''}${disabled ? ' disabled' : ''}></ui-textarea-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/textarea-field'"],
  id: 'ui-textarea-field',
  metadata: { nestable: true },
};

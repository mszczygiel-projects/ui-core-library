// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=144-293
// source=packages/web-components/src/text-field/text-field.tsx
// component=ui-text-field
import figma from 'figma';
const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', {
  outline: 'outline',
  filled: 'filled',
  underlined: 'underlined',
});
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });
const labelPlacement = instance.getEnum('labelPlacement', {
  top: 'top',
  floating: 'floating',
  inner: 'inner',
});
const state = instance.getEnum('state', { default: 'default', error: 'error', success: 'success' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const placeholder = instance.getString('placeholder');
const value = instance.getString('value');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
const leadingIcon = instance.getInstanceSwap('leadingIcon');
const trailingIcon = instance.getInstanceSwap('trailingIcon');
const leading =
  instance.getBoolean('showLeadingIcon') && leadingIcon?.type === 'INSTANCE'
    ? leadingIcon.executeTemplate().example
    : undefined;
const trailing =
  instance.getBoolean('showTrailingIcon') && trailingIcon?.type === 'INSTANCE'
    ? trailingIcon.executeTemplate().example
    : undefined;
// interaction (rest, active, focus) and valueState (empty, filled) preview browser-derived states.
// Neither becomes a prop. Keep valueState consistent with value in Figma.
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
export default {
  example: figma.code`<ui-text-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${value ? figma.code` value="${escape(value)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${disabled ? ' disabled' : ''}>${leading ? figma.code`<span slot="leading-icon">${leading}</span>` : ''}${trailing ? figma.code`<span slot="trailing-icon">${trailing}</span>` : ''}</ui-text-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/text-field'"],
  id: 'ui-text-field',
  metadata: { nestable: true },
};

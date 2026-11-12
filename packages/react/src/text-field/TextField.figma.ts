// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=144-293
// source=packages/react/src/text-field/TextField.tsx
// component=TextField
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
// showLabel stands for hideLabel inverted, since a Figma boolean can only show a layer.
const hideLabel = !instance.getBoolean('showLabel');
const labelHint = instance.getBoolean('showLabelHint')
  ? instance.getString('labelHint')
  : undefined;
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
export default {
  example: figma.code`<TextField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` labelPlacement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${placeholder ? figma.code` placeholder={${JSON.stringify(placeholder)}}` : ''}${value ? figma.code` defaultValue={${JSON.stringify(value)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${labelHint ? figma.code` labelHint={${JSON.stringify(labelHint)}}` : ''}${hideLabel ? ' hideLabel' : ''}${disabled ? ' disabled' : ''}${leading ? figma.code` leadingIcon={${leading}}` : ''}${trailing ? figma.code` trailingIcon={${trailing}}` : ''} />`,
  imports: ['import { TextField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'text-field',
  metadata: { nestable: true },
};

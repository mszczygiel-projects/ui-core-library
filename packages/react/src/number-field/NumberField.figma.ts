// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2193-2228
// source=packages/react/src/number-field/NumberField.tsx
// component=NumberField
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
const controls = instance.getEnum('controls', { none: 'none', inline: 'inline' });
export default {
  example: figma.code`<NumberField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` labelPlacement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${placeholder ? figma.code` placeholder={${JSON.stringify(placeholder)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${disabled ? ' disabled' : ''}${controls === 'inline' ? ' controls="inline"' : ''} />`,
  imports: ['import { NumberField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'number-field',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2175-457
// source=packages/react/src/textarea-field/TextareaField.tsx
// component=TextareaField
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
// interaction (rest, active, focus) and valueState (empty, filled) preview browser-derived states.
// Neither becomes a prop. Keep valueState consistent with value in Figma.
export default {
  example: figma.code`<TextareaField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` labelPlacement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${placeholder ? figma.code` placeholder={${JSON.stringify(placeholder)}}` : ''}${value ? figma.code` defaultValue={${JSON.stringify(value)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${disabled ? ' disabled' : ''} />`,
  imports: ['import { TextareaField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'textarea-field',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1370-179
// source=packages/react/src/select-field/SelectField.tsx
// component=SelectField
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

// The options are data, which the design only shows; the snippet names the array they come from.
export default {
  example: figma.code`<SelectField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` labelPlacement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${placeholder ? figma.code` placeholder={${JSON.stringify(placeholder)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${clearable ? ' clearable' : ''}${disabled ? ' disabled' : ''} options={options} />`,
  imports: ['import { SelectField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'select-field',
  metadata: { nestable: true },
};

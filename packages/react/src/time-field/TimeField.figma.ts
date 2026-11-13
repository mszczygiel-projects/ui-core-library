// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3329-4
// source=packages/react/src/time-field/TimeField.tsx
// component=TimeField
import figma from 'figma';
const instance = figma.selectedInstance;
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
const hint = field.getBoolean('showHint') ? field.getString('hint') : undefined;
const hideLabel = !field.getBoolean('showLabel');
const labelHint = field.getBoolean('showLabelHint') ? field.getString('labelHint') : undefined;
// The displayed time and calendar state are previews, not a canonical value.
export default {
  example: figma.code`<TimeField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` labelPlacement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${labelHint ? figma.code` labelHint={${JSON.stringify(labelHint)}}` : ''}${hideLabel ? ' hideLabel' : ''}${disabled ? ' disabled' : ''} />`,
  imports: ['import { TimeField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'time-field',
  metadata: { nestable: true },
};

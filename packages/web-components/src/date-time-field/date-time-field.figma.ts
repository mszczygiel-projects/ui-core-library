// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3330-621
// source=packages/web-components/src/date-time-field/date-time-field.tsx
// component=ui-date-time-field
import figma from 'figma';
const instance = figma.selectedInstance;
const nested = instance.findInstance('field');
const field = nested.type === 'INSTANCE' ? nested : instance;
const hideCalendarButton = !field.getBoolean('showTrailingIcon');
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
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
// The displayed time and calendar state are previews, not a canonical value.
export default {
  example: figma.code`<ui-date-time-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${labelHint ? figma.code` label-hint="${escape(labelHint)}"` : ''}${hideCalendarButton ? ' hide-calendar-button' : ''}${hideLabel ? ' hide-label' : ''}${disabled ? ' disabled' : ''}></ui-date-time-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/date-time-field'"],
  id: 'ui-date-time-field',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3190-372
// source=packages/web-components/src/date-field/date-field.tsx
// component=ui-date-field
import figma from 'figma';
const instance = figma.selectedInstance;
// Each variant holds an exposed TextField, named field, whose properties designers set. Its icon
// properties hold the calendar button of this component and never become props; the open variant
// previews the calendar.
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
// The trailing icon of the field is the calendar button, which a designer hides there.
const hideCalendarButton = !field.getBoolean('showTrailingIcon');
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
export default {
  example: figma.code`<ui-date-field${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${labelPlacement === 'top' ? '' : figma.code` label-placement="${labelPlacement}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label="${escape(label)}"` : ''}${placeholder ? figma.code` placeholder="${escape(placeholder)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${hideCalendarButton ? ' hide-calendar-button' : ''}${disabled ? ' disabled' : ''}></ui-date-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/date-field'"],
  id: 'ui-date-field',
  metadata: { nestable: true },
};

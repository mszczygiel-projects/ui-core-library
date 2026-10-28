// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2251-2499
// source=packages/web-components/src/switch-field/switch-field.tsx
// component=ui-switch-field
import figma from 'figma';

const instance = figma.selectedInstance;
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const checked = instance.getEnum('checked', { false: 'false', true: 'true' }) === 'true';
const labelPosition = instance.getEnum('labelPosition', { start: 'start', end: 'end' });
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
const glyph = (property: string) => {
  const icon = instance.getInstanceSwap(property);
  return instance.getBoolean('showIcons') && icon?.type === 'INSTANCE'
    ? icon.executeTemplate().example
    : undefined;
};
const iconOn = glyph('iconOn');
const iconOff = glyph('iconOff');

// Interaction previews browser states; it is not an element attribute.
export default {
  example: figma.code`<ui-switch-field${label ? figma.code` label="${escape(label)}"` : ''}${hint ? figma.code` hint="${escape(hint)}"` : ''}${labelPosition === 'end' ? '' : figma.code` label-position="${labelPosition}"`}${checked ? ' checked' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''}>${iconOn ? figma.code`<span slot="icon-on">${iconOn}</span>` : ''}${iconOff ? figma.code`<span slot="icon-off">${iconOff}</span>` : ''}</ui-switch-field>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/switch-field'"],
  id: 'ui-switch-field',
  metadata: { nestable: true },
};

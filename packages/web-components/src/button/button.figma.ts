// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=179-100
// source=packages/web-components/src/button/button.tsx
// component=ui-button
import figma from 'figma';

const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'danger',
});
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const loading = instance.getEnum('loading', { false: 'false', true: 'true' }) === 'true';
const children = instance
  .getString('children')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
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

// Interaction previews browser states; it is not an element attribute.
export default {
  example: figma.code`<ui-button${variant === 'primary' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${disabled ? ' disabled' : ''}${loading ? ' loading' : ''}>${leading ? figma.code`<span slot="leading-icon">${leading}</span>` : ''}${children}${trailing ? figma.code`<span slot="trailing-icon">${trailing}</span>` : ''}</ui-button>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/button'"],
  id: 'ui-button',
  metadata: { nestable: true },
};

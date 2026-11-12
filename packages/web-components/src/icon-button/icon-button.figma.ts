// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=182-1049
// source=packages/web-components/src/icon-button/icon-button.tsx
// component=ui-icon-button
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
const shape = instance.getEnum('shape', { square: 'square', rounded: 'rounded' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const loading = instance.getEnum('loading', { false: 'false', true: 'true' }) === 'true';
const label = instance.name.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const icon = instance.getInstanceSwap('icon');
const glyph = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined;

// The layer name of the instance names the action, since the icon has no visible text.
// Interaction previews browser states; it is not an element attribute.
export default {
  example: figma.code`<ui-icon-button label="${label}"${variant === 'primary' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'square' ? '' : figma.code` shape="${shape}"`}${disabled ? ' disabled' : ''}${loading ? ' loading' : ''}>${glyph ? figma.code`<span slot="icon">${glyph}</span>` : ''}</ui-icon-button>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/icon-button'"],
  id: 'ui-icon-button',
  metadata: { nestable: true },
};

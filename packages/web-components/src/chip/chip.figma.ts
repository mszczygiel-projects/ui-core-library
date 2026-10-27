// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2068-2859
// source=packages/web-components/src/chip/chip.tsx
// component=ui-chip
import figma from 'figma';

const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', { outline: 'outline', subtle: 'subtle' });
const size = instance.getEnum('size', { small: 'small', medium: 'medium' });
const selected = instance.getEnum('selected', { false: 'false', true: 'true' }) === 'true';
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const dismissible = instance.getBoolean('dismissible');
const children = instance.getString('children').replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const icon = instance.getInstanceSwap('icon');
const glyph =
  instance.getBoolean('showIcon') && icon?.type === 'INSTANCE'
    ? icon.executeTemplate().example
    : undefined;
// A chip that only shows a value to remove is static; any other chip is a toggle.
const selectable = selected || !dismissible;

// Interaction previews browser states; it is not an element attribute.
export default {
  example: figma.code`<ui-chip${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${selectable ? ' selectable' : ''}${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}${dismissible ? ' dismissible' : ''}>${glyph ? figma.code`<span slot="icon">${glyph}</span>` : ''}${children}</ui-chip>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/chip'"],
  id: 'ui-chip',
  metadata: { nestable: true },
};

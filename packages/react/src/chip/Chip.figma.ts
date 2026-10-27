// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2068-2859
// source=packages/react/src/chip/Chip.tsx
// component=Chip
import figma from 'figma';

const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', { outline: 'outline', subtle: 'subtle' });
const size = instance.getEnum('size', { small: 'small', medium: 'medium' });
const selected = instance.getEnum('selected', { false: 'false', true: 'true' }) === 'true';
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const dismissible = instance.getBoolean('dismissible');
const children = instance.getString('children');
const icon = instance.getInstanceSwap('icon');
const glyph =
  instance.getBoolean('showIcon') && icon?.type === 'INSTANCE'
    ? icon.executeTemplate().example
    : undefined;
// A chip that only shows a value to remove is static; any other chip is a toggle.
const selectable = selected || !dismissible;

// Interaction previews browser states; it is not a component prop.
export default {
  example: figma.code`<Chip${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${selectable ? ' selectable' : ''}${selected ? ' defaultSelected' : ''}${disabled ? ' disabled' : ''}${dismissible ? ' dismissible' : ''}${glyph ? figma.code` icon={${glyph}}` : ''}>{${JSON.stringify(children)}}</Chip>`,
  imports: ['import { Chip } from "@mszczygiel-projects/ui-core-react"'],
  id: 'chip',
  metadata: { nestable: true },
};

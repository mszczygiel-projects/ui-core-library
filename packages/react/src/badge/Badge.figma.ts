// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2037-98
// source=packages/react/src/badge/Badge.tsx
// component=Badge
import figma from 'figma';

const instance = figma.selectedInstance;
const tone = instance.getEnum('tone', {
  neutral: 'neutral',
  brand: 'brand',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
});
const variant = instance.getEnum('variant', { solid: 'solid', subtle: 'subtle' });
const size = instance.getEnum('size', { small: 'small', medium: 'medium' });
const shape = instance.getEnum('shape', { rounded: 'rounded', square: 'square' });
const content = instance.getEnum('content', {
  label: 'label',
  'icon-label': 'icon-label',
  icon: 'icon',
});
const children = instance.getString('children');
const icon = instance.getInstanceSwap('icon');
const glyph =
  content !== 'label' && icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined;
const props = figma.code`${tone === 'neutral' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'rounded' ? '' : figma.code` shape="${shape}"`}${glyph ? figma.code` icon={${glyph}}` : ''}`;

// Content previews the layout that code derives from the content. A badge with only an icon is
// named by the layer name of the instance.
export default {
  example:
    content === 'icon'
      ? figma.code`<Badge label=${JSON.stringify(instance.name)}${props} />`
      : figma.code`<Badge${props}>{${JSON.stringify(children)}}</Badge>`,
  imports: ['import { Badge } from "@mszczygiel-projects/ui-core-react"'],
  id: 'badge',
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2037-98
// source=packages/web-components/src/badge/badge.tsx
// component=ui-badge
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
const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const children = escape(instance.getString('children'));
const icon = instance.getInstanceSwap('icon');
const glyph =
  content !== 'label' && icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined;

// Content previews the layout that code derives from the content. A badge with only an icon is
// named by the layer name of the instance.
export default {
  example: figma.code`<ui-badge${tone === 'neutral' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'rounded' ? '' : figma.code` shape="${shape}"`}${content === 'icon' ? figma.code` label="${escape(instance.name)}"` : ''}>${glyph ? figma.code`<span slot="icon">${glyph}</span>` : ''}${content === 'icon' ? '' : children}</ui-badge>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/badge'"],
  id: 'ui-badge',
  metadata: { nestable: true },
};

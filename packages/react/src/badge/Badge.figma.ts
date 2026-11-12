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
const content = instance.getEnum('content', { label: 'label', icon: 'icon' });
const children = instance.getString('children');
// A shown swap of the leading or trailing content renders its own snippet. Content `icon` shows
// only the leading content.
const swap = (name: 'leading' | 'trailing', shown: boolean) => {
  const node = instance.getInstanceSwap(name);
  return shown && node?.type === 'INSTANCE' ? node.executeTemplate().example : undefined;
};
const leading = swap('leading', content === 'icon' || instance.getBoolean('showLeading'));
const trailing = swap('trailing', content !== 'icon' && instance.getBoolean('showTrailing'));
const props = figma.code`${tone === 'neutral' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'rounded' ? '' : figma.code` shape="${shape}"`}${leading ? figma.code` leading={${leading}}` : ''}${trailing ? figma.code` trailing={${trailing}}` : ''}`;

// Content previews the layout that code derives from the content. A badge without text is named
// by the layer name of the instance.
export default {
  example:
    content === 'icon'
      ? figma.code`<Badge label=${JSON.stringify(instance.name)}${props} />`
      : figma.code`<Badge${props}>{${JSON.stringify(children)}}</Badge>`,
  imports: ['import { Badge } from "@mszczygiel-projects/ui-core-react"'],
  id: 'badge',
  metadata: { nestable: true },
};

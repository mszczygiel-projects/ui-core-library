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
const content = instance.getEnum('content', { label: 'label', icon: 'icon' });
const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const children = escape(instance.getString('children'));
// A shown swap of the leading or trailing content renders its own snippet. Content `icon` shows
// only the leading content.
const swap = (name: 'leading' | 'trailing', shown: boolean) => {
  const node = instance.getInstanceSwap(name);
  return shown && node?.type === 'INSTANCE' ? node.executeTemplate().example : undefined;
};
const leading = swap('leading', content === 'icon' || instance.getBoolean('showLeading'));
const trailing = swap('trailing', content !== 'icon' && instance.getBoolean('showTrailing'));

// Content previews the layout that code derives from the content. A badge without text is named
// by the layer name of the instance.
export default {
  example: figma.code`<ui-badge${tone === 'neutral' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'rounded' ? '' : figma.code` shape="${shape}"`}${content === 'icon' ? figma.code` label="${escape(instance.name)}"` : ''}>${leading ? figma.code`<span slot="leading">${leading}</span>` : ''}${content === 'icon' ? '' : children}${trailing ? figma.code`<span slot="trailing">${trailing}</span>` : ''}</ui-badge>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/badge'"],
  id: 'ui-badge',
  metadata: { nestable: true },
};

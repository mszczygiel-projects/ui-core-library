// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1731-2969
// source=packages/web-components/src/notification/notification.tsx
// component=ui-notification
import figma from 'figma';

const instance = figma.selectedInstance;
const tone = instance.getEnum('tone', {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
});
const variant = instance.getEnum('variant', { solid: 'solid', subtle: 'subtle' });
const hasLeadingIcon = instance.getBoolean('hasLeadingIcon');
const dismissible = instance.getBoolean('dismissible');
const heading = instance.getString('heading').replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const children = instance.getBoolean('description')
  ? instance.getString('children').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  : '';

// Description previews the layout that code derives from the content; it is not an element attribute.
export default {
  example: figma.code`<ui-notification${tone === 'info' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${heading === '' ? '' : figma.code` heading="${heading}"`}${hasLeadingIcon ? ' has-leading-icon' : ''}${dismissible ? ' dismissible' : ''}>${children}</ui-notification>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/notification'"],
  id: 'ui-notification',
  metadata: { nestable: true },
};

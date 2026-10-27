// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1731-2969
// source=packages/react/src/notification/Notification.tsx
// component=Notification
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
const heading = instance.getString('heading');
const children = instance.getBoolean('description') ? instance.getString('children') : '';

// Description previews the layout that code derives from the content; it is not a component prop.
export default {
  example: figma.code`<Notification${tone === 'info' ? '' : figma.code` tone="${tone}"`}${variant === 'solid' ? '' : figma.code` variant="${variant}"`}${heading === '' ? '' : figma.code` heading={${JSON.stringify(heading)}}`}${hasLeadingIcon ? ' hasLeadingIcon' : ''}${dismissible ? ' dismissible' : ''}${children === '' ? ' />' : figma.code`>{${JSON.stringify(children)}}</Notification>`}`,
  imports: ['import { Notification } from "@mszczygiel-projects/ui-core-react"'],
  id: 'notification',
  metadata: { nestable: true },
};

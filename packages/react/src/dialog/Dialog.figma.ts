// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2216-3109
// source=packages/react/src/dialog/Dialog.tsx
// component=Dialog
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
  large: 'large',
  fullscreen: 'fullscreen',
});
const hideCloseButton =
  instance.getEnum('hideCloseButton', { false: 'false', true: 'true' }) === 'true';
const heading = instance.getString('heading');
const description = instance.getBoolean('hasDescription') ? instance.getString('description') : '';
const hasFooter = instance.getBoolean('hasFooter');

// hasDescription and hasFooter preview the layout that code derives from the content.
export default {
  example: figma.code`<Dialog open={open} onOpenChange={setOpen}${heading === '' ? '' : figma.code` heading={${JSON.stringify(heading)}}`}${description === '' ? '' : figma.code` description={${JSON.stringify(description)}}`}${size === undefined || size === 'medium' ? '' : figma.code` size="${size}"`}${hideCloseButton ? ' hideCloseButton' : ''}${hasFooter ? ' footer={<>{/* actions */}</>}' : ''}>
  {/* content */}
</Dialog>`,
  imports: ['import { Dialog } from "@mszczygiel-projects/ui-core-react"'],
  id: 'dialog',
  metadata: { nestable: false },
};

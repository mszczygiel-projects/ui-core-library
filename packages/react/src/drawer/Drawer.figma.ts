// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2381-2696
// source=packages/react/src/drawer/Drawer.tsx
// component=Drawer
import figma from 'figma';

const instance = figma.selectedInstance;
const placement = instance.getEnum('placement', { start: 'start', end: 'end', bottom: 'bottom' });
const hideCloseButton =
  instance.getEnum('hideCloseButton', { false: 'false', true: 'true' }) === 'true';
const dragToDismiss = instance.getBoolean('dragToDismiss');

// Nothing visible names a drawer, so the template asks for a label.
export default {
  example: figma.code`<Drawer open={open} onOpenChange={setOpen} label="…"${placement === undefined || placement === 'end' ? '' : figma.code` placement="${placement}"`}${hideCloseButton ? ' hideCloseButton' : ''}${dragToDismiss ? ' dragToDismiss' : ''}>
  {/* content */}
</Drawer>`,
  imports: ['import { Drawer } from "@mszczygiel-projects/ui-core-react"'],
  id: 'drawer',
  metadata: { nestable: false },
};

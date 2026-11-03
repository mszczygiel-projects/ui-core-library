// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2381-2696
// source=packages/web-components/src/drawer/drawer.tsx
// component=ui-drawer
import figma from 'figma';

const instance = figma.selectedInstance;
const placement = instance.getEnum('placement', { start: 'start', end: 'end', bottom: 'bottom' });
const hideCloseButton =
  instance.getEnum('hideCloseButton', { false: 'false', true: 'true' }) === 'true';
const dragToDismiss = instance.getBoolean('dragToDismiss');

// Nothing visible names a drawer, so the template asks for a label.
export default {
  example: figma.code`<ui-drawer open label="…"${placement === undefined || placement === 'end' ? '' : figma.code` placement="${placement}"`}${hideCloseButton ? ' hide-close-button' : ''}${dragToDismiss ? ' drag-to-dismiss' : ''}>
  <!-- content -->
</ui-drawer>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/drawer'"],
  id: 'ui-drawer',
  metadata: { nestable: false },
};

// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3168-47
// source=packages/web-components/src/tooltip/tooltip.tsx
// component=ui-tooltip
import figma from 'figma';

const instance = figma.selectedInstance;
const content = instance.getString('content');
const showArrow = instance.getEnum('showArrow', { false: 'false', true: 'true' }) === 'true';

export default {
  example: figma.code`<ui-tooltip content="${content}"${showArrow ? ' show-arrow' : ''}>
  <!-- trigger -->
</ui-tooltip>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/tooltip'"],
  id: 'ui-tooltip',
  metadata: { nestable: false },
};

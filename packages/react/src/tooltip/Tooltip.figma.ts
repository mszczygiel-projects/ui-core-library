// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3168-47
// source=packages/react/src/tooltip/Tooltip.tsx
// component=Tooltip
import figma from 'figma';

const instance = figma.selectedInstance;
const content = instance.getString('content');
const showArrow = instance.getEnum('showArrow', { false: 'false', true: 'true' }) === 'true';

export default {
  example: figma.code`<Tooltip content="${content}"${showArrow ? ' showArrow' : ''}>
  {/* trigger */}
</Tooltip>`,
  imports: ['import { Tooltip } from "@mszczygiel-projects/ui-core-react"'],
  id: 'tooltip',
  metadata: { nestable: false },
};

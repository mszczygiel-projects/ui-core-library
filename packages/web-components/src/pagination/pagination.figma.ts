// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2157-126
// source=packages/web-components/src/pagination/pagination.tsx
// component=ui-pagination
import figma from 'figma';

const instance = figma.selectedInstance;
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const showStatus = instance.getBoolean('showStatus');
const showJump = instance.getBoolean('showJump');

// The count and the page are data that the design does not hold, so the example shows samples.
// Layout previews a narrow container, which code follows by itself; it is not an attribute.
export default {
  example: figma.code`<ui-pagination page="5" page-count="10"${disabled ? ' disabled' : ''}${showStatus ? ' show-status' : ''}${showJump ? ' show-jump' : ''}></ui-pagination>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/pagination'"],
  id: 'ui-pagination',
  metadata: { nestable: true },
};

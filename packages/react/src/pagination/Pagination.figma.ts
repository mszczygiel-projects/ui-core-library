// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2157-126
// source=packages/react/src/pagination/Pagination.tsx
// component=Pagination
import figma from 'figma';

const instance = figma.selectedInstance;
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const showStatus = instance.getBoolean('showStatus');
const showJump = instance.getBoolean('showJump');

// The count and the page are data that the design does not hold, so the example shows samples.
// Layout previews a narrow container, which code follows by itself; it is not a component prop.
export default {
  example: figma.code`<Pagination pageCount={10} defaultPage={5}${disabled ? ' disabled' : ''}${showStatus ? ' showStatus' : ''}${showJump ? ' showJump' : ''} />`,
  imports: ['import { Pagination } from "@mszczygiel-projects/ui-core-react"'],
  id: 'pagination',
  metadata: { nestable: true },
};

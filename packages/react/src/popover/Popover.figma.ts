// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2090-2086
// source=packages/react/src/popover/Popover.tsx
// component=Popover
import figma from 'figma';

const instance = figma.selectedInstance;
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
const showArrow = instance.getEnum('showArrow', { false: 'false', true: 'true' }) === 'true';

// Nothing visible names the panel, so the template asks for a label.
export default {
  example: figma.code`<Popover label="…" trigger={<Button>…</Button>}${open ? ' defaultOpen' : ''}${showArrow ? ' showArrow' : ''}>
  {/* content */}
</Popover>`,
  imports: ['import { Button, Popover } from "@mszczygiel-projects/ui-core-react"'],
  id: 'popover',
  metadata: { nestable: false },
};

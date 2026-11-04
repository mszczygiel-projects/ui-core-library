// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2090-2086
// source=packages/web-components/src/popover/popover.tsx
// component=ui-popover
import figma from 'figma';

const instance = figma.selectedInstance;
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
const showArrow = instance.getEnum('showArrow', { false: 'false', true: 'true' }) === 'true';

// Nothing visible names the panel, so the template asks for a label.
export default {
  example: figma.code`<ui-popover label="…"${open ? ' open' : ''}${showArrow ? ' show-arrow' : ''}>
  <ui-button slot="trigger">…</ui-button>
  <!-- content -->
</ui-popover>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/popover'"],
  id: 'ui-popover',
  metadata: { nestable: false },
};

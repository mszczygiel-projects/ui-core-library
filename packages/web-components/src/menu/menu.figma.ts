// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3202-130
// source=packages/web-components/src/menu/menu.tsx
// component=ui-menu
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });

// The actions of the set are sample content; the page sets the options property.
export default {
  example: figma.code`<ui-menu${size === 'medium' ? '' : figma.code` size="${size}"`}>
  <ui-button slot="trigger">…</ui-button>
</ui-menu>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/menu'"],
  id: 'ui-menu',
  metadata: { nestable: false },
};

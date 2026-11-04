// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2107-46
// source=packages/web-components/src/calendar/calendar.tsx
// component=ui-calendar
import figma from 'figma';
const instance = figma.selectedInstance;
const range = instance.getEnum('range', { false: 'false', true: 'true' }) === 'true';
// The view previews the grid of months or of years, which a user opens from the heading.
export default {
  example: figma.code`<ui-calendar${range ? ' range' : ''}></ui-calendar>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/calendar'"],
  id: 'ui-calendar',
  metadata: { nestable: true },
};

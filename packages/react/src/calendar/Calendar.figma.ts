// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2107-46
// source=packages/react/src/calendar/Calendar.tsx
// component=Calendar
import figma from 'figma';
const instance = figma.selectedInstance;
const range = instance.getEnum('range', { false: 'false', true: 'true' }) === 'true';
// The view previews the grid of months or of years, which a user opens from the heading.
export default {
  example: figma.code`<Calendar${range ? ' range' : ''} />`,
  imports: ["import { Calendar } from '@mszczygiel-projects/ui-core-react'"],
  id: 'calendar',
  metadata: { nestable: true },
};

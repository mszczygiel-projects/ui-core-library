// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2334-2878
// source=packages/react/src/breadcrumbs/Breadcrumbs.tsx
// component=Breadcrumbs
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', { small: 'small', medium: 'medium' });
const separator = instance.getEnum('separator', { chevron: 'chevron', slash: 'slash' });

// The items are data that the design does not hold, so the example shows a sample trail.
// Collapsed previews a narrow container, which code follows by itself; it is not a component prop.
export default {
  example: figma.code`<Breadcrumbs${size === 'medium' ? '' : figma.code` size="${size}"`}${separator === 'chevron' ? '' : figma.code` separator="${separator}"`}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Widget' },
  ]}
/>`,
  imports: ['import { Breadcrumbs } from "@mszczygiel-projects/ui-core-react"'],
  id: 'breadcrumbs',
  metadata: { nestable: true },
};

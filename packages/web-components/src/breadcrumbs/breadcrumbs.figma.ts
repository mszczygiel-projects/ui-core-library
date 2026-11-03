// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2334-2878
// source=packages/web-components/src/breadcrumbs/breadcrumbs.tsx
// component=ui-breadcrumbs
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', { small: 'small', medium: 'medium' });
const separator = instance.getEnum('separator', { chevron: 'chevron', slash: 'slash' });

// The items are a property that the design does not hold, so the example sets a sample trail.
// Collapsed previews a narrow container, which code follows by itself; it is not an attribute.
export default {
  example: figma.code`<ui-breadcrumbs${size === 'medium' ? '' : figma.code` size="${size}"`}${separator === 'chevron' ? '' : figma.code` separator="${separator}"`}></ui-breadcrumbs>
<script type="module">
  document.querySelector('ui-breadcrumbs').items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Widget' },
  ];
</script>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/breadcrumbs'"],
  id: 'ui-breadcrumbs',
  metadata: { nestable: true },
};

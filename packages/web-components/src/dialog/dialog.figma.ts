// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2216-3109
// source=packages/web-components/src/dialog/dialog.tsx
// component=ui-dialog
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
  large: 'large',
  fullscreen: 'fullscreen',
});
const hideCloseButton =
  instance.getEnum('hideCloseButton', { false: 'false', true: 'true' }) === 'true';
const attribute = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const heading = attribute(instance.getString('heading'));
const description = instance.getBoolean('hasDescription')
  ? attribute(instance.getString('description'))
  : '';
const hasFooter = instance.getBoolean('hasFooter');

// hasDescription and hasFooter preview the layout that code derives from the content.
export default {
  example: figma.code`<ui-dialog open${heading === '' ? '' : figma.code` heading="${heading}"`}${description === '' ? '' : figma.code` description="${description}"`}${size === undefined || size === 'medium' ? '' : figma.code` size="${size}"`}${hideCloseButton ? ' hide-close-button' : ''}>
  <!-- content -->${hasFooter ? '\n  <!-- actions, each with slot="footer" -->' : ''}
</ui-dialog>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/dialog'"],
  id: 'ui-dialog',
  metadata: { nestable: false },
};

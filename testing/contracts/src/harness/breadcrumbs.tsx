import { Breadcrumbs } from '@mszczygiel-projects/ui-core-react';

import type { BreadcrumbsContractProps } from '../specs/breadcrumbs.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** The icon of an item as the SVG string a page passes to the web component. */
const ICON = iconElement('').innerHTML;

/**
 * Sets the props as properties, turns the icon flags into SVG strings, and maps the callback to
 * the event, which it cancels on request.
 */
export const mountWebComponentBreadcrumbs = webComponentMount<BreadcrumbsContractProps>(
  'ui-breadcrumbs',
  (element, props) => {
    const { items, onNavigate, cancelNavigation, ...properties } = props;
    Object.assign(element, properties);
    if (items !== undefined) {
      Object.assign(element, {
        items: items.map(({ icon, ...item }) => (icon === true ? { ...item, icon: ICON } : item)),
      });
    }
    if (onNavigate !== undefined || cancelNavigation !== undefined) {
      element.dataset['cancel'] = String(cancelNavigation === true);
      if (element.dataset['listening'] === undefined) {
        element.dataset['listening'] = '';
        element.addEventListener('ui-navigate', (event) => {
          onNavigate?.(event.detail);
          if (element.dataset['cancel'] === 'true') {
            event.preventDefault();
          }
        });
      }
    }
  },
);

/** The same items with React icons, and the cancellation on the native event. */
function ReactBreadcrumbs({
  items,
  onNavigate,
  cancelNavigation,
  ...props
}: BreadcrumbsContractProps) {
  return (
    <Breadcrumbs
      {...props}
      items={items?.map(({ icon, ...item }) =>
        icon === true ? { ...item, icon: <IconNode /> } : item,
      )}
      onNavigate={(details) => {
        onNavigate?.(details);
        if (cancelNavigation === true) {
          details.originalEvent.preventDefault();
        }
      }}
    />
  );
}

export const mountReactBreadcrumbs = reactMount(ReactBreadcrumbs, 'ui-breadcrumbs');

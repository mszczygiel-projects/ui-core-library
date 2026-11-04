import { Tab, Tabs } from '@mszczygiel-projects/ui-core-react';
import type { TabsValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/tabs';
import { useState } from 'react';

import type { TabsContractProps } from '../specs/tabs.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** A decorative icon as the icon package supplies one: an SVG string. */
const ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8"/></svg>';

/** Sets props as properties, the tabs as ui-tab children and the callback as a listener. */
export const mountWebComponentTabs = webComponentMount<TabsContractProps>(
  'ui-tabs',
  (element, { tabs, withIcons, onValueChange, ...properties }) => {
    Object.assign(element, properties);
    if (tabs !== undefined && element.childElementCount === 0) {
      element.replaceChildren(
        ...tabs.map(({ content, ...tab }) => {
          const child = Object.assign(document.createElement('ui-tab'), tab);
          if (withIcons === true) {
            child.icon = ICON;
          }
          child.textContent = content;
          return child;
        }),
      );
    }
    if (onValueChange !== undefined && element.dataset['listening'] === undefined) {
      element.dataset['listening'] = '';
      element.addEventListener('ui-value-change', (event) => {
        const { value, ...details } = (event as CustomEvent<TabsValueChangeDetail<Event>>).detail;
        onValueChange(value, details);
      });
    }
  },
);

/** A parent that controls the Tabs and follows each tab the user selects. */
function ControlledTabs({
  tabs = [],
  withIcons,
  value,
  onValueChange,
  ...props
}: TabsContractProps) {
  const [shown, setShown] = useState(value);
  const [requested, setRequested] = useState(value);
  if (requested !== value) {
    setRequested(value);
    setShown(value);
  }
  return (
    <Tabs
      {...props}
      value={shown}
      onValueChange={(next, details) => {
        setShown(next);
        onValueChange?.(next, details);
      }}
    >
      {tabs.map(({ content, ...tab }) => (
        <Tab key={tab.value} {...tab} icon={withIcon(withIcons)}>
          {content}
        </Tab>
      ))}
    </Tabs>
  );
}

function withIcon(withIcons: boolean | undefined) {
  return withIcons === true ? <span dangerouslySetInnerHTML={{ __html: ICON }} /> : undefined;
}

export const mountReactTabs = reactMount(ControlledTabs, 'ui-tabs');

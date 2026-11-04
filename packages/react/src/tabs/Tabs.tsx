'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  tabs as tabsSpec,
  type TabsProps as SharedTabsProps,
  type TabsValueChangeDetails as SharedValueChangeDetails,
  type TabsValueChangeReason,
} from '@mszczygiel-projects/ui-core-shared/tabs';
import { nextTab, selectedTabValue } from '@mszczygiel-projects/ui-core-shared/tabs-navigation';
import {
  Children,
  type ComponentPropsWithRef,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { TabsContext, type TabsContextValue } from '../internal/tabs-context.ts';
import { Tab, type TabProps } from '../tab/Tab.tsx';

export type {
  TabsOrientation,
  TabsValueChangeReason,
  TabsVariant,
} from '@mszczygiel-projects/ui-core-shared/tabs';

/** The event that selected the tab, before React wraps it. */
export type TabsValueChangeDetails = SharedValueChangeDetails<Event>;

/** The props of Tabs. Other attributes of a `div` and ref go to its root element. */
export interface TabsProps
  extends
    SharedTabsProps,
    Omit<ComponentPropsWithRef<'div'>, keyof SharedTabsProps | 'defaultValue' | 'children'> {
  /** The initial tab of uncontrolled Tabs. */
  defaultValue?: string;
  /** The tabs, Tab elements as direct children. */
  children?: ReactNode;
  /** Called when the user selects another tab, with its value and what selected it. */
  onValueChange?: (value: string, details: TabsValueChangeDetails) => void;
}

const { variant: variantOption, orientation: orientationOption } = tabsSpec.options;

function tabElementsOf(children: ReactNode): ReactElement<TabProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> => isValidElement(child) && child.type === Tab,
  );
}

/**
 * A list of tabs, each of which shows its own panel of content in place of the others.
 *
 * Its children are Tab elements. It renders a tab for each in a list with the role `tablist`, and
 * each Tab renders its panel, so the content is in the server HTML. A controlled Tabs follows
 * `value`, and `onValueChange` reports each tab the user selects: a press, the arrow keys along
 * the list, which move the focus and select the tab they reach, Home and End, or find in page in a
 * hidden panel. Tab moves the focus from the selected tab to its panel.
 */
export function Tabs({
  value,
  defaultValue,
  variant = 'underline',
  orientation = 'horizontal',
  label,
  onValueChange,
  className,
  children,
  ...rest
}: TabsProps) {
  const id = useId();
  const items = tabElementsOf(children).map(({ props }) => ({
    value: props.value,
    label: props.label,
    icon: props.icon,
    disabled: props.disabled === true,
  }));
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  // The browser shows the panel of a match before the page answers, so a controlled Tabs that keeps
  // its value still shows that panel, until the user selects a tab or `value` changes.
  const [found, setFound] = useState<string | undefined>(undefined);
  const [followedValue, setFollowedValue] = useState(value);
  if (value !== followedValue) {
    setFollowedValue(value);
    setFound(undefined);
  }
  const selected = selectedTabValue(found ?? value ?? uncontrolledValue, items);
  const layout = oneOf(orientation, orientationOption.options, orientationOption.default);
  const look = oneOf(variant, variantOption.options, variantOption.default);
  const idsOf = (tabValue: string) => {
    const index = items.findIndex((item) => item.value === tabValue);
    return index === -1
      ? undefined
      : { tab: `${id}-tab-${String(index)}`, panel: `${id}-panel-${String(index)}` };
  };

  const select = (next: string, reason: TabsValueChangeReason, originalEvent: Event) => {
    setFound(reason === 'find' ? next : undefined);
    if (next === selected) {
      return;
    }
    setUncontrolledValue(next);
    onValueChange?.(next, { reason, originalEvent });
  };

  const context: TabsContextValue = {
    selected,
    idsOf,
    found: (tabValue, originalEvent) => {
      select(tabValue, 'find', originalEvent);
    },
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]'),
    );
    const current = tabs.findIndex((tab) => tab === event.target);
    if (current === -1) {
      return;
    }
    const next = nextTab(
      event.key,
      current,
      items.map((item) => !item.disabled),
      layout,
      getComputedStyle(event.currentTarget).direction === 'rtl' ? 'rtl' : 'ltr',
    );
    const item = next === undefined ? undefined : items[next];
    if (next === undefined || item === undefined) {
      return;
    }
    event.preventDefault();
    tabs[next]?.focus();
    select(item.value, 'trigger', event.nativeEvent);
  };

  return (
    <div
      className={classNames(
        'ui-tabs',
        'ui-tabs__base',
        `ui-tabs--${look}`,
        `ui-tabs--${layout}`,
        className,
      )}
      {...rest}
    >
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the keys reach the list from its tabs, which take the focus in turn */}
      <div
        className="ui-tabs__list"
        role="tablist"
        aria-orientation={layout}
        aria-label={label === '' ? undefined : label}
        onKeyDown={onKeyDown}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selected;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${id}-tab-${String(index)}`}
              className={classNames('ui-tabs__tab', isSelected && 'ui-tabs__tab--selected')}
              aria-selected={isSelected}
              aria-controls={`${id}-panel-${String(index)}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={(event) => {
                select(item.value, 'trigger', event.nativeEvent);
              }}
            >
              {item.icon === undefined || item.icon === null ? null : (
                <span className="ui-tabs__tab-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="ui-tabs__tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <TabsContext value={context}>{children}</TabsContext>
    </div>
  );
}

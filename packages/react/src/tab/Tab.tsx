'use client';

import type { TabProps as SharedTabProps } from '@mszczygiel-projects/ui-core-shared/tab';
import {
  type ComponentPropsWithRef,
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { setRef } from '../internal/set-ref.ts';
import { TabsContext } from '../internal/tabs-context.ts';

/** The props of Tab. Other attributes of a `div` and ref go to its panel. */
export interface TabProps
  extends
    SharedTabProps<ReactNode>,
    Omit<ComponentPropsWithRef<'div'>, keyof SharedTabProps | 'children'> {
  /** The content of the panel, in the page whether the tab is selected or not. */
  children?: ReactNode;
}

const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * One tab of Tabs: its label, an optional icon, and the content of its panel.
 *
 * Tabs renders the tab from `label`, `icon` and `disabled`, and each Tab renders its panel, named
 * by its tab, where it stands among the children. The panels of the other tabs stay in the page as
 * `hidden="until-found"`, so find in page and a link to a text fragment select the tab of a match.
 */
export function Tab({
  value,
  id,
  label: _label,
  icon: _icon,
  disabled: _disabled,
  ref,
  className,
  children,
  ...rest
}: TabProps) {
  const group = use(TabsContext);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const ids = group?.idsOf(value);
  const selected = group === null || group.selected === value;
  const foundRef = useRef(group?.found);
  useBrowserLayoutEffect(() => {
    foundRef.current = group?.found;
  });

  // React renders `hidden` as a boolean, so the panel takes `until-found` once it is in the page.
  // A browser without it hides the panel plainly, and find in page skips the content.
  useBrowserLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null || selected) {
      return;
    }
    panel.setAttribute('hidden', 'until-found');
    const onBeforeMatch = (event: Event) => {
      foundRef.current?.(value, event);
    };
    panel.addEventListener('beforematch', onBeforeMatch);
    return () => {
      panel.removeEventListener('beforematch', onBeforeMatch);
    };
  }, [selected, value]);

  return (
    <div
      ref={(node) => {
        panelRef.current = node;
        return setRef(ref, node);
      }}
      id={ids?.panel ?? id}
      className={classNames('ui-tabs__panel', className)}
      role={ids === undefined ? undefined : 'tabpanel'}
      aria-labelledby={ids?.tab}
      // A panel hidden until found keeps its box, so only the shown one takes the Tab key.
      tabIndex={ids === undefined ? undefined : selected ? 0 : -1}
      hidden={!selected}
      {...rest}
    >
      {children}
    </div>
  );
}

import { createContext } from 'react';

/** What a Tabs gives the Tab elements inside it, which render the panels. */
export interface TabsContextValue {
  /** The value of the selected tab, or undefined when no tab can be selected. */
  readonly selected: string | undefined;
  /** The ids of the tab and the panel of a value, or undefined for a value that no tab has. */
  readonly idsOf: (value: string) => { readonly tab: string; readonly panel: string } | undefined;
  /** Find in page revealed the panel of a value. */
  readonly found: (value: string, originalEvent: Event) => void;
}

/** The Tabs around a Tab, or null outside one. */
export const TabsContext = createContext<TabsContextValue | null>(null);

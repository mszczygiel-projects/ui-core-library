/** What a Tabs reads from each of its tabs to render the tab and its panel. */
export interface TabEntry {
  readonly element: HTMLElement;
  value(): string;
  label(): string;
  /** The SVG string of the icon, or undefined without one. */
  icon(): string | undefined;
  disabled(): boolean;
}

/** What a tab tells its Tabs. */
export interface TabsChannel {
  /** A prop of the tab changed, so the list renders it again. */
  changed(): void;
}

const groups = new WeakMap<Element, TabsChannel>();
const entries = new WeakMap<Element, TabEntry>();

export function registerTabs(element: Element, channel: TabsChannel): void {
  groups.set(element, channel);
}

export function registerTab(entry: TabEntry): void {
  entries.set(entry.element, entry);
}

/** The Tabs whose children hold the tab, if it is upgraded. */
export function tabsOf(element: Element): TabsChannel | undefined {
  const parent = element.parentElement;
  return parent?.localName === 'ui-tabs' ? groups.get(parent) : undefined;
}

/** The upgraded tabs of a Tabs, its children in document order. */
export function tabEntriesOf(group: Element): TabEntry[] {
  return Array.from(group.children).flatMap((element) => {
    const entry = entries.get(element);
    return entry === undefined ? [] : [entry];
  });
}

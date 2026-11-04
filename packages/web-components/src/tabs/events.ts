import type { TabsValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/tabs';

/**
 * The detail of `ui-value-change` of Tabs, with the event that selected the tab. It lives in a
 * module of its own so that the declarations Stencil writes can import it.
 */
export type TabsValueChange = TabsValueChangeDetail<Event>;

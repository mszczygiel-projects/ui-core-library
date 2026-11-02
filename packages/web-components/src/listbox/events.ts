import type { ListboxValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/listbox';

/**
 * The detail of `ui-value-change`, with the native event that caused it. It lives in a module of
 * its own so that the declarations Stencil writes can import it.
 */
export type ListboxValueChange = ListboxValueChangeDetail<Event>;

import type { ComboboxQueryDetail } from '@mszczygiel-projects/ui-core-shared/combobox';

/**
 * The detail of `ui-query-change` and `ui-create`, with the native event that caused it. It lives
 * in a module of its own so that the declarations Stencil writes can import it.
 */
export type ComboboxQuery = ComboboxQueryDetail<Event>;

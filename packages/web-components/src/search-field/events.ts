import type { SearchFieldClearDetails } from '@mszczygiel-projects/ui-core-shared/search-field';

/**
 * The detail of `ui-clear`, with the native event that caused it. It lives in a module of its own
 * so that the declarations Stencil writes can import it.
 */
export type SearchFieldClear = SearchFieldClearDetails<Event>;

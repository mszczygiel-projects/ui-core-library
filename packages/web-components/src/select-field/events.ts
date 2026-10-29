import type { SelectFieldOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/select-field';

/**
 * The detail of `ui-open-change`, with the native event that caused it. It lives in a module of
 * its own so that the declarations Stencil writes can import it.
 */
export type SelectFieldOpenChange = SelectFieldOpenChangeDetail<Event>;

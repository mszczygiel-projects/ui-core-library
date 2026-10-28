import type { CheckedChangeDetail } from '@mszczygiel-projects/ui-core-shared/checkbox-field';

/**
 * The detail of `ui-checked-change`, with the native event that caused it. It lives in a module
 * of its own so that the declarations Stencil writes can import it.
 */
export type CheckedChange = CheckedChangeDetail<Event>;

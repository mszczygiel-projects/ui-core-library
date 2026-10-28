import type { PasswordFieldRevealedChangeDetail } from '@mszczygiel-projects/ui-core-shared/password-field';

/**
 * The detail of `ui-revealed-change`, with the native event that caused it. It lives in a module
 * of its own so that the declarations Stencil writes can import it.
 */
export type PasswordFieldRevealedChange = PasswordFieldRevealedChangeDetail<Event>;

import type { TextFieldValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/text-field';

/**
 * The detail of `ui-value-change`: the new value and the native input event. It lives in a module
 * of its own so that the declarations Stencil writes can import it.
 */
export type TextFieldValueChange = TextFieldValueChangeDetail<Event>;

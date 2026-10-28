import type { RadioGroupValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/radio-group';

/**
 * The detail of `ui-value-change` of a radio group, with the native event that caused it. It
 * lives in a module of its own so that the declarations Stencil writes can import it.
 */
export type RadioGroupValueChange = RadioGroupValueChangeDetail<Event>;

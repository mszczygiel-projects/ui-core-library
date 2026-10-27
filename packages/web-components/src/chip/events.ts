import type {
  ChipDismissDetail,
  ChipSelectedChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/chip';

/**
 * The details of the events of Chip, with the native event that caused each. They live in a
 * module of their own so that the declarations Stencil writes can import them.
 */
export type ChipSelectedChange = ChipSelectedChangeDetail<Event>;

export type ChipDismiss = ChipDismissDetail<Event>;

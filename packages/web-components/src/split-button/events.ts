import type {
  SplitButtonActionDetail,
  SplitButtonOpenChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/split-button';

/**
 * The details of the events of SplitButton, with the native event that caused them. They live in
 * a module of their own so that the declarations Stencil writes can import them.
 */
export type SplitButtonOpenChange = SplitButtonOpenChangeDetail<Event>;

export type SplitButtonAction = SplitButtonActionDetail<Event>;

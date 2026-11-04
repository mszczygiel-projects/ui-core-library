import type {
  MenuActionDetail,
  MenuOpenChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/menu';

/**
 * The details of the events of Menu, with the native event that caused them. They live in a module
 * of their own so that the declarations Stencil writes can import them.
 */
export type MenuOpenChange = MenuOpenChangeDetail<Event>;

export type MenuAction = MenuActionDetail<Event>;

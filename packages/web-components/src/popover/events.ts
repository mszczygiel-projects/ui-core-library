import type { PopoverOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/popover';

/**
 * The detail of `ui-open-change` of Popover, with the native event that asked it to open or close.
 * It lives in a module of its own so that the declarations Stencil writes can import it.
 */
export type PopoverOpenChange = PopoverOpenChangeDetail<Event>;

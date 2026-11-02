import type { OverlayOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/dialog';

/**
 * The detail of `ui-open-change` of Dialog and Drawer, with the native event that asked the modal
 * to close. It lives in a module of its own so that the declarations Stencil writes can import it.
 */
export type OverlayOpenChange = OverlayOpenChangeDetail<Event>;

import type { BreadcrumbsNavigateDetail } from '@mszczygiel-projects/ui-core-shared/breadcrumbs';

/**
 * The detail of the event of Breadcrumbs, with the native event that caused it and the icon as
 * an SVG string. It lives in a module of its own so that the declarations Stencil writes can
 * import it.
 */
export type BreadcrumbsNavigate = BreadcrumbsNavigateDetail<MouseEvent, string>;

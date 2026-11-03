import type { PaginationPageChangeDetail } from '@mszczygiel-projects/ui-core-shared/pagination';

/**
 * The detail of the event of Pagination, with the native event that caused it. It lives in a
 * module of its own so that the declarations Stencil writes can import it.
 */
export type PaginationPageChange = PaginationPageChangeDetail<Event>;

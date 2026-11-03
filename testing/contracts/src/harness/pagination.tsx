import { Pagination } from '@mszczygiel-projects/ui-core-react';

import type { PaginationContractProps } from '../specs/pagination.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the first page to the page attribute and the callback to the event, which it cancels on
 * request, and sets the other props as properties.
 */
export const mountWebComponentPagination = webComponentMount<PaginationContractProps>(
  'ui-pagination',
  (element, props) => {
    const { defaultPage, onPageChange, cancelChange, ...properties } = props;
    Object.assign(element, properties);
    if (defaultPage !== undefined && !element.isConnected) {
      element.setAttribute('page', String(defaultPage));
    }
    if (onPageChange !== undefined || cancelChange !== undefined) {
      element.dataset['cancel'] = String(cancelChange === true);
      if (element.dataset['listening'] === undefined) {
        element.dataset['listening'] = '';
        element.addEventListener('ui-page-change', (event) => {
          const { page, ...details } = event.detail;
          onPageChange?.(page, details);
          if (element.dataset['cancel'] === 'true') {
            event.preventDefault();
          }
        });
      }
    }
  },
);

/** The cancellation on the native event, as a React page does it. */
function ReactPagination({ onPageChange, cancelChange, ...props }: PaginationContractProps) {
  return (
    <Pagination
      {...props}
      onPageChange={(page, details) => {
        onPageChange?.(page, details);
        if (cancelChange === true) {
          details.originalEvent.preventDefault();
        }
      }}
    />
  );
}

export const mountReactPagination = reactMount(ReactPagination, 'ui-pagination');

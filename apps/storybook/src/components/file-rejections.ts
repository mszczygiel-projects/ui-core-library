import type { FileRejection } from '@mszczygiel-projects/ui-core-shared/file-selection';
import { formatFileSize } from '@mszczygiel-projects/ui-core-shared/file-selection';

/** The constraints a story gives its field, which the message names. */
export interface RejectionLimits {
  readonly maxSize?: number;
  readonly maxFiles?: number;
}

/**
 * The hint a story shows after a rejection. The field reports rejected files and never explains
 * them, so a page writes the message in its own words, as these stories do.
 */
export function rejectionHint(
  rejections: readonly FileRejection<File>[],
  { maxSize, maxFiles }: RejectionLimits,
): string {
  return rejections
    .map(({ file, reason }) => {
      if (reason === 'size' && maxSize !== undefined) {
        return `${file.name} is larger than ${formatFileSize(maxSize, 'en')}.`;
      }
      if (reason === 'count' && maxFiles !== undefined) {
        return `${file.name} would make more than ${String(maxFiles)} files.`;
      }
      return `${file.name} is not a type this field takes.`;
    })
    .join(' ');
}

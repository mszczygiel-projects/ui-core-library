import type {
  FileInputFieldRejectDetail,
  FileInputFieldValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';

/**
 * The details of `ui-value-change` and `ui-reject`, with the native event that caused them. They
 * live in a module of their own so that the declarations Stencil writes can import them.
 */
export type FileInputFieldValueChange = FileInputFieldValueChangeDetail<Event, File>;

export type FileInputFieldReject = FileInputFieldRejectDetail<Event, File>;

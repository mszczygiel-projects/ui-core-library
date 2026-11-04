import type { AccordionProps } from '@mszczygiel-projects/ui-core-shared/accordion';
import type { AccordionItemProps } from '@mszczygiel-projects/ui-core-shared/accordion-item';
import type { BadgeProps } from '@mszczygiel-projects/ui-core-shared/badge';
import type {
  BreadcrumbsNavigateDetail,
  BreadcrumbsProps,
} from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import type { CalendarProps } from '@mszczygiel-projects/ui-core-shared/calendar';
import type {
  CheckboxFieldProps,
  CheckedChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import type { ChipProps } from '@mszczygiel-projects/ui-core-shared/chip';
import type {
  ComboboxProps,
  ComboboxQueryDetail,
} from '@mszczygiel-projects/ui-core-shared/combobox';
import type { DateFieldProps } from '@mszczygiel-projects/ui-core-shared/date-field';
import type {
  DialogProps,
  OverlayOpenChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/dialog';
import type { DrawerProps } from '@mszczygiel-projects/ui-core-shared/drawer';
import type {
  FileInputFieldProps,
  FileInputFieldRejectDetail,
  FileInputFieldValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';
import type { IconButtonProps } from '@mszczygiel-projects/ui-core-shared/icon-button';
import type { LinkButtonProps } from '@mszczygiel-projects/ui-core-shared/link-button';
import type {
  ListboxProps,
  ListboxValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import type {
  MenuActionDetail,
  MenuOpenChangeDetail,
  MenuProps,
} from '@mszczygiel-projects/ui-core-shared/menu';
import type { NotificationProps } from '@mszczygiel-projects/ui-core-shared/notification';
import type { NumberFieldProps } from '@mszczygiel-projects/ui-core-shared/number-field';
import type {
  PaginationPageChangeDetail,
  PaginationProps,
} from '@mszczygiel-projects/ui-core-shared/pagination';
import type { PasswordFieldProps } from '@mszczygiel-projects/ui-core-shared/password-field';
import type {
  PopoverOpenChangeDetail,
  PopoverProps,
} from '@mszczygiel-projects/ui-core-shared/popover';
import type { RadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import type { RadioGroupProps } from '@mszczygiel-projects/ui-core-shared/radio-group';
import type { SearchFieldProps } from '@mszczygiel-projects/ui-core-shared/search-field';
import type { SelectFieldProps } from '@mszczygiel-projects/ui-core-shared/select-field';
import type { SplitButtonProps } from '@mszczygiel-projects/ui-core-shared/split-button';
import type { SwitchFieldProps } from '@mszczygiel-projects/ui-core-shared/switch-field';
import type { TextFieldProps } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { TextareaFieldProps } from '@mszczygiel-projects/ui-core-shared/textarea-field';
import type { TooltipProps } from '@mszczygiel-projects/ui-core-shared/tooltip';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * The props of a custom element in React's JSX: the attributes of any element and the props of
 * its specification, which React 19 sets as properties of the element.
 */
type CustomElement<Props> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Props;

/** An element whose defaultValue property holds files, which the string attribute of React cannot. */
type FileElement<Props> = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>,
  'defaultValue'
> &
  Props;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-accordion-item': CustomElement<AccordionItemProps>;
      'ui-accordion': CustomElement<AccordionProps>;
      'ui-split-button': CustomElement<
        SplitButtonProps<string> & {
          readonly 'onui-open-change'?: (event: CustomEvent<MenuOpenChangeDetail<Event>>) => void;
          readonly 'onui-action'?: (event: CustomEvent<MenuActionDetail<Event>>) => void;
        }
      >;
      'ui-menu': CustomElement<
        MenuProps<string> & {
          readonly 'onui-open-change'?: (event: CustomEvent<MenuOpenChangeDetail<Event>>) => void;
          readonly 'onui-action'?: (event: CustomEvent<MenuActionDetail<Event>>) => void;
        }
      >;
      'ui-calendar': CustomElement<CalendarProps>;
      'ui-tooltip': CustomElement<TooltipProps>;
      'ui-popover': CustomElement<
        PopoverProps & {
          readonly 'onui-open-change'?: (
            event: CustomEvent<PopoverOpenChangeDetail<Event>>,
          ) => void;
        }
      >;
      'ui-pagination': CustomElement<
        PaginationProps & {
          readonly page?: number;
          readonly 'onui-page-change'?: (
            event: CustomEvent<PaginationPageChangeDetail<Event>>,
          ) => void;
        }
      >;
      'ui-breadcrumbs': CustomElement<
        BreadcrumbsProps<string> & {
          readonly 'onui-navigate'?: (
            event: CustomEvent<BreadcrumbsNavigateDetail<MouseEvent, string>>,
          ) => void;
        }
      >;
      'ui-file-input-field': FileElement<
        FileInputFieldProps<File> & {
          readonly defaultValue?: readonly File[];
          readonly 'onui-value-change'?: (
            event: CustomEvent<FileInputFieldValueChangeDetail<Event, File>>,
          ) => void;
          readonly 'onui-reject'?: (
            event: CustomEvent<FileInputFieldRejectDetail<Event, File>>,
          ) => void;
        }
      >;
      'ui-drawer': CustomElement<
        DrawerProps & {
          readonly 'onui-open-change'?: (
            event: CustomEvent<OverlayOpenChangeDetail<Event>>,
          ) => void;
        }
      >;
      'ui-dialog': CustomElement<
        DialogProps & {
          readonly 'onui-open-change'?: (
            event: CustomEvent<OverlayOpenChangeDetail<Event>>,
          ) => void;
        }
      >;
      'ui-combobox': CustomElement<
        ComboboxProps & {
          readonly 'onui-query-change'?: (event: CustomEvent<ComboboxQueryDetail<Event>>) => void;
          readonly 'onui-create'?: (event: CustomEvent<ComboboxQueryDetail<Event>>) => void;
          readonly 'onui-value-change'?: (
            event: CustomEvent<ListboxValueChangeDetail<Event>>,
          ) => void;
        }
      >;
      'ui-select-field': CustomElement<SelectFieldProps>;
      'ui-listbox': CustomElement<ListboxProps>;
      'ui-date-field': CustomElement<DateFieldProps>;
      'ui-number-field': CustomElement<NumberFieldProps>;
      'ui-radio-field': CustomElement<RadioFieldProps>;
      'ui-radio-group': CustomElement<RadioGroupProps>;
      'ui-switch-field': CustomElement<SwitchFieldProps>;
      'ui-checkbox-field': CustomElement<
        CheckboxFieldProps & {
          readonly 'onui-checked-change'?: (event: CustomEvent<CheckedChangeDetail<Event>>) => void;
        }
      >;
      'ui-textarea-field': CustomElement<TextareaFieldProps>;
      'ui-search-field': CustomElement<SearchFieldProps>;
      'ui-password-field': CustomElement<PasswordFieldProps>;
      // React 19 adds a listener for each `on<event>` prop of a custom element.
      'ui-notification': CustomElement<
        NotificationProps & { readonly 'onui-dismiss'?: (event: Event) => void }
      >;
      'ui-chip': CustomElement<ChipProps & { readonly 'onui-dismiss'?: (event: Event) => void }>;
      'ui-badge': CustomElement<BadgeProps>;
      'ui-link-button': CustomElement<LinkButtonProps>;
      'ui-icon-button': CustomElement<IconButtonProps>;
      'ui-button': CustomElement<ButtonProps>;
      'ui-loader': CustomElement<LoaderProps>;
      'ui-text-field': CustomElement<
        TextFieldProps & {
          readonly inputmode?: string;
          readonly enterkeyhint?: string;
        }
      >;
    }
  }
}

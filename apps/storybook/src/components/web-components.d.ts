import type { BadgeProps } from '@mszczygiel-projects/ui-core-shared/badge';
import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import type { CheckboxFieldProps } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import type { ChipProps } from '@mszczygiel-projects/ui-core-shared/chip';
import type { IconButtonProps } from '@mszczygiel-projects/ui-core-shared/icon-button';
import type { LinkButtonProps } from '@mszczygiel-projects/ui-core-shared/link-button';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import type { NotificationProps } from '@mszczygiel-projects/ui-core-shared/notification';
import type { PasswordFieldProps } from '@mszczygiel-projects/ui-core-shared/password-field';
import type { RadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import type { RadioGroupProps } from '@mszczygiel-projects/ui-core-shared/radio-group';
import type { SearchFieldProps } from '@mszczygiel-projects/ui-core-shared/search-field';
import type { SwitchFieldProps } from '@mszczygiel-projects/ui-core-shared/switch-field';
import type { TextFieldProps } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { TextareaFieldProps } from '@mszczygiel-projects/ui-core-shared/textarea-field';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * The props of a custom element in React's JSX: the attributes of any element and the props of
 * its specification, which React 19 sets as properties of the element.
 */
type CustomElement<Props> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Props;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-radio-field': CustomElement<RadioFieldProps>;
      'ui-radio-group': CustomElement<RadioGroupProps>;
      'ui-switch-field': CustomElement<SwitchFieldProps>;
      'ui-checkbox-field': CustomElement<CheckboxFieldProps>;
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

import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import type { TextFieldProps } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * The props of a custom element in React's JSX: the attributes of any element and the props of
 * its specification, which React 19 sets as properties of the element.
 */
type CustomElement<Props> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Props;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': CustomElement<ButtonProps>;
      'ui-loader': CustomElement<LoaderProps>;
      'ui-text-field': CustomElement<
        Omit<TextFieldProps, 'spellCheck'> & {
          readonly inputmode?: string;
          readonly enterkeyhint?: string;
        }
      >;
    }
  }
}

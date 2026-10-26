import { button } from './button.ts';
import { defineComponent, type OptionOf } from './component.ts';

/** The specification of LinkButton. */
export const linkButton = defineComponent({
  name: 'LinkButton',
  tag: 'ui-link-button',
  category: 'Actions',
  status: 'done',
  // Designs use Button: a link and a button look alike, and the code chooses the element.
  figma: null,
  design: { flags: [], codeOnly: [], previews: {} },
  summary: 'Navigates to another page or resource while looking like a button.',
  options: {
    variant: button.options.variant,
    size: button.options.size,
  },
  labels: [],
  parts: ['base', 'content', 'leading-icon', 'label', 'trailing-icon'],
  slots: ['leading-icon', 'trailing-icon'],
  events: [],
  stories: ['Playground', 'Variants', 'WithIcons', 'OnSurfaces'],
  exceptions: [
    {
      items: ['render'],
      reason:
        'React applications navigate with the link component of their router, which the React prop renders. A web component cannot render another framework, and an application intercepts the native link instead.',
    },
  ],
});

/** The visual emphasis of a link, shared with Button. */
export type LinkButtonVariant = OptionOf<typeof linkButton, 'variant'>;
/** The sizes of a link, the same as those of a button. */
export type LinkButtonSize = OptionOf<typeof linkButton, 'size'>;

/** The props both implementations of LinkButton share. */
export interface LinkButtonProps {
  /** The address to navigate to. A disabled link has none. */
  href: string;
  /** The browsing context to open the address in, such as `_blank`. */
  target?: string;
  /** The relationship to the linked resource, written as given. */
  rel?: string;
  /** Downloads the resource instead of navigating, under the given file name when not empty. */
  download?: string;
  /**
   * The visual emphasis of the link.
   * @default 'primary'
   */
  variant?: LinkButtonVariant;
  /**
   * The size, which follows the density.
   * @default 'medium'
   */
  size?: LinkButtonSize;
  /**
   * Turns the link into text that cannot be focused or followed, by any pointer or key.
   * @default false
   */
  disabled?: boolean;
  /** An accessible name replacing the visible content. An author's `aria-label` wins. */
  label?: string;
}

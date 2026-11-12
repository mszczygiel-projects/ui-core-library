'use client';

import {
  linkButton,
  type LinkButtonProps as SharedLinkButtonProps,
  type LinkButtonShape,
  type LinkButtonSize,
  type LinkButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/link-button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import { useActionRef } from '../internal/action.ts';
import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';

export type { LinkButtonShape, LinkButtonSize, LinkButtonVariant };

const { options } = linkButton;

/** What `render` receives: the props of the native link, which the rendered component passes on. */
export interface LinkButtonRenderProps extends ComponentPropsWithRef<'a'> {
  readonly href: string;
  readonly className: string;
  readonly children: ReactNode;
}

/** Renders the link of a router as an element, so that its ref passes as a prop. */
function RenderedLink({
  render,
  ...props
}: LinkButtonRenderProps & { readonly render: (props: LinkButtonRenderProps) => ReactElement }) {
  return render(props);
}

/** The props of LinkButton. Remaining attributes and ref reach its native link. */
export interface LinkButtonProps
  extends
    SharedLinkButtonProps,
    Omit<ComponentPropsWithRef<'a'>, keyof SharedLinkButtonProps | 'children'> {
  /** The visible name of the link. Supply text or non-interactive content. */
  children?: ReactNode;
  /** A decorative icon before the name, in reading order. */
  leadingIcon?: ReactNode;
  /** A decorative icon after the name, in reading order. */
  trailingIcon?: ReactNode;
  /**
   * Renders the link with another component, such as the link of a router, which must render an
   * `<a>` with the props it receives. A disabled link has no address and ignores it.
   *
   * @example
   * <LinkButton href="/pricing" render={(props) => <Link {...props} />}>Pricing</LinkButton>
   */
  render?: (props: LinkButtonRenderProps) => ReactElement;
}

/**
 * Navigates to another page or resource while looking like a button.
 *
 * It renders a native link, so opening it in a new tab or copying its address works as on any
 * link. A disabled link has no address, so no pointer, key or menu can follow it.
 */
export function LinkButton({
  href,
  target,
  rel,
  download,
  variant = 'primary',
  size = 'medium',
  shape = 'square',
  disabled = false,
  label,
  children,
  leadingIcon,
  trailingIcon,
  render,
  className,
  tabIndex,
  ref,
  ...rest
}: LinkButtonProps) {
  // Not named as a ref: render receives it as the ref prop of the link it renders.
  const attachLink = useActionRef(ref);
  const content = (
    <span className="ui-link-button__content">
      {rendersContent(leadingIcon) && (
        <span className="ui-link-button__leading-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className="ui-link-button__label">{children}</span>
      {rendersContent(trailingIcon) && (
        <span className="ui-link-button__trailing-icon" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </span>
  );
  const classes = classNames(
    'ui-link-button',
    'ui-link-button__base',
    'ui-action',
    `ui-action--${oneOf(variant, options.variant.options, options.variant.default)}`,
    `ui-action--${oneOf(size, options.size.options, options.size.default)}`,
    `ui-action--${oneOf(shape, options.shape.options, options.shape.default)}`,
    disabled && 'ui-action--disabled',
    className,
  );
  if (disabled) {
    // A link without an address has no role of its own, so a disabled one states it. An
    // author's tabIndex would bring the link back into the focus order, so it is left out.
    return (
      <a
        ref={attachLink}
        role="link"
        aria-disabled="true"
        aria-label={label}
        className={classes}
        {...rest}
      >
        {content}
      </a>
    );
  }
  const props: Omit<LinkButtonRenderProps, 'ref' | 'children'> = {
    href,
    target,
    rel,
    download,
    'aria-label': label,
    className: classes,
    tabIndex,
    ...rest,
  };
  return render === undefined ? (
    <a ref={attachLink} {...props}>
      {content}
    </a>
  ) : (
    <RenderedLink ref={attachLink} render={render} {...props}>
      {content}
    </RenderedLink>
  );
}

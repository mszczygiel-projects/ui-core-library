import { type ComponentPropsWithRef, createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { LinkButton } from './LinkButton.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** A link component of a router: it renders an anchor and navigates on its own. */
function RouterLink({ href, children, onClick, ...props }: ComponentPropsWithRef<'a'>) {
  return (
    <a
      {...props}
      href={href}
      data-router=""
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

afterEach(() => {
  history.replaceState(null, '', location.pathname + location.search);
});

describe('LinkButton', () => {
  it('passes its ref and native attributes to the native link', async () => {
    const ref = createRef<HTMLAnchorElement>();
    await render(
      <LinkButton
        ref={ref}
        href="/pricing"
        id="pricing"
        className="spaced"
        data-owner="page"
        hrefLang="pl"
        referrerPolicy="no-referrer"
      >
        Pricing
      </LinkButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current?.id).toBe('pricing');
    expect(ref.current?.classList.contains('spaced')).toBe(true);
    expect(ref.current?.dataset['owner']).toBe('page');
    expect(ref.current?.getAttribute('hreflang')).toBe('pl');
    expect(ref.current?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('renders its link with the component that render returns, given every prop', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const clicked = vi.fn();
    const screen = await render(
      <LinkButton
        ref={ref}
        href="/pricing"
        target="_self"
        label="Pricing plans"
        variant="outline"
        onClick={clicked}
        leadingIcon={<svg />}
        render={(props) => <RouterLink {...props} />}
      >
        Pricing
      </LinkButton>,
    );
    const link = screen.container.querySelector('a');
    expect(link?.hasAttribute('data-router')).toBe(true);
    expect(ref.current).toBe(link);
    expect(link?.getAttribute('href')).toBe('/pricing');
    expect(link?.getAttribute('target')).toBe('_self');
    expect(link?.getAttribute('aria-label')).toBe('Pricing plans');
    expect(link?.classList.contains('ui-action--outline')).toBe(true);
    expect(link?.querySelector('.ui-link-button__leading-icon')).not.toBeNull();
    link?.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('ignores render while disabled, since a disabled link has no address', async () => {
    const renderLink = vi.fn((props: ComponentPropsWithRef<'a'>) => <RouterLink {...props} />);
    const screen = await render(
      <LinkButton href="/pricing" disabled render={renderLink}>
        Pricing
      </LinkButton>,
    );
    const link = screen.container.querySelector('a');
    expect(renderLink).not.toHaveBeenCalled();
    expect(link?.hasAttribute('href')).toBe(false);
    expect(link?.getAttribute('aria-disabled')).toBe('true');
  });

  it('leaves the focus order while disabled, whatever tabIndex it was given', async () => {
    const screen = await render(
      <>
        <button type="button">Before</button>
        <LinkButton href="/pricing" tabIndex={0}>
          Pricing
        </LinkButton>
      </>,
    );
    const link = screen.container.querySelector('a');
    expect(link?.getAttribute('tabindex')).toBe('0');
    await screen.rerender(
      <>
        <button type="button">Before</button>
        <LinkButton href="/pricing" tabIndex={0} disabled>
          Pricing
        </LinkButton>
      </>,
    );
    const disabled = screen.container.querySelector('a');
    expect(disabled?.hasAttribute('tabindex')).toBe(false);
    screen.container.querySelector('button')?.focus();
    await userEvent.tab();
    expect(document.activeElement).not.toBe(disabled);
  });

  it('gives its link to a callback ref and takes it back on unmount', async () => {
    const ref = vi.fn();
    const screen = await render(
      <LinkButton ref={ref} href="#pricing">
        Pricing
      </LinkButton>,
    );
    expect(ref).toHaveBeenLastCalledWith(screen.container.querySelector('a'));
    await screen.unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const view = (
      <LinkButton href="/pricing" trailingIcon={<svg />}>
        Pricing
      </LinkButton>
    );
    const html = renderToString(view);
    expect(html).toContain('href="/pricing"');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError: recoverable });
    try {
      await nextFrame();
      await nextFrame();
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      container.remove();
      errors.mockRestore();
    }
  });
});

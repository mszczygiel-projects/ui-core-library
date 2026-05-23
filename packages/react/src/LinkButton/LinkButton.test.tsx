import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { LinkButton } from './LinkButton.js';

afterEach(() => cleanup());

describe('LinkButton', () => {
  it('renders an <a> element', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('a')).not.toBeNull();
  });

  it('renders no <button> element', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('button')).toBeNull();
  });

  it('sets href attribute', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('a')!.getAttribute('href')).toBe('/page');
  });

  it('does not set disabled HTML attribute on <a>', () => {
    const { container } = render(
      <LinkButton href="/page" disabled>
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.hasAttribute('disabled')).toBe(false);
  });

  it('applies variant class', () => {
    const { container } = render(
      <LinkButton href="/page" variant="secondary">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.className).toContain('ui-button--secondary');
  });

  it('applies size class for small', () => {
    const { container } = render(
      <LinkButton href="/page" size="small">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.className).toContain('ui-button--small');
  });

  it('applies size class for large', () => {
    const { container } = render(
      <LinkButton href="/page" size="large">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.className).toContain('ui-button--large');
  });

  it('does not apply size class for default', () => {
    const { container } = render(
      <LinkButton href="/page" size="default">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.className).not.toContain('ui-button--default');
  });

  it('disabled sets aria-disabled and tabIndex', () => {
    const { container } = render(
      <LinkButton href="/page" disabled>
        Click
      </LinkButton>,
    );
    const a = container.querySelector('a')!;
    expect(a.getAttribute('aria-disabled')).toBe('true');
    expect(a.tabIndex).toBe(-1);
  });

  it('disabled does not call onClick', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <LinkButton href="/page" disabled onClick={handleClick}>
        Click
      </LinkButton>,
    );
    fireEvent.click(container.querySelector('a')!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading sets aria-disabled, aria-busy and tabIndex', () => {
    const { container } = render(
      <LinkButton href="/page" loading>
        Click
      </LinkButton>,
    );
    const a = container.querySelector('a')!;
    expect(a.getAttribute('aria-disabled')).toBe('true');
    expect(a.getAttribute('aria-busy')).toBe('true');
    expect(a.tabIndex).toBe(-1);
  });

  it('loading renders Loader and hides icon props', () => {
    const { container } = render(
      <LinkButton href="/page" loading iconLeft={<span>L</span>} iconRight={<span>R</span>}>
        Click
      </LinkButton>,
    );
    expect(container.querySelector('.ui-loader')).not.toBeNull();
    expect(container.querySelector('.ui-button__icon')).toBeNull();
  });

  it('renders iconLeft and iconRight when not loading', () => {
    const { container } = render(
      <LinkButton href="/page" iconLeft={<span>L</span>} iconRight={<span>R</span>}>
        Click
      </LinkButton>,
    );
    expect(container.querySelectorAll('.ui-button__icon')).toHaveLength(2);
  });

  it('target="_blank" without rel gets noopener noreferrer', () => {
    const { container } = render(
      <LinkButton href="https://example.com" target="_blank">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('target="_blank" with explicit rel uses provided rel', () => {
    const { container } = render(
      <LinkButton href="https://example.com" target="_blank" rel="noopener">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.getAttribute('rel')).toBe('noopener');
  });

  it('no rel attribute when target is not _blank', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('a')!.getAttribute('rel')).toBeNull();
  });

  it('forwards className to root <a>', () => {
    const { container } = render(
      <LinkButton href="/page" className="my-link">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.className).toContain('my-link');
  });

  it('forwards style to root <a>', () => {
    const { container } = render(
      <LinkButton href="/page" style={{ marginTop: '8px' }}>
        Click
      </LinkButton>,
    );
    expect((container.querySelector('a') as HTMLElement).style.marginTop).toBe('8px');
  });

  it('forwards aria-label to root <a>', () => {
    const { container } = render(
      <LinkButton href="/page" aria-label="Go to page">
        Click
      </LinkButton>,
    );
    expect(container.querySelector('a')!.getAttribute('aria-label')).toBe('Go to page');
  });

  it('calls onClick when clicked and not inactive', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <LinkButton href="/page" onClick={handleClick}>
        Click
      </LinkButton>,
    );
    fireEvent.click(container.querySelector('a')!);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders leading icon box and separator when leadingIcon is provided', () => {
    const { container } = render(
      <LinkButton href="/page" leadingIcon={<span>★</span>}>
        Click
      </LinkButton>,
    );
    expect(container.querySelector('.ui-button__icon-box--leading')).not.toBeNull();
    expect(container.querySelector('.ui-button__separator')).not.toBeNull();
  });

  it('renders trailing icon box and separator when trailingIcon is provided', () => {
    const { container } = render(
      <LinkButton href="/page" trailingIcon={<span>→</span>}>
        Click
      </LinkButton>,
    );
    expect(container.querySelector('.ui-button__icon-box--trailing')).not.toBeNull();
    expect(container.querySelector('.ui-button__separator')).not.toBeNull();
  });

  it('renders two separators when both icon boxes are provided', () => {
    const { container } = render(
      <LinkButton href="/page" leadingIcon={<span>★</span>} trailingIcon={<span>→</span>}>
        Click
      </LinkButton>,
    );
    expect(container.querySelectorAll('.ui-button__separator')).toHaveLength(2);
  });

  it('does not render icon boxes when neither prop is provided', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('.ui-button__icon-box')).toBeNull();
    expect(container.querySelector('.ui-button__separator')).toBeNull();
  });

  it('icon boxes have no role or tabIndex — no split mode on LinkButton', () => {
    const { container } = render(
      <LinkButton href="/page" leadingIcon={<span>★</span>} trailingIcon={<span>→</span>}>
        Click
      </LinkButton>,
    );
    const boxes = container.querySelectorAll('.ui-button__icon-box');
    boxes.forEach((box) => {
      expect(box.getAttribute('role')).toBeNull();
      expect(box.getAttribute('tabindex')).toBeNull();
    });
  });

  it('content wrapper is rendered', () => {
    const { container } = render(<LinkButton href="/page">Click</LinkButton>);
    expect(container.querySelector('.ui-button__content')).not.toBeNull();
  });
});

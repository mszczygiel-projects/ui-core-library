import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs.js';
import type { BreadcrumbsItem } from './Breadcrumbs.js';

afterEach(() => cleanup());

const TRAIL: BreadcrumbsItem[] = [
  { label: 'Home', href: '#/', icon: <svg data-testid="home-icon" /> },
  { label: 'Products', href: '#/products' },
  { label: 'Category', href: '#/products/category' },
  { label: 'Widget' },
];

const renderTrail = (props: Partial<React.ComponentProps<typeof Breadcrumbs>> = {}) =>
  render(<Breadcrumbs items={TRAIL} {...props} />);

describe('Breadcrumbs', () => {
  it('renders nothing for an empty trail', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('names the nav from the foundations config by default', () => {
    renderTrail();
    expect(screen.getByRole('navigation').getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('lets aria-label override the nav name', () => {
    renderTrail({ 'aria-label': 'You are here' });
    expect(screen.getByRole('navigation').getAttribute('aria-label')).toBe('You are here');
  });

  it('applies the default size and separator modifiers', () => {
    renderTrail();
    const nav = screen.getByRole('navigation');
    expect(nav.classList.contains('ui-breadcrumbs--medium')).toBe(true);
    expect(nav.classList.contains('ui-breadcrumbs--chevron')).toBe(true);
  });

  it('maps size and separator props to modifier classes', () => {
    renderTrail({ size: 'small', separator: 'slash' });
    const nav = screen.getByRole('navigation');
    expect(nav.classList.contains('ui-breadcrumbs--small')).toBe(true);
    expect(nav.classList.contains('ui-breadcrumbs--slash')).toBe(true);
  });

  it('forwards className and style to the root', () => {
    renderTrail({ className: 'custom', style: { marginTop: '8px' } });
    const nav = screen.getByRole('navigation');
    expect(nav.classList.contains('custom')).toBe(true);
    expect((nav as HTMLElement).style.marginTop).toBe('8px');
  });

  it('links every crumb with an href except the last one', () => {
    renderTrail();
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '#/',
      '#/products',
      '#/products/category',
    ]);
    expect(screen.queryByRole('link', { name: 'Widget' })).toBeNull();
  });

  it('marks the last crumb as the current page', () => {
    const { container } = renderTrail();
    const current = container.querySelectorAll('.ui-breadcrumbs__crumb--current');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('aria-current')).toBe('page');
    expect(current[0].textContent).toBe('Widget');
  });

  it('never links the last crumb even when it carries an href', () => {
    renderTrail({
      items: [
        { label: 'Home', href: '#/' },
        { label: 'Widget', href: '#/widget' },
      ],
    });
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders a crumb without href as plain text, not as the current page', () => {
    const { container } = renderTrail({
      items: [{ label: 'Home', href: '#/' }, { label: 'Archive' }, { label: 'Widget' }],
    });
    const crumbs = container.querySelectorAll('.ui-breadcrumbs__crumb');
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].classList.contains('ui-breadcrumbs__crumb--current')).toBe(false);
    expect(crumbs[0].hasAttribute('aria-current')).toBe(false);
  });

  it('draws a hidden separator after every crumb but the last', () => {
    const { container } = renderTrail();
    // 3 in-trail separators + the one that follows the collapsed-trail ellipsis
    const separators = container.querySelectorAll('.ui-breadcrumbs__separator');
    expect(separators).toHaveLength(4);
    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders the decorative ellipsis only when a crumb can be collapsed', () => {
    const { container, rerender } = renderTrail();
    expect(container.querySelector('.ui-breadcrumbs__ellipsis')!.getAttribute('aria-hidden')).toBe(
      'true',
    );

    rerender(<Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'Widget' }]} />);
    expect(container.querySelector('.ui-breadcrumbs__ellipsis')).toBeNull();
  });

  it('renders a leading icon only for items that declare one', () => {
    const { container } = renderTrail();
    expect(container.querySelectorAll('.ui-breadcrumbs__icon')).toHaveLength(1);
    expect(screen.getByTestId('home-icon')).toBeTruthy();
  });

  it('calls onSelect with the clicked item, its index, and the event', () => {
    const onSelect = vi.fn();
    renderTrail({ onSelect });
    fireEvent.click(screen.getByRole('link', { name: 'Products' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [item, index] = onSelect.mock.calls[0];
    expect(item.label).toBe('Products');
    expect(index).toBe(1);
  });

  it('does not call onSelect for the current page', () => {
    const onSelect = vi.fn();
    renderTrail({ onSelect });
    fireEvent.click(screen.getByText('Widget'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { Pagination } from './Pagination.js';
import { paginate } from './paginate.js';

afterEach(() => cleanup());

describe('paginate', () => {
  it('returns all pages when the range fits', () => {
    expect(paginate(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(4, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('truncates both sides around a middle page', () => {
    expect(paginate(5, 10, 1)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('keeps a constant entry count near the boundaries', () => {
    expect(paginate(2, 10, 1)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(paginate(9, 10, 1)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('respects siblingCount', () => {
    expect(paginate(5, 10, 0)).toEqual([1, 'ellipsis', 5, 'ellipsis', 10]);
    expect(paginate(10, 20, 2)).toEqual([1, 'ellipsis', 8, 9, 10, 11, 12, 'ellipsis', 20]);
  });

  it('clamps out-of-range input', () => {
    expect(paginate(99, 5, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(0, 3, 1)).toEqual([1, 2, 3]);
  });
});

describe('Pagination', () => {
  const setup = (props: Partial<Parameters<typeof Pagination>[0]> = {}) => {
    const onChange = vi.fn();
    const utils = render(
      <Pagination currentPage={5} totalPages={10} onChange={onChange} {...props} />,
    );
    return { onChange, ...utils };
  };

  it('renders a nav with the default accessible name', () => {
    setup();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).not.toBeNull();
  });

  it('renders truncated page items with two ellipses', () => {
    const { container } = setup();
    for (const page of [1, 4, 5, 6, 10]) {
      expect(screen.getByRole('button', { name: `Page ${page}` })).not.toBeNull();
    }
    const ellipses = container.querySelectorAll('.ui-pagination__ellipsis');
    expect(ellipses.length).toBe(2);
    expect(ellipses[0].closest('li')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the current page with aria-current and the current class', () => {
    setup();
    const current = screen.getByRole('button', { name: 'Page 5' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.className).toContain('ui-pagination__item--current');
    expect(screen.getByRole('button', { name: 'Page 4' }).getAttribute('aria-current')).toBeNull();
  });

  it('calls onChange with the clicked page, but not for the current page', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('wires prev/next and disables them at the boundaries', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenLastCalledWith(6);

    cleanup();
    setup({ currentPage: 1 });
    expect(
      (screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement).disabled,
    ).toBe(true);

    cleanup();
    setup({ currentPage: 10 });
    expect(
      (screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('commits the jump field on Enter, clamped to the range', () => {
    const { onChange } = setup();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(8);

    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(10);

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('commits the jump field on blur', () => {
    const { onChange } = setup();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('silently resets invalid jump input without calling handlers', () => {
    const { onChange } = setup();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('prefers onJumpToPage for jump commits and falls back to onChange', () => {
    const onJumpToPage = vi.fn();
    const { onChange } = setup({ onJumpToPage });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onJumpToPage).toHaveBeenCalledTimes(1);
    expect(onJumpToPage).toHaveBeenCalledWith(8);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides the jump field with hideJumpToPage and renders pageLabel', () => {
    setup({ hideJumpToPage: true, pageLabel: 'Page 5 of 10' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Page 5 of 10').className).toContain('ui-pagination__label');
  });

  it('forwards className, style and aria-* to the nav root', () => {
    const { container } = setup({
      className: 'custom',
      style: { marginTop: 8 },
      'aria-label': 'Results pages',
    });
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('ui-pagination');
    expect(nav.className).toContain('custom');
    expect(nav.style.marginTop).toBe('8px');
    expect(nav.getAttribute('aria-label')).toBe('Results pages');
  });
});

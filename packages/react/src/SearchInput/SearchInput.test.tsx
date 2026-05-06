import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { SearchInput } from './SearchInput.js';

afterEach(cleanup);

describe('SearchInput', () => {
  it('renders without error', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('input type is search', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Search...')).toHaveProperty('type', 'search');
  });

  it('placeholder defaults to Search...', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('custom placeholder is rendered', () => {
    render(<SearchInput placeholder="Find players..." />);
    expect(screen.getByPlaceholderText('Find players...')).toBeDefined();
  });

  it('search icon is rendered', () => {
    const { container } = render(<SearchInput />);
    expect(container.querySelector('.ui-text-input__icon--leading')).not.toBeNull();
  });

  it('clear button is present in DOM when empty', () => {
    const { container } = render(<SearchInput />);
    expect(container.querySelector('button.ui-search-input__clear')).not.toBeNull();
  });

  it('clear button is hidden when value is empty', () => {
    const { container } = render(<SearchInput value="" />);
    const btn = container.querySelector('button.ui-search-input__clear')!;
    expect(btn.classList.contains('ui-search-input__clear--hidden')).toBe(true);
  });

  it('clear button is visible when value is non-empty', () => {
    render(<SearchInput value="hello" />);
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.classList.contains('ui-search-input__clear--hidden')).toBe(false);
  });

  it('clear button has aria-hidden when value is empty', () => {
    const { container } = render(<SearchInput value="" />);
    const btn = container.querySelector('button.ui-search-input__clear')!;
    expect(btn.getAttribute('aria-hidden')).toBe('true');
  });

  it('clear button has no aria-hidden when value is non-empty', () => {
    render(<SearchInput value="hello" />);
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.getAttribute('aria-hidden')).toBeNull();
  });

  it('clicking clear button calls onClear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SearchInput value="hello" onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('clicking clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="hello" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('clear button is disabled when state=disabled', () => {
    render(<SearchInput state="disabled" value="test" />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveProperty('disabled', true);
  });

  it('clear button is disabled when disabled prop is set', () => {
    render(<SearchInput disabled value="test" />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveProperty('disabled', true);
  });

  it('calls onChange with value on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Search...'), 'hello');
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('clear button becomes visible after typing in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<SearchInput />);
    await user.type(screen.getByPlaceholderText('Search...'), 'test');
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.classList.contains('ui-search-input__clear--hidden')).toBe(false);
  });

  it('clear button hides after clicking in uncontrolled mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchInput />);
    await user.type(screen.getByPlaceholderText('Search...'), 'test');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    const btn = container.querySelector('button.ui-search-input__clear')!;
    expect(btn.classList.contains('ui-search-input__clear--hidden')).toBe(true);
  });

  it('forwards className to root element', () => {
    const { container } = render(<SearchInput className="my-class" />);
    expect(container.firstElementChild!.classList.contains('my-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<SearchInput style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });
});

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { SearchField } from './SearchField.js';

afterEach(cleanup);

describe('SearchField', () => {
  it('renders without error', () => {
    render(<SearchField />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('input type is search', () => {
    render(<SearchField />);
    expect(screen.getByPlaceholderText('Search...')).toHaveProperty('type', 'search');
  });

  it('placeholder defaults to Search...', () => {
    render(<SearchField />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('custom placeholder is rendered', () => {
    render(<SearchField placeholder="Find players..." />);
    expect(screen.getByPlaceholderText('Find players...')).toBeDefined();
  });

  it('search icon is rendered', () => {
    const { container } = render(<SearchField />);
    expect(container.querySelector('.ui-text-field__icon--leading')).not.toBeNull();
  });

  it('clear button is present in DOM when empty', () => {
    const { container } = render(<SearchField />);
    expect(container.querySelector('button.ui-search-field__clear')).not.toBeNull();
  });

  it('clear button is hidden when value is empty', () => {
    const { container } = render(<SearchField value="" />);
    const btn = container.querySelector('button.ui-search-field__clear')!;
    expect(btn.classList.contains('ui-search-field__clear--hidden')).toBe(true);
  });

  it('clear button is visible when value is non-empty', () => {
    render(<SearchField value="hello" />);
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.classList.contains('ui-search-field__clear--hidden')).toBe(false);
  });

  it('clear button has aria-hidden when value is empty', () => {
    const { container } = render(<SearchField value="" />);
    const btn = container.querySelector('button.ui-search-field__clear')!;
    expect(btn.getAttribute('aria-hidden')).toBe('true');
  });

  it('clear button has no aria-hidden when value is non-empty', () => {
    render(<SearchField value="hello" />);
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.getAttribute('aria-hidden')).toBeNull();
  });

  it('clicking clear button calls onClear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SearchField value="hello" onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('clicking clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchField value="hello" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('clear button is disabled when state=disabled', () => {
    render(<SearchField state="disabled" value="test" />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveProperty('disabled', true);
  });

  it('clear button is disabled when disabled prop is set', () => {
    render(<SearchField disabled value="test" />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveProperty('disabled', true);
  });

  it('calls onChange with value on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchField onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Search...'), 'hello');
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('clear button becomes visible after typing in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<SearchField />);
    await user.type(screen.getByPlaceholderText('Search...'), 'test');
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.classList.contains('ui-search-field__clear--hidden')).toBe(false);
  });

  it('clear button hides after clicking in uncontrolled mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchField />);
    await user.type(screen.getByPlaceholderText('Search...'), 'test');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    const btn = container.querySelector('button.ui-search-field__clear')!;
    expect(btn.classList.contains('ui-search-field__clear--hidden')).toBe(true);
  });

  it('forwards className to root element', () => {
    const { container } = render(<SearchField className="my-class" />);
    expect(container.firstElementChild!.classList.contains('my-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<SearchField style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });

  describe('form integration', () => {
    it('submits value via FormData', () => {
      const { container } = render(
        <form>
          <SearchField name="q" defaultValue="hello" />
        </form>,
      );
      expect(new FormData(container.querySelector('form')!).get('q')).toBe('hello');
    });

    it('excludes value from FormData when disabled', () => {
      const { container } = render(
        <form>
          <SearchField name="q" defaultValue="hello" disabled />
        </form>,
      );
      expect(new FormData(container.querySelector('form')!).get('q')).toBeNull();
    });

    it('resets to defaultValue on form reset (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <SearchField defaultValue="hello" />
          <button type="reset">Reset</button>
        </form>,
      );
      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'world');
      expect(input.value).toBe('world');

      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(input.value).toBe('hello');
    });

    it('resets to empty on form reset when no defaultValue', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <SearchField />
          <button type="reset">Reset</button>
        </form>,
      );
      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      await user.type(input, 'world');
      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(input.value).toBe('');
    });
  });
});

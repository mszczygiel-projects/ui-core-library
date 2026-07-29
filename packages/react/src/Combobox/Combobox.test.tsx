import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { Combobox } from './Combobox.js';
import type { ComboboxOption, ComboboxOptionGroup } from './Combobox.js';

afterEach(() => cleanup());

const OPTIONS: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

const GROUPS: ComboboxOptionGroup[] = [
  { label: 'Pome', options: [{ value: 'apple', label: 'Apple' }] },
  { label: 'Berry', options: [{ value: 'blueberry', label: 'Blueberry' }] },
];

const inputOf = (c: HTMLElement) => c.querySelector<HTMLInputElement>('.ui-combobox__input')!;
const fieldOf = (c: HTMLElement) => c.querySelector<HTMLElement>('.ui-combobox__field')!;
const optionLabels = (c: HTMLElement) =>
  [...c.querySelectorAll('[role="option"]')].map((n) => n.textContent!.trim());

describe('Combobox', () => {
  describe('combobox semantics', () => {
    it('puts the combobox role on the input', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      const input = inputOf(container);
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens on field click and points at an option that exists', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      fireEvent.click(fieldOf(container));
      const input = inputOf(container);
      expect(input.getAttribute('aria-expanded')).toBe('true');
      const active = input.getAttribute('aria-activedescendant');
      expect(active).not.toBeNull();
      expect(document.getElementById(active!)).not.toBeNull();
    });

    it('does not mount the list while closed', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      expect(container.querySelector('.ui-listbox')).toBeNull();
    });
  });

  describe('local filtering', () => {
    it('narrows the list to label matches', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      fireEvent.change(inputOf(container), { target: { value: 'ap' } });
      expect(optionLabels(container)).toEqual(['Apple', 'Apricot']);
    });

    it('is case-insensitive', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      fireEvent.change(inputOf(container), { target: { value: 'APRI' } });
      expect(optionLabels(container)).toEqual(['Apricot']);
    });

    it('shows the empty message when nothing matches', () => {
      const { container, getByText } = render(<Combobox options={OPTIONS} />);
      fireEvent.change(inputOf(container), { target: { value: 'zzz' } });
      expect(optionLabels(container)).toEqual([]);
      expect(getByText('No results found')).not.toBeNull();
    });

    it('leaves the list untouched in remote mode', () => {
      const { container } = render(<Combobox options={OPTIONS} filterMode="remote" />);
      fireEvent.change(inputOf(container), { target: { value: 'zzz' } });
      expect(optionLabels(container)).toEqual(['Apple', 'Apricot', 'Banana', 'Cherry']);
    });

    it('filters within groups and drops the empty ones', () => {
      const { container } = render(<Combobox options={GROUPS} />);
      fireEvent.change(inputOf(container), { target: { value: 'apple' } });
      expect(container.querySelectorAll('[role="group"]').length).toBe(1);
      expect(optionLabels(container)).toEqual(['Apple']);
    });
  });

  describe('filter callback', () => {
    it('debounces the query', () => {
      vi.useFakeTimers();
      const onFilter = vi.fn();
      const { container } = render(
        <Combobox options={OPTIONS} onFilter={onFilter} filterDebounce={50} />,
      );
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ap' } });
      expect(onFilter).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(60);
      });
      expect(onFilter).toHaveBeenCalledTimes(1);
      expect(onFilter).toHaveBeenCalledWith('ap');
      vi.useRealTimers();
    });
  });

  describe('single selection', () => {
    it('reports the value on Enter', () => {
      const onChange = vi.fn();
      const { container } = render(<Combobox options={OPTIONS} onChange={onChange} />);
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'ban' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith('banana');
    });

    it('closes after selecting', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'ban' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('shows the selected label once the value comes back in', () => {
      const { container } = render(<Combobox options={OPTIONS} value="banana" />);
      expect(inputOf(container).value).toBe('Banana');
    });

    it('reports the value on pointer selection', () => {
      const onChange = vi.fn();
      const { container, getByText } = render(<Combobox options={OPTIONS} onChange={onChange} />);
      fireEvent.click(fieldOf(container));
      fireEvent.mouseDown(getByText('Apricot'));
      expect(onChange).toHaveBeenCalledWith('apricot');
    });

    it('ignores disabled options', () => {
      const onChange = vi.fn();
      const { container, getByText } = render(<Combobox options={OPTIONS} onChange={onChange} />);
      fireEvent.click(fieldOf(container));
      fireEvent.mouseDown(getByText('Cherry'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('multiple selection', () => {
    it('renders a chip per selected value', () => {
      const { container } = render(
        <Combobox options={OPTIONS} multiple values={['apple', 'banana']} />,
      );
      const chips = container.querySelectorAll('.ui-combobox__chips .ui-chip');
      expect(chips.length).toBe(2);
    });

    it('keeps the highlight on the option just picked, not the first row', () => {
      const { container } = render(
        <Combobox options={OPTIONS} multiple values={[]} onValuesChange={vi.fn()} />,
      );
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'ban' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // The query is cleared, so the list is full again: banana is row 2.
      const active = input.getAttribute('aria-activedescendant')!;
      expect(active.endsWith('-opt-2')).toBe(true);
      expect(document.getElementById(active)!.textContent).toBe('Banana');
    });

    it('carries on arrowing from the picked option', () => {
      const { container } = render(
        <Combobox options={OPTIONS} multiple values={[]} onValuesChange={vi.fn()} />,
      );
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'app' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      // Apple is row 0 in the full list; ArrowDown must reach Apricot, not Banana.
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input.getAttribute('aria-activedescendant')!.endsWith('-opt-1')).toBe(true);
    });

    it('adds a value without dropping the existing ones', () => {
      const onValuesChange = vi.fn();
      const { container, getByText } = render(
        <Combobox options={OPTIONS} multiple values={['apple']} onValuesChange={onValuesChange} />,
      );
      fireEvent.click(fieldOf(container));
      fireEvent.mouseDown(getByText('Banana'));
      expect(onValuesChange).toHaveBeenCalledWith(['apple', 'banana']);
    });

    it('toggles a selected value off', () => {
      const onValuesChange = vi.fn();
      const { container } = render(
        <Combobox options={OPTIONS} multiple values={['apple']} onValuesChange={onValuesChange} />,
      );
      fireEvent.click(fieldOf(container));
      // "Apple" also appears as a chip, so scope the lookup to the list.
      const option = [...container.querySelectorAll('[role="option"]')].find(
        (n) => n.textContent!.trim() === 'Apple',
      )!;
      fireEvent.mouseDown(option);
      expect(onValuesChange).toHaveBeenCalledWith([]);
    });

    it('keeps the list open after picking', () => {
      const { container, getByText } = render(
        <Combobox options={OPTIONS} multiple values={[]} onValuesChange={vi.fn()} />,
      );
      fireEvent.click(fieldOf(container));
      fireEvent.mouseDown(getByText('Banana'));
      expect(inputOf(container).getAttribute('aria-expanded')).toBe('true');
    });

    it('marks the list as multi-selectable', () => {
      const { container } = render(<Combobox options={OPTIONS} multiple values={[]} />);
      fireEvent.click(fieldOf(container));
      expect(
        container.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable'),
      ).toBe('true');
    });

    it('removes the last chip on Backspace with an empty query', () => {
      const onValuesChange = vi.fn();
      const { container } = render(
        <Combobox
          options={OPTIONS}
          multiple
          values={['apple', 'banana']}
          onValuesChange={onValuesChange}
        />,
      );
      fireEvent.keyDown(inputOf(container), { key: 'Backspace' });
      expect(onValuesChange).toHaveBeenCalledWith(['apple']);
    });

    it('keeps chips intact when Backspace edits a non-empty query', () => {
      const onValuesChange = vi.fn();
      const { container } = render(
        <Combobox options={OPTIONS} multiple values={['apple']} onValuesChange={onValuesChange} />,
      );
      const input = inputOf(container);
      fireEvent.change(input, { target: { value: 'ban' } });
      fireEvent.keyDown(input, { key: 'Backspace' });
      expect(onValuesChange).not.toHaveBeenCalled();
    });

    it('removes a value from its chip', () => {
      const onValuesChange = vi.fn();
      const { container } = render(
        <Combobox
          options={OPTIONS}
          multiple
          values={['apple', 'banana']}
          onValuesChange={onValuesChange}
        />,
      );
      const dismiss = container.querySelector<HTMLElement>('.ui-chip__dismiss')!;
      fireEvent.click(dismiss);
      expect(onValuesChange).toHaveBeenCalledWith(['banana']);
    });
  });

  describe('create affordance', () => {
    it('is absent unless allowCreate is set', () => {
      const { container } = render(<Combobox options={OPTIONS} />);
      fireEvent.change(inputOf(container), { target: { value: 'kiwi' } });
      expect(container.querySelector('.ui-listbox__option--create')).toBeNull();
    });

    it('offers the query as a new option', () => {
      const { container } = render(<Combobox options={OPTIONS} allowCreate />);
      fireEvent.change(inputOf(container), { target: { value: 'kiwi' } });
      const row = container.querySelector('.ui-listbox__option--create')!;
      expect(row.textContent).toBe('Create "kiwi"');
    });

    it('emphasises only the leading word', () => {
      const { container } = render(<Combobox options={OPTIONS} allowCreate />);
      fireEvent.change(inputOf(container), { target: { value: 'kiwi' } });
      const prefix = container.querySelector('.ui-listbox__create-prefix')!;
      expect(prefix.textContent).toBe('Create');
      // The quoted query sits outside the emphasised span.
      expect(prefix.textContent).not.toContain('kiwi');
    });

    it('does not offer to create an existing label', () => {
      const { container } = render(<Combobox options={OPTIONS} allowCreate />);
      fireEvent.change(inputOf(container), { target: { value: 'Apple' } });
      expect(container.querySelector('.ui-listbox__option--create')).toBeNull();
    });

    it('reports the query through onCreate', () => {
      const onCreate = vi.fn();
      const { container } = render(<Combobox options={OPTIONS} allowCreate onCreate={onCreate} />);
      fireEvent.change(inputOf(container), { target: { value: 'kiwi' } });
      fireEvent.mouseDown(container.querySelector('.ui-listbox__option--create')!);
      expect(onCreate).toHaveBeenCalledWith('kiwi');
    });
  });

  describe('loading', () => {
    it('replaces the list with the loading message', () => {
      const { container, getByText } = render(<Combobox options={OPTIONS} loading />);
      fireEvent.click(fieldOf(container));
      expect(container.querySelectorAll('[role="option"]').length).toBe(0);
      expect(getByText('Loading...')).not.toBeNull();
    });
  });

  describe('clearing', () => {
    it('reports an empty value and drops the query', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Combobox options={OPTIONS} value="banana" clearable onChange={onChange} />,
      );
      fireEvent.mouseDown(container.querySelector('.ui-combobox__clear')!);
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('disabled', () => {
    it('does not open', () => {
      const { container } = render(<Combobox options={OPTIONS} disabled />);
      fireEvent.click(fieldOf(container));
      expect(inputOf(container).getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('forwards className and style to the root', () => {
    const { container } = render(
      <Combobox options={OPTIONS} className="custom" style={{ marginTop: '4px' }} />,
    );
    const root = container.querySelector<HTMLElement>('.ui-combobox')!;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.style.marginTop).toBe('4px');
  });
});

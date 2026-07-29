import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Listbox } from './Listbox.js';
import type { ListboxOption, ListboxOptionGroup, ListboxRow } from './Listbox.js';

afterEach(() => cleanup());

const flat: ListboxOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo', disabled: true },
  { value: 'c', label: 'Charlie' },
];

const groupedItems: ListboxOptionGroup[] = [
  { label: 'Recent', options: [{ value: 'a', label: 'Alpha' }] },
  { label: 'All', options: [{ value: 'c', label: 'Charlie' }] },
];

describe('Listbox', () => {
  it('renders one option per item with listbox semantics', () => {
    const { container } = render(<Listbox idPrefix="t" items={flat} onSelect={vi.fn()} />);
    const list = container.querySelector('[role="listbox"]');
    expect(list).not.toBeNull();
    expect(container.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('gives every option a stable id derived from the prefix', () => {
    const { container } = render(<Listbox idPrefix="season" items={flat} onSelect={vi.fn()} />);
    expect(container.querySelector('#season-opt-0')).not.toBeNull();
    expect(container.querySelector('#season-opt-2')).not.toBeNull();
  });

  it('marks the selected option via aria-selected', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={flat} value="c" onSelect={vi.fn()} />,
    );
    const selected = container.querySelectorAll('[role="option"][aria-selected="true"]');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain('Charlie');
  });

  it('marks every selected option in multi-select mode', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={flat} multiple value={['a', 'c']} onSelect={vi.fn()} />,
    );
    expect(container.querySelectorAll('[aria-selected="true"]').length).toBe(2);
    expect(container.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe(
      'true',
    );
  });

  it('renders checkboxes only in multi-select mode', () => {
    const single = render(<Listbox idPrefix="t" items={flat} onSelect={vi.fn()} />);
    expect(single.container.querySelectorAll('.ui-listbox__checkbox').length).toBe(0);
    cleanup();
    const multi = render(<Listbox idPrefix="t" items={flat} multiple onSelect={vi.fn()} />);
    expect(multi.container.querySelectorAll('.ui-listbox__checkbox').length).toBe(3);
  });

  it('puts the checkbox after the label, per the design', () => {
    const { container } = render(<Listbox idPrefix="t" items={flat} multiple onSelect={vi.fn()} />);
    const children = [...container.querySelector('#t-opt-0')!.children].map((n) => n.className);
    expect(children).toEqual(['ui-listbox__label', 'ui-listbox__checkbox']);
  });

  it('renders an option icon before the label when given', () => {
    const withIcon = [{ value: 'a', label: 'Alpha', icon: <svg data-testid="ico" /> }];
    const { container } = render(<Listbox idPrefix="t" items={withIcon} onSelect={vi.fn()} />);
    const children = [...container.querySelector('#t-opt-0')!.children].map((n) => n.className);
    expect(children).toEqual(['ui-listbox__icon', 'ui-listbox__label']);
  });

  it('omits the icon slot for options without one', () => {
    const { container } = render(<Listbox idPrefix="t" items={flat} onSelect={vi.fn()} />);
    expect(container.querySelectorAll('.ui-listbox__option .ui-listbox__icon').length).toBe(0);
  });

  it('flags grouped lists so the panel can drop its inline padding', () => {
    const grouped = render(<Listbox idPrefix="t" items={groupedItems} onSelect={vi.fn()} />);
    expect(grouped.container.querySelector('.ui-listbox--grouped')).not.toBeNull();
    expect(grouped.container.querySelectorAll('.ui-listbox__group-options').length).toBe(2);
    cleanup();
    const flatList = render(<Listbox idPrefix="t" items={flat} onSelect={vi.fn()} />);
    expect(flatList.container.querySelector('.ui-listbox--grouped')).toBeNull();
  });

  it('renders an unlabelled group as a bare separator', () => {
    const { container } = render(
      <Listbox
        idPrefix="t"
        items={[
          { label: 'Recent', options: [{ value: 'a', label: 'Alpha' }] },
          { options: [{ value: 'c', label: 'Charlie' }] },
        ]}
        onSelect={vi.fn()}
      />,
    );
    const groups = container.querySelectorAll('.ui-listbox__group');
    expect(groups.length).toBe(2);
    expect(groups[0].querySelector('.ui-listbox__group-header')).not.toBeNull();
    expect(groups[1].querySelector('.ui-listbox__group-header')).toBeNull();
    expect(groups[1].querySelector('.ui-listbox__group-separator')).not.toBeNull();
    // Nothing to name the group with, so the reference is dropped entirely.
    expect(groups[1].hasAttribute('aria-labelledby')).toBe(false);
  });

  it('omits the separator above the first group', () => {
    const { container } = render(
      <Listbox
        idPrefix="t"
        items={[{ options: [{ value: 'a', label: 'Alpha' }] }]}
        onSelect={vi.fn()}
      />,
    );
    expect(container.querySelector('.ui-listbox__group-separator')).toBeNull();
  });

  it('reserves the row surface for single-select', () => {
    const single = render(<Listbox idPrefix="t" items={flat} value="a" onSelect={vi.fn()} />);
    expect(single.container.querySelector('.ui-listbox--multiple')).toBeNull();
    cleanup();
    // In multi-select the checkbox carries the selection, so the row is not flagged.
    const multi = render(
      <Listbox idPrefix="t" items={flat} multiple value={['a']} onSelect={vi.fn()} />,
    );
    expect(multi.container.querySelector('.ui-listbox--multiple')).not.toBeNull();
    // The option keeps aria-selected either way — only the painting differs.
    expect(multi.container.querySelector('#t-opt-0')!.getAttribute('aria-selected')).toBe('true');
  });

  it('flags the active row', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={flat} activeIndex={2} onSelect={vi.fn()} />,
    );
    const active = container.querySelectorAll('.ui-listbox__option--active');
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('t-opt-2');
  });

  it('selects on mousedown and reports the row', () => {
    const onSelect = vi.fn<[ListboxRow], void>();
    const { container } = render(<Listbox idPrefix="t" items={flat} onSelect={onSelect} />);
    fireEvent.mouseDown(container.querySelector('#t-opt-2')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const row = onSelect.mock.calls[0][0];
    expect(row.kind).toBe('option');
    expect(row.kind === 'option' && row.option.value).toBe('c');
  });

  it('ignores pointer interaction on a disabled option', () => {
    const onSelect = vi.fn();
    const onActivate = vi.fn();
    const { container } = render(
      <Listbox idPrefix="t" items={flat} onSelect={onSelect} onActivate={onActivate} />,
    );
    const disabled = container.querySelector('#t-opt-1')!;
    fireEvent.mouseDown(disabled);
    fireEvent.mouseMove(disabled);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
  });

  it('reports hover so the consumer can move the active row', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <Listbox idPrefix="t" items={flat} onSelect={vi.fn()} onActivate={onActivate} />,
    );
    fireEvent.mouseMove(container.querySelector('#t-opt-0')!);
    expect(onActivate).toHaveBeenCalledWith(0);
  });

  it('renders groups with a header that names the group', () => {
    const { container } = render(<Listbox idPrefix="t" items={groupedItems} onSelect={vi.fn()} />);
    const groups = container.querySelectorAll('[role="group"]');
    expect(groups.length).toBe(2);
    expect(groups[0].getAttribute('aria-labelledby')).toBe('t-group-0');
    expect(container.querySelector('#t-group-0')?.textContent).toBe('Recent');
  });

  it('indexes rows continuously across groups', () => {
    const { container } = render(<Listbox idPrefix="t" items={groupedItems} onSelect={vi.fn()} />);
    expect(container.querySelector('#t-opt-0')?.textContent).toContain('Alpha');
    expect(container.querySelector('#t-opt-1')?.textContent).toContain('Charlie');
  });

  it('shows the empty message when there are no options', () => {
    const { container, getByText } = render(
      <Listbox idPrefix="t" items={[]} emptyLabel="Nothing here" onSelect={vi.fn()} />,
    );
    expect(getByText('Nothing here')).not.toBeNull();
    expect(container.querySelectorAll('[role="option"]').length).toBe(0);
  });

  it('shows the loading message instead of options', () => {
    const { container, getByText } = render(
      <Listbox idPrefix="t" items={flat} loading loadingLabel="Fetching" onSelect={vi.fn()} />,
    );
    expect(getByText('Fetching')).not.toBeNull();
    expect(container.querySelectorAll('[role="option"]').length).toBe(0);
  });

  it('renders the create row last and reports it as a create selection', () => {
    const onSelect = vi.fn<[ListboxRow], void>();
    const { container } = render(
      <Listbox idPrefix="t" items={flat} createValue="x" onSelect={onSelect} />,
    );
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(4);
    expect(options[3].id).toBe('t-opt-3');
    fireEvent.mouseDown(options[3]);
    expect(onSelect.mock.calls[0][0].kind).toBe('create');
    // Only the leading word carries the strong weight.
    expect(container.querySelector('.ui-listbox__create-prefix')!.textContent).toBe('Create');
    expect(options[3].textContent).toBe('Create "x"');
  });

  it('hides the create row while loading', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={[]} loading createValue="x" onSelect={vi.fn()} />,
    );
    expect(container.querySelectorAll('[role="option"]').length).toBe(0);
  });

  it('offers the create row even when nothing matched', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={[]} createValue="x" onSelect={vi.fn()} />,
    );
    expect(container.querySelectorAll('[role="option"]').length).toBe(1);
    expect(container.querySelector('.ui-listbox__option--create')).not.toBeNull();
  });

  it('applies the size modifier class', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={flat} size="large" onSelect={vi.fn()} />,
    );
    expect(container.querySelector('.ui-listbox--large')).not.toBeNull();
  });

  it('forwards className and style to the list element', () => {
    const { container } = render(
      <Listbox
        idPrefix="t"
        items={flat}
        className="custom"
        style={{ marginTop: '4px' }}
        onSelect={vi.fn()}
      />,
    );
    const list = container.querySelector<HTMLElement>('.ui-listbox')!;
    expect(list.classList.contains('custom')).toBe(true);
    expect(list.style.marginTop).toBe('4px');
  });

  it('prefers labelledBy over label for the accessible name', () => {
    const { container } = render(
      <Listbox idPrefix="t" items={flat} labelledBy="lbl" label="ignored" onSelect={vi.fn()} />,
    );
    const list = container.querySelector('[role="listbox"]')!;
    expect(list.getAttribute('aria-labelledby')).toBe('lbl');
    expect(list.getAttribute('aria-label')).toBeNull();
  });
});

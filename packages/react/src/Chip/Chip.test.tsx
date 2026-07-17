import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Chip } from './Chip.js';

afterEach(() => cleanup());

describe('Chip', () => {
  it('renders a span root with an action button and the label text', () => {
    const { container } = render(<Chip>Filter</Chip>);
    const root = container.querySelector('.ui-chip');
    expect(root).not.toBeNull();
    expect(root!.tagName).toBe('SPAN');
    const action = root!.querySelector('button.ui-chip__action');
    expect(action).not.toBeNull();
    expect(action!.getAttribute('type')).toBe('button');
    expect(container.querySelector('.ui-chip__label')!.textContent).toBe('Filter');
  });

  it('applies default classes (neutral solid), no modifiers', () => {
    const { container } = render(<Chip>Filter</Chip>);
    const cls = container.querySelector('.ui-chip')!.className;
    expect(cls).toContain('ui-chip--neutral');
    expect(cls).toContain('ui-chip--solid');
    expect(cls).not.toContain('ui-chip--medium');
    expect(cls).not.toContain('ui-chip--selected');
    expect(cls).not.toContain('ui-chip--disabled');
    expect(cls).not.toContain('ui-chip--dismissible');
  });

  it('applies variant, appearance and size classes', () => {
    const { container } = render(
      <Chip variant="error" appearance="outline" size="medium">
        Filter
      </Chip>,
    );
    const cls = container.querySelector('.ui-chip')!.className;
    expect(cls).toContain('ui-chip--error');
    expect(cls).toContain('ui-chip--outline');
    expect(cls).toContain('ui-chip--medium');
  });

  it('selected: adds the modifier class and aria-pressed', () => {
    const { container } = render(<Chip selected>Filter</Chip>);
    expect(container.querySelector('.ui-chip')!.className).toContain('ui-chip--selected');
    expect(container.querySelector('.ui-chip__action')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('omits aria-pressed when not selected', () => {
    const { container } = render(<Chip>Filter</Chip>);
    expect(container.querySelector('.ui-chip__action')!.getAttribute('aria-pressed')).toBeNull();
  });

  it('renders the leading icon inside an aria-hidden wrapper', () => {
    const { container } = render(<Chip icon={<svg data-testid="i" />}>Filter</Chip>);
    const icon = container.querySelector('.ui-chip__icon');
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
    expect(icon!.querySelector('svg')).not.toBeNull();
  });

  it('dismissible: renders the dismiss button with its accessible name', () => {
    const { container } = render(<Chip dismissible>Filter</Chip>);
    const dismiss = container.querySelector('button.ui-chip__dismiss');
    expect(dismiss).not.toBeNull();
    expect(dismiss!.getAttribute('aria-label')).toBe('Remove');
    expect(container.querySelector('.ui-chip')!.className).toContain('ui-chip--dismissible');
  });

  it('disabled: disables the action button and hides the dismiss button', () => {
    const { container } = render(
      <Chip dismissible disabled>
        Filter
      </Chip>,
    );
    const action = container.querySelector('button.ui-chip__action') as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect(container.querySelector('.ui-chip__dismiss')).toBeNull();
    expect(container.querySelector('.ui-chip')!.className).toContain('ui-chip--disabled');
  });

  it('calls onClick when the action is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<Chip onClick={onClick}>Filter</Chip>);
    fireEvent.click(container.querySelector('.ui-chip__action')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss on dismiss click without triggering onClick', () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    const { container } = render(
      <Chip dismissible onClick={onClick} onDismiss={onDismiss}>
        Filter
      </Chip>,
    );
    fireEvent.click(container.querySelector('.ui-chip__dismiss')!);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onDismiss on Delete keydown when dismissible', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Chip dismissible onDismiss={onDismiss}>
        Filter
      </Chip>,
    );
    fireEvent.keyDown(container.querySelector('.ui-chip__action')!, { key: 'Delete' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss on Delete when not dismissible', () => {
    const onDismiss = vi.fn();
    const { container } = render(<Chip onDismiss={onDismiss}>Filter</Chip>);
    fireEvent.keyDown(container.querySelector('.ui-chip__action')!, { key: 'Delete' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('honours a custom dismissLabel', () => {
    const { container } = render(
      <Chip dismissible dismissLabel="Usuń filtr">
        Filter
      </Chip>,
    );
    expect(container.querySelector('.ui-chip__dismiss')!.getAttribute('aria-label')).toBe(
      'Usuń filtr',
    );
  });

  it('forwards className and style to the root element', () => {
    const { container } = render(
      <Chip className="custom" style={{ marginTop: 4 }}>
        Filter
      </Chip>,
    );
    const root = container.querySelector('.ui-chip') as HTMLSpanElement;
    expect(root.className).toContain('custom');
    expect(root.style.marginTop).toBe('4px');
  });
});

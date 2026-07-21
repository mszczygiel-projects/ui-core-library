import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { TextareaField } from './TextareaField.js';

afterEach(cleanup);

describe('TextareaField', () => {
  it('renders without error', () => {
    render(<TextareaField label="Message" />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('renders a native textarea', () => {
    const { container } = render(<TextareaField />);
    expect(container.querySelector('textarea')).not.toBe(null);
  });

  it('renders label linked to the textarea', () => {
    render(<TextareaField label="Message" />);
    expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
  });

  it('applies outline variant class by default', () => {
    const { container } = render(<TextareaField />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--outline')).toBe(
      true,
    );
  });

  it('applies filled variant class', () => {
    const { container } = render(<TextareaField variant="filled" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--filled')).toBe(true);
  });

  it('applies underlined variant class', () => {
    const { container } = render(<TextareaField variant="underlined" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--underlined')).toBe(
      true,
    );
  });

  it('applies small size class', () => {
    const { container } = render(<TextareaField size="small" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--small')).toBe(true);
  });

  it('applies large size class', () => {
    const { container } = render(<TextareaField size="large" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--large')).toBe(true);
  });

  it('does not apply a size class for the default size', () => {
    const { container } = render(<TextareaField size="default" />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-textarea-field--small')).toBe(false);
    expect(root.classList.contains('ui-textarea-field--large')).toBe(false);
  });

  it('applies label placement classes', () => {
    const { container } = render(<TextareaField labelPlacement="floating" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--floating')).toBe(
      true,
    );
    cleanup();

    const inner = render(<TextareaField labelPlacement="inner" />);
    expect(inner.container.firstElementChild!.classList.contains('ui-textarea-field--inner')).toBe(
      true,
    );
  });

  it('applies state error class', () => {
    const { container } = render(<TextareaField state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-textarea-field--state-error')).toBe(
      true,
    );
  });

  it('does not apply a state class for the default state', () => {
    const { container } = render(<TextareaField state="default" />);
    expect(
      container.firstElementChild!.classList.contains('ui-textarea-field--state-default'),
    ).toBe(false);
  });

  it('applies resize-vertical class by default', () => {
    const { container } = render(<TextareaField />);
    expect(
      container.firstElementChild!.classList.contains('ui-textarea-field--resize-vertical'),
    ).toBe(true);
  });

  it('applies resize class for each mode', () => {
    for (const mode of ['none', 'vertical', 'auto'] as const) {
      const { container } = render(<TextareaField resize={mode} />);
      expect(
        container.firstElementChild!.classList.contains(`ui-textarea-field--resize-${mode}`),
      ).toBe(true);
      cleanup();
    }
  });

  it('forwards className and style to the root element', () => {
    const { container } = render(<TextareaField className="custom" style={{ marginTop: '8px' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.style.marginTop).toBe('8px');
  });

  it('forwards the ref to the native textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextareaField ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('links the hint via aria-describedby', () => {
    const { container } = render(<TextareaField hint="Max 500 characters" />);
    const textarea = container.querySelector('textarea')!;
    const hint = container.querySelector('.ui-textarea-field__hint')!;
    expect(textarea.getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.textContent).toBe('Max 500 characters');
  });

  it('sets aria-invalid in the error state', () => {
    const { container } = render(<TextareaField state="error" />);
    expect(container.querySelector('textarea')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('disables the textarea for state=disabled', () => {
    const { container } = render(<TextareaField state="disabled" />);
    expect(container.querySelector('textarea')!.disabled).toBe(true);
  });

  it('uses a blank placeholder in floating mode so :placeholder-shown stays accurate', () => {
    const { container } = render(
      <TextareaField labelPlacement="floating" placeholder="Ignored" label="Message" />,
    );
    expect(container.querySelector('textarea')!.placeholder).toBe(' ');
  });

  it('renders the floating label after the textarea so the sibling selector works', () => {
    const { container } = render(<TextareaField labelPlacement="floating" label="Message" />);
    const wrapper = container.querySelector('.ui-textarea-field__field-wrapper')!;
    const children = Array.from(wrapper.children);
    expect(children.indexOf(wrapper.querySelector('label')!)).toBeGreaterThan(
      children.indexOf(wrapper.querySelector('textarea')!),
    );
  });

  it('renders the top label outside the field wrapper', () => {
    const { container } = render(<TextareaField labelPlacement="top" label="Message" />);
    const label = container.querySelector('label')!;
    expect(label.closest('.ui-textarea-field__field-wrapper')).toBe(null);
  });

  it('calls onChange with the string value', async () => {
    const onChange = vi.fn();
    render(<TextareaField label="Message" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Message'), 'hi');
    expect(onChange).toHaveBeenLastCalledWith('hi');
  });

  it('forwards extra textarea attributes', () => {
    const { container } = render(<TextareaField name="message" rows={4} maxLength={500} />);
    const textarea = container.querySelector('textarea')!;
    expect(textarea.name).toBe('message');
    expect(textarea.rows).toBe(4);
    expect(textarea.maxLength).toBe(500);
  });

  it('publishes a measured height to CSS when resize is auto', () => {
    const { container } = render(<TextareaField resize="auto" defaultValue="one" />);
    const textarea = container.querySelector('textarea')!;
    expect(textarea.style.getPropertyValue('--_auto-height')).toMatch(/px$/);
  });

  it('does not publish a height when resize is not auto', () => {
    const { container } = render(<TextareaField resize="vertical" defaultValue="one" />);
    const textarea = container.querySelector('textarea')!;
    expect(textarea.style.getPropertyValue('--_auto-height')).toBe('');
  });

  it('drops the published height when switching away from auto', () => {
    const { container, rerender } = render(<TextareaField resize="auto" defaultValue="one" />);
    const textarea = container.querySelector('textarea')!;
    expect(textarea.style.getPropertyValue('--_auto-height')).not.toBe('');

    rerender(<TextareaField resize="none" defaultValue="one" />);
    expect(textarea.style.getPropertyValue('--_auto-height')).toBe('');
  });
});

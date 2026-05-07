import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { TextField } from './TextField.js';

afterEach(cleanup);

describe('TextField', () => {
  it('renders without error', () => {
    render(<TextField label="Email" />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('renders label linked to input', () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText('Email')).toBeDefined();
  });

  it('applies outline variant class by default', () => {
    const { container } = render(<TextField />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--outline')).toBe(true);
  });

  it('applies filled variant class', () => {
    const { container } = render(<TextField variant="filled" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--filled')).toBe(true);
  });

  it('applies underlined variant class', () => {
    const { container } = render(<TextField variant="underlined" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--underlined')).toBe(true);
  });

  it('applies small size class', () => {
    const { container } = render(<TextField size="small" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--small')).toBe(true);
  });

  it('applies large size class', () => {
    const { container } = render(<TextField size="large" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--large')).toBe(true);
  });

  it('does not apply size class for default size', () => {
    const { container } = render(<TextField size="default" />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-text-field--small')).toBe(false);
    expect(root.classList.contains('ui-text-field--large')).toBe(false);
  });

  it('applies state error class', () => {
    const { container } = render(<TextField state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--state-error')).toBe(
      true,
    );
  });

  it('applies state success class', () => {
    const { container } = render(<TextField state="success" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--state-success')).toBe(
      true,
    );
  });

  it('applies floating class when labelPlacement=floating', () => {
    const { container } = render(<TextField labelPlacement="floating" />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--floating')).toBe(true);
  });

  it('underlined always uses floating label', () => {
    const { container } = render(
      <TextField variant="underlined" label="Name" labelPlacement="top" />,
    );
    expect(container.firstElementChild!.classList.contains('ui-text-field--floating')).toBe(true);
  });

  it('filled always uses top label', () => {
    const { container } = render(
      <TextField variant="filled" label="Name" labelPlacement="floating" />,
    );
    expect(container.firstElementChild!.classList.contains('ui-text-field--floating')).toBe(false);
  });

  it('renders hint when provided', () => {
    render(<TextField hint="Helper text" />);
    expect(screen.getByText('Helper text')).toBeDefined();
  });

  it('does not render hint when not provided', () => {
    const { container } = render(<TextField />);
    expect(container.querySelector('.ui-text-field__hint')).toBeNull();
  });

  it('input has aria-invalid on error state', () => {
    render(<TextField state="error" label="Email" />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('input has aria-describedby pointing to hint', () => {
    render(<TextField hint="Some hint" label="Email" />);
    const input = screen.getByRole('textbox');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toBeTruthy();
  });

  it('input is disabled when state=disabled', () => {
    render(<TextField state="disabled" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('input is disabled when disabled prop is set', () => {
    render(<TextField disabled label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('calls onChange with the new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Email" onChange={onChange} value="" />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('allows typing when used uncontrolled', async () => {
    const user = userEvent.setup();
    render(<TextField label="Email" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, 'abc');

    expect(input.value).toBe('abc');
  });

  it('forwards className to root element', () => {
    const { container } = render(<TextField className="custom-class" />);
    expect(container.firstElementChild!.classList.contains('custom-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<TextField style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });

  it('forwards name to native input', () => {
    render(<TextField name="email" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).name).toBe('email');
  });

  it('forwards type to native input', () => {
    render(<TextField type="email" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('email');
  });

  it('renders leadingIcon', () => {
    const { container } = render(<TextField leadingIcon={<span data-testid="icon" />} />);
    expect(container.querySelector('.ui-text-field__icon--leading')).toBeTruthy();
  });

  it('renders trailingIcon', () => {
    const { container } = render(<TextField trailingIcon={<span data-testid="icon" />} />);
    expect(container.querySelector('.ui-text-field__icon--trailing')).toBeTruthy();
  });

  it('renders default danger trailing icon when state=error', () => {
    const { container } = render(<TextField state="error" />);
    expect(container.querySelector('.ui-text-field__icon--trailing')).toBeTruthy();
    expect(
      container.firstElementChild!.classList.contains('ui-text-field--has-trailing-icon'),
    ).toBe(true);
  });

  it('uses custom trailingIcon over default danger icon when state=error', () => {
    const { container } = render(
      <TextField state="error" trailingIcon={<span data-testid="custom" />} />,
    );
    expect(container.querySelector('[data-testid="custom"]')).toBeTruthy();
  });

  it('does not render default trailing icon outside error state', () => {
    const { container } = render(<TextField state="default" />);
    expect(container.querySelector('.ui-text-field__icon--trailing')).toBeNull();
  });

  it('applies has-leading-icon class when leadingIcon is provided', () => {
    const { container } = render(<TextField leadingIcon={<span />} />);
    expect(container.firstElementChild!.classList.contains('ui-text-field--has-leading-icon')).toBe(
      true,
    );
  });

  it('floating label is inside field-wrapper', () => {
    const { container } = render(<TextField labelPlacement="floating" label="Name" />);
    const wrapper = container.querySelector('.ui-text-field__field-wrapper');
    expect(wrapper!.querySelector('.ui-text-field__label')).toBeTruthy();
  });

  it('top label is outside field-wrapper', () => {
    const { container } = render(<TextField labelPlacement="top" label="Name" />);
    const wrapper = container.querySelector('.ui-text-field__field-wrapper');
    expect(wrapper!.querySelector('.ui-text-field__label')).toBeNull();
  });
});

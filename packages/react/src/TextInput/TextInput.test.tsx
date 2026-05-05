import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { TextInput } from './TextInput.js';

afterEach(cleanup);

describe('TextInput', () => {
  it('renders without error', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('renders label linked to input', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByLabelText('Email')).toBeDefined();
  });

  it('applies outline variant class by default', () => {
    const { container } = render(<TextInput />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--outline')).toBe(true);
  });

  it('applies filled variant class', () => {
    const { container } = render(<TextInput variant="filled" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--filled')).toBe(true);
  });

  it('applies underlined variant class', () => {
    const { container } = render(<TextInput variant="underlined" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--underlined')).toBe(true);
  });

  it('applies small size class', () => {
    const { container } = render(<TextInput size="small" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--small')).toBe(true);
  });

  it('applies large size class', () => {
    const { container } = render(<TextInput size="large" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--large')).toBe(true);
  });

  it('does not apply size class for default size', () => {
    const { container } = render(<TextInput size="default" />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-text-input--small')).toBe(false);
    expect(root.classList.contains('ui-text-input--large')).toBe(false);
  });

  it('applies state error class', () => {
    const { container } = render(<TextInput state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--state-error')).toBe(
      true,
    );
  });

  it('applies state success class', () => {
    const { container } = render(<TextInput state="success" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--state-success')).toBe(
      true,
    );
  });

  it('applies floating class when labelPlacement=floating', () => {
    const { container } = render(<TextInput labelPlacement="floating" />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--floating')).toBe(true);
  });

  it('underlined always uses floating label', () => {
    const { container } = render(
      <TextInput variant="underlined" label="Name" labelPlacement="top" />,
    );
    expect(container.firstElementChild!.classList.contains('ui-text-input--floating')).toBe(true);
  });

  it('filled always uses top label', () => {
    const { container } = render(
      <TextInput variant="filled" label="Name" labelPlacement="floating" />,
    );
    expect(container.firstElementChild!.classList.contains('ui-text-input--floating')).toBe(false);
  });

  it('renders hint when provided', () => {
    render(<TextInput hint="Helper text" />);
    expect(screen.getByText('Helper text')).toBeDefined();
  });

  it('does not render hint when not provided', () => {
    const { container } = render(<TextInput />);
    expect(container.querySelector('.ui-text-input__hint')).toBeNull();
  });

  it('input has aria-invalid on error state', () => {
    render(<TextInput state="error" label="Email" />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('input has aria-describedby pointing to hint', () => {
    render(<TextInput hint="Some hint" label="Email" />);
    const input = screen.getByRole('textbox');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toBeTruthy();
  });

  it('input is disabled when state=disabled', () => {
    render(<TextInput state="disabled" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('input is disabled when disabled prop is set', () => {
    render(<TextInput disabled label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('calls onChange with the new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextInput label="Email" onChange={onChange} value="" />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('forwards className to root element', () => {
    const { container } = render(<TextInput className="custom-class" />);
    expect(container.firstElementChild!.classList.contains('custom-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<TextInput style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });

  it('forwards name to native input', () => {
    render(<TextInput name="email" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).name).toBe('email');
  });

  it('forwards type to native input', () => {
    render(<TextInput type="email" label="Email" />);
    expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('email');
  });

  it('renders leadingIcon', () => {
    const { container } = render(<TextInput leadingIcon={<span data-testid="icon" />} />);
    expect(container.querySelector('.ui-text-input__icon--leading')).toBeTruthy();
  });

  it('renders trailingIcon', () => {
    const { container } = render(<TextInput trailingIcon={<span data-testid="icon" />} />);
    expect(container.querySelector('.ui-text-input__icon--trailing')).toBeTruthy();
  });

  it('applies has-leading-icon class when leadingIcon is provided', () => {
    const { container } = render(<TextInput leadingIcon={<span />} />);
    expect(container.firstElementChild!.classList.contains('ui-text-input--has-leading-icon')).toBe(
      true,
    );
  });

  it('floating label is inside field-wrapper', () => {
    const { container } = render(<TextInput labelPlacement="floating" label="Name" />);
    const wrapper = container.querySelector('.ui-text-input__field-wrapper');
    expect(wrapper!.querySelector('.ui-text-input__label')).toBeTruthy();
  });

  it('top label is outside field-wrapper', () => {
    const { container } = render(<TextInput labelPlacement="top" label="Name" />);
    const wrapper = container.querySelector('.ui-text-input__field-wrapper');
    expect(wrapper!.querySelector('.ui-text-input__label')).toBeNull();
  });
});

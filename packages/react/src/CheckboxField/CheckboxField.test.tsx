import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { CheckboxField } from './CheckboxField.js';

afterEach(cleanup);

describe('CheckboxField', () => {
  it('renders without error', () => {
    render(<CheckboxField label="Accept" />);
    expect(screen.getByRole('checkbox')).toBeDefined();
  });

  it('renders label text', () => {
    render(<CheckboxField label="Remember me" />);
    expect(screen.getByText('Remember me')).toBeDefined();
  });

  it('renders hint when provided', () => {
    render(<CheckboxField hint="Helper text" />);
    expect(screen.getByText('Helper text')).toBeDefined();
  });

  it('does not render hint when not provided', () => {
    const { container } = render(<CheckboxField />);
    expect(container.querySelector('.ui-checkbox-field__hint')).toBeNull();
  });

  it('input is checked when checked=true', () => {
    render(<CheckboxField label="Accept" checked onChange={() => {}} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('input is not checked when checked=false', () => {
    render(<CheckboxField label="Accept" checked={false} onChange={() => {}} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('sets input.indeterminate when indeterminate=true', () => {
    render(<CheckboxField label="Accept" indeterminate />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });

  it('applies error class on root when state=error', () => {
    const { container } = render(<CheckboxField state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-checkbox-field--error')).toBe(true);
  });

  it('applies disabled class on root when state=disabled', () => {
    const { container } = render(<CheckboxField state="disabled" />);
    expect(container.firstElementChild!.classList.contains('ui-checkbox-field--disabled')).toBe(
      true,
    );
  });

  it('disables input when state=disabled', () => {
    render(<CheckboxField label="Accept" state="disabled" />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('disables input when disabled prop is set', () => {
    render(<CheckboxField label="Accept" disabled />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('applies checked class when checked=true', () => {
    const { container } = render(<CheckboxField checked onChange={() => {}} />);
    expect(container.firstElementChild!.classList.contains('ui-checkbox-field--checked')).toBe(
      true,
    );
  });

  it('applies indeterminate class when indeterminate=true', () => {
    const { container } = render(<CheckboxField indeterminate />);
    expect(
      container.firstElementChild!.classList.contains('ui-checkbox-field--indeterminate'),
    ).toBe(true);
  });

  it('applies aria-invalid on error state', () => {
    render(<CheckboxField label="Accept" state="error" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('sets aria-describedby pointing to hint when hint is provided', () => {
    render(<CheckboxField label="Accept" hint="Some hint" />);
    const input = screen.getByRole('checkbox');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toBeTruthy();
  });

  it('forwards name to native input', () => {
    render(<CheckboxField label="Accept" name="agree" />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).name).toBe('agree');
  });

  it('forwards value to native input', () => {
    render(<CheckboxField label="Accept" value="yes" />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).value).toBe('yes');
  });

  it('forwards required to native input', () => {
    render(<CheckboxField label="Accept" required />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).required).toBe(true);
  });

  it('calls onChange with true when checkbox is checked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxField label="Accept" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxField label="Accept" checked onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('forwards className to root element', () => {
    const { container } = render(<CheckboxField className="custom" />);
    expect(container.firstElementChild!.classList.contains('custom')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<CheckboxField style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });
});

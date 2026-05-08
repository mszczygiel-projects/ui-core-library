import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { RadioField } from './RadioField.js';

afterEach(cleanup);

describe('RadioField', () => {
  it('renders without error', () => {
    render(<RadioField label="Accept" />);
    expect(screen.getByRole('radio')).toBeDefined();
  });

  it('renders label text', () => {
    render(<RadioField label="Remember me" />);
    expect(screen.getByText('Remember me')).toBeDefined();
  });

  it('renders hint when provided', () => {
    render(<RadioField hint="Helper text" />);
    expect(screen.getByText('Helper text')).toBeDefined();
  });

  it('does not render hint when not provided', () => {
    const { container } = render(<RadioField />);
    expect(container.querySelector('.ui-radio-field__hint')).toBeNull();
  });

  it('input is checked when checked=true', () => {
    render(<RadioField label="Accept" checked onChange={() => {}} />);
    expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(true);
  });

  it('input is not checked when checked=false', () => {
    render(<RadioField label="Accept" checked={false} onChange={() => {}} />);
    expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(false);
  });

  it('input is checked when defaultChecked=true', () => {
    render(<RadioField label="Accept" defaultChecked />);
    expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(true);
  });

  it('applies error class on root when state=error', () => {
    const { container } = render(<RadioField state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-radio-field--error')).toBe(true);
  });

  it('applies disabled class on root when state=disabled', () => {
    const { container } = render(<RadioField state="disabled" />);
    expect(container.firstElementChild!.classList.contains('ui-radio-field--disabled')).toBe(true);
  });

  it('disables input when state=disabled', () => {
    render(<RadioField label="Accept" state="disabled" />);
    expect((screen.getByRole('radio') as HTMLInputElement).disabled).toBe(true);
  });

  it('disables input when disabled prop is set', () => {
    render(<RadioField label="Accept" disabled />);
    expect((screen.getByRole('radio') as HTMLInputElement).disabled).toBe(true);
  });

  it('applies checked class when checked=true', () => {
    const { container } = render(<RadioField checked onChange={() => {}} />);
    expect(container.firstElementChild!.classList.contains('ui-radio-field--checked')).toBe(true);
  });

  it('applies aria-invalid on error state', () => {
    render(<RadioField label="Accept" state="error" />);
    expect(screen.getByRole('radio').getAttribute('aria-invalid')).toBe('true');
  });

  it('sets aria-describedby pointing to hint when hint is provided', () => {
    render(<RadioField label="Accept" hint="Some hint" />);
    const input = screen.getByRole('radio');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toBeTruthy();
  });

  it('forwards name to native input', () => {
    render(<RadioField label="Accept" name="agree" />);
    expect((screen.getByRole('radio') as HTMLInputElement).name).toBe('agree');
  });

  it('forwards value to native input', () => {
    render(<RadioField label="Accept" value="yes" />);
    expect((screen.getByRole('radio') as HTMLInputElement).value).toBe('yes');
  });

  it('forwards required to native input', () => {
    render(<RadioField label="Accept" required />);
    expect((screen.getByRole('radio') as HTMLInputElement).required).toBe(true);
  });

  it('calls onChange with true when radio is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioField label="Accept" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('forwards className to root element', () => {
    const { container } = render(<RadioField className="custom" />);
    expect(container.firstElementChild!.classList.contains('custom')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<RadioField style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });

  describe('form integration', () => {
    it('submits value via FormData when defaultChecked is true', () => {
      const { container } = render(
        <form>
          <RadioField name="choice" value="yes" defaultChecked />
        </form>,
      );

      expect(new FormData(container.querySelector('form')!).get('choice')).toBe('yes');
    });

    it('resets to defaultChecked on form reset', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <RadioField label="Accept" name="choice" defaultChecked />
          <button type="reset">Reset</button>
        </form>,
      );
      const input = screen.getByRole('radio') as HTMLInputElement;

      await user.click(input);
      expect(input.checked).toBe(true);

      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      expect(input.checked).toBe(false);

      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(input.checked).toBe(true);
    });
  });
});

import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwitchField } from './SwitchField.js';

// The suite runs on @testing-library/react/pure, so cleanup is explicit.
afterEach(cleanup);

const root = (container: HTMLElement) => container.querySelector('.ui-switch-field')!;

describe('SwitchField', () => {
  it('renders without error', () => {
    render(<SwitchField label="Notifications" />);
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('renders the label and description', () => {
    render(<SwitchField label="Email notifications" description="Helper text" />);
    expect(screen.getByText('Email notifications')).toBeTruthy();
    expect(screen.getByText('Helper text')).toBeTruthy();
  });

  it('links the description via aria-describedby', () => {
    render(<SwitchField label="Notifications" description="Helper text" />);
    const input = screen.getByRole('switch');
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Helper text').id);
  });

  it('omits aria-describedby when there is no description', () => {
    render(<SwitchField label="Notifications" />);
    expect(screen.getByRole('switch').hasAttribute('aria-describedby')).toBe(false);
  });

  it('maps checked to the modifier class', () => {
    const { container } = render(<SwitchField label="A" checked />);
    expect(root(container).classList.contains('ui-switch-field--checked')).toBe(true);
  });

  it('maps labelPosition="left" to the modifier class', () => {
    const { container } = render(<SwitchField label="A" labelPosition="left" />);
    expect(root(container).classList.contains('ui-switch-field--label-left')).toBe(true);
  });

  it('does not set the label-left modifier by default', () => {
    const { container } = render(<SwitchField label="A" />);
    expect(root(container).classList.contains('ui-switch-field--label-left')).toBe(false);
  });

  it('maps state="error" to the modifier class and aria-invalid', () => {
    const { container } = render(<SwitchField label="A" state="error" />);
    expect(root(container).classList.contains('ui-switch-field--error')).toBe(true);
    expect(screen.getByRole('switch').getAttribute('aria-invalid')).toBe('true');
  });

  it('disables the input via state="disabled"', () => {
    const { container } = render(<SwitchField label="A" state="disabled" />);
    expect(root(container).classList.contains('ui-switch-field--disabled')).toBe(true);
    expect((screen.getByRole('switch') as HTMLInputElement).disabled).toBe(true);
  });

  it('forwards className and style to the root', () => {
    const { container } = render(<SwitchField label="A" className="mine" style={{ margin: 4 }} />);
    expect(root(container).classList.contains('mine')).toBe(true);
    expect((root(container) as HTMLElement).style.margin).toBe('4px');
  });

  it('calls onChange with the next state', async () => {
    const onChange = vi.fn();
    render(<SwitchField label="A" onChange={onChange} />);

    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles on its own in uncontrolled mode', async () => {
    const { container } = render(<SwitchField label="A" defaultChecked />);
    expect(root(container).classList.contains('ui-switch-field--checked')).toBe(true);

    await userEvent.click(screen.getByRole('switch'));
    expect(root(container).classList.contains('ui-switch-field--checked')).toBe(false);
  });

  it('stays put in controlled mode until the prop changes', async () => {
    const { container, rerender } = render(<SwitchField label="A" checked={false} />);

    await userEvent.click(screen.getByRole('switch'));
    expect(root(container).classList.contains('ui-switch-field--checked')).toBe(false);

    rerender(<SwitchField label="A" checked />);
    expect(root(container).classList.contains('ui-switch-field--checked')).toBe(true);
  });

  it('shows iconOff while off and iconOn while on', () => {
    const { container, rerender } = render(
      <SwitchField
        label="A"
        iconOn={<span data-testid="on" />}
        iconOff={<span data-testid="off" />}
      />,
    );
    expect(screen.queryByTestId('off')).toBeTruthy();
    expect(screen.queryByTestId('on')).toBe(null);

    rerender(
      <SwitchField
        label="A"
        checked
        iconOn={<span data-testid="on" />}
        iconOff={<span data-testid="off" />}
      />,
    );
    expect(screen.queryByTestId('on')).toBeTruthy();
    expect(screen.queryByTestId('off')).toBe(null);
    expect(container.querySelector('.ui-switch-field__icon')).toBeTruthy();
  });

  it('renders no icon wrapper when no icons are given', () => {
    const { container } = render(<SwitchField label="A" />);
    expect(container.querySelector('.ui-switch-field__icon')).toBe(null);
  });
});

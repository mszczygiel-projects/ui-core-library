import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { PasswordInput } from './PasswordInput.js';

afterEach(cleanup);

describe('PasswordInput', () => {
  it('renders without error', () => {
    render(<PasswordInput label="Password" />);
    expect(screen.getByLabelText('Password')).toBeDefined();
  });

  it('input type is password by default', () => {
    render(<PasswordInput label="Password" />);
    expect(screen.getByLabelText('Password')).toHaveProperty('type', 'password');
  });

  it('toggle button renders with aria-label', () => {
    render(<PasswordInput label="Password" />);
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDefined();
  });

  it('clicking toggle changes input type to text', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggle);
    expect(screen.getByLabelText('Password')).toHaveProperty('type', 'text');
  });

  it('clicking toggle twice reverts to password type', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password')).toHaveProperty('type', 'password');
  });

  it('toggle aria-label changes after click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeDefined();
  });

  it('controlled showPassword prop is respected', () => {
    render(<PasswordInput label="Password" showPassword={true} onToggleVisibility={() => {}} />);
    expect(screen.getByLabelText('Password')).toHaveProperty('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeDefined();
  });

  it('calls onToggleVisibility when toggle is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PasswordInput label="Password" showPassword={false} onToggleVisibility={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('toggle button is disabled when state=disabled', () => {
    render(<PasswordInput label="Password" state="disabled" />);
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveProperty('disabled', true);
  });

  it('toggle button is disabled when disabled prop is set', () => {
    render(<PasswordInput label="Password" disabled />);
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveProperty('disabled', true);
  });

  it('forwards className to root element', () => {
    const { container } = render(<PasswordInput className="my-class" />);
    expect(container.firstElementChild!.classList.contains('my-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<PasswordInput style={{ marginTop: '8px' }} />);
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('8px');
  });

  it('calls onChange with value on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput label="Password" onChange={onChange} />);
    await user.type(screen.getByLabelText('Password'), 'secret');
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('secret');
  });
});

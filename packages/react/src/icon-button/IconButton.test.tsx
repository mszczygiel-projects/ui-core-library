import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton.js';

afterEach(() => cleanup());

describe('IconButton', () => {
  it('renders a <button> element', () => {
    const { container } = render(<IconButton aria-label="Action" />);
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('has type="button" by default', () => {
    const { container } = render(<IconButton aria-label="Action" />);
    expect(container.querySelector('button')!.type).toBe('button');
  });

  it('applies variant class', () => {
    const { container } = render(<IconButton variant="secondary" aria-label="Action" />);
    expect(container.querySelector('button')!.className).toContain('ui-icon-button--secondary');
  });

  it('applies size class for small', () => {
    const { container } = render(<IconButton size="small" aria-label="Action" />);
    expect(container.querySelector('button')!.className).toContain('ui-icon-button--small');
  });

  it('applies size class for large', () => {
    const { container } = render(<IconButton size="large" aria-label="Action" />);
    expect(container.querySelector('button')!.className).toContain('ui-icon-button--large');
  });

  it('does not apply size class for default', () => {
    const { container } = render(<IconButton size="default" aria-label="Action" />);
    expect(container.querySelector('button')!.className).not.toContain('ui-icon-button--default');
  });

  it('disabled prop disables the button', () => {
    const { container } = render(<IconButton disabled aria-label="Action" />);
    expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('loading prop disables the button and sets aria-busy', () => {
    const { container } = render(<IconButton loading aria-label="Action" />);
    const btn = container.querySelector('button')!;
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('loading renders Loader and hides icon', () => {
    const { container } = render(
      <IconButton loading aria-label="Action" icon={<span>★</span>} />,
    );
    expect(container.querySelector('.ui-loader')).not.toBeNull();
    expect(container.querySelector('.ui-icon-button__icon')).toBeNull();
  });

  it('renders icon when not loading', () => {
    const { container } = render(<IconButton aria-label="Action" icon={<span>★</span>} />);
    expect(container.querySelector('.ui-icon-button__icon')).not.toBeNull();
  });

  it('forwards aria-label to root <button>', () => {
    const { container } = render(<IconButton aria-label="Delete item" />);
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Delete item');
  });

  it('forwards className to root <button>', () => {
    const { container } = render(<IconButton aria-label="Action" className="my-btn" />);
    expect(container.querySelector('button')!.className).toContain('my-btn');
  });

  it('forwards style to root <button>', () => {
    const { container } = render(
      <IconButton aria-label="Action" style={{ marginTop: '8px' }} />,
    );
    expect((container.querySelector('button') as HTMLElement).style.marginTop).toBe('8px');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(<IconButton aria-label="Action" onClick={handleClick} />);
    fireEvent.click(container.querySelector('button')!);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <IconButton disabled aria-label="Action" onClick={handleClick} />,
    );
    fireEvent.click(container.querySelector('button')!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <IconButton variant="primary" aria-label="Action" icon={<span>★</span>} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

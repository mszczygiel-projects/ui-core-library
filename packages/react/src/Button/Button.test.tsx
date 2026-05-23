import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Button } from './Button.js';

afterEach(() => cleanup());

describe('Button', () => {
  it('renders a <button> element', () => {
    const { container } = render(<Button>Click</Button>);
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('has type="button" by default', () => {
    const { container } = render(<Button>Click</Button>);
    expect(container.querySelector('button')!.type).toBe('button');
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="secondary">Click</Button>);
    expect(container.querySelector('button')!.className).toContain('ui-button--secondary');
  });

  it('applies size class for small', () => {
    const { container } = render(<Button size="small">Click</Button>);
    expect(container.querySelector('button')!.className).toContain('ui-button--small');
  });

  it('applies size class for large', () => {
    const { container } = render(<Button size="large">Click</Button>);
    expect(container.querySelector('button')!.className).toContain('ui-button--large');
  });

  it('does not apply size class for default', () => {
    const { container } = render(<Button size="default">Click</Button>);
    expect(container.querySelector('button')!.className).not.toContain('ui-button--default');
  });

  it('disabled prop disables the button', () => {
    const { container } = render(<Button disabled>Click</Button>);
    expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('loading prop disables the button and sets aria-busy', () => {
    const { container } = render(<Button loading>Click</Button>);
    const btn = container.querySelector('button')!;
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('loading renders Loader and hides icon props', () => {
    const { container } = render(
      <Button loading iconLeft={<span>L</span>} iconRight={<span>R</span>}>
        Click
      </Button>,
    );
    expect(container.querySelector('.ui-loader')).not.toBeNull();
    expect(container.querySelector('.ui-button__icon')).toBeNull();
  });

  it('loading dims the label', () => {
    const { container } = render(<Button loading>Click</Button>);
    expect(container.querySelector('.ui-button--loading')).not.toBeNull();
    expect(container.querySelector('.ui-button__label')).not.toBeNull();
  });

  it('renders iconLeft and iconRight when not loading', () => {
    const { container } = render(
      <Button iconLeft={<span>L</span>} iconRight={<span>R</span>}>
        Click
      </Button>,
    );
    const icons = container.querySelectorAll('.ui-button__icon');
    expect(icons).toHaveLength(2);
  });

  it('renders only iconLeft when iconRight is absent', () => {
    const { container } = render(<Button iconLeft={<span>L</span>}>Click</Button>);
    expect(container.querySelectorAll('.ui-button__icon')).toHaveLength(1);
  });

  it('forwards className to root <button>', () => {
    const { container } = render(<Button className="my-btn">Click</Button>);
    expect(container.querySelector('button')!.className).toContain('my-btn');
  });

  it('forwards style to root <button>', () => {
    const { container } = render(<Button style={{ marginTop: '8px' }}>Click</Button>);
    expect((container.querySelector('button') as HTMLElement).style.marginTop).toBe('8px');
  });

  it('forwards aria-label to root <button>', () => {
    const { container } = render(<Button aria-label="Save item">Click</Button>);
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Save item');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(container.querySelector('button')!);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>,
    );
    fireEvent.click(container.querySelector('button')!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders leading icon box and separator when leadingIcon is provided', () => {
    const { container } = render(<Button leadingIcon={<span>L</span>}>Click</Button>);
    expect(container.querySelector('.ui-button__icon-box--leading')).not.toBeNull();
    expect(container.querySelector('.ui-button__separator')).not.toBeNull();
  });

  it('renders trailing icon box and separator when trailingIcon is provided', () => {
    const { container } = render(<Button trailingIcon={<span>R</span>}>Click</Button>);
    expect(container.querySelector('.ui-button__icon-box--trailing')).not.toBeNull();
    expect(container.querySelector('.ui-button__separator')).not.toBeNull();
  });

  it('renders two separators when both icon boxes are provided', () => {
    const { container } = render(
      <Button leadingIcon={<span>L</span>} trailingIcon={<span>R</span>}>
        Click
      </Button>,
    );
    expect(container.querySelectorAll('.ui-button__separator')).toHaveLength(2);
  });

  it('does not add split class when onLeadingIconClick is absent', () => {
    const { container } = render(<Button leadingIcon={<span>L</span>}>Click</Button>);
    expect(container.querySelector('.ui-button__icon-box--split')).toBeNull();
  });

  it('adds split class and role=button when onLeadingIconClick is provided', () => {
    const { container } = render(
      <Button leadingIcon={<span>L</span>} onLeadingIconClick={vi.fn()}>
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading');
    expect(box?.classList.contains('ui-button__icon-box--split')).toBe(true);
    expect(box?.getAttribute('role')).toBe('button');
    expect(box?.getAttribute('tabindex')).toBe('0');
  });

  it('calls onLeadingIconClick and stops propagation when split leading is clicked', () => {
    const onLeadingIconClick = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <Button
        leadingIcon={<span>L</span>}
        onLeadingIconClick={onLeadingIconClick}
        onClick={onClick}
      >
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading')!;
    fireEvent.click(box);
    expect(onLeadingIconClick).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onTrailingIconClick and stops propagation when split trailing is clicked', () => {
    const onTrailingIconClick = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <Button
        trailingIcon={<span>R</span>}
        onTrailingIconClick={onTrailingIconClick}
        onClick={onClick}
      >
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--trailing')!;
    fireEvent.click(box);
    expect(onTrailingIconClick).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('click on icon box without split handler propagates to button onClick', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button leadingIcon={<span>L</span>} onClick={onClick}>
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading')!;
    fireEvent.click(box);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('split mode disabled when button is disabled — no role/tabIndex on icon box', () => {
    const { container } = render(
      <Button disabled leadingIcon={<span>L</span>} onLeadingIconClick={vi.fn()}>
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading');
    expect(box?.getAttribute('role')).toBeNull();
    expect(box?.getAttribute('tabindex')).toBeNull();
  });

  it('calls onLeadingIconClick on Enter key in split mode', () => {
    const onLeadingIconClick = vi.fn();
    const { container } = render(
      <Button leadingIcon={<span>L</span>} onLeadingIconClick={onLeadingIconClick}>
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading')!;
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onLeadingIconClick).toHaveBeenCalledOnce();
  });

  it('calls onLeadingIconClick on Space key in split mode', () => {
    const onLeadingIconClick = vi.fn();
    const { container } = render(
      <Button leadingIcon={<span>L</span>} onLeadingIconClick={onLeadingIconClick}>
        Click
      </Button>,
    );
    const box = container.querySelector('.ui-button__icon-box--leading')!;
    fireEvent.keyDown(box, { key: ' ' });
    expect(onLeadingIconClick).toHaveBeenCalledOnce();
  });
});

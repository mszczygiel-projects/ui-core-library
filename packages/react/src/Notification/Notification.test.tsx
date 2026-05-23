import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Notification } from './Notification.js';

afterEach(() => cleanup());

describe('Notification', () => {
  it('renders without error', () => {
    const { container } = render(<Notification heading="Test notification" />);
    expect(container.querySelector('.ui-notification')).not.toBeNull();
  });

  it('has role="alert"', () => {
    const { container } = render(<Notification heading="Test" />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('applies status class', () => {
    const statuses = ['info', 'success', 'warning', 'error'] as const;
    for (const status of statuses) {
      const { container } = render(<Notification heading="Test" status={status} />);
      expect(container.querySelector(`.ui-notification--${status}`)).not.toBeNull();
      cleanup();
    }
  });

  it('applies variant class', () => {
    const { container: d } = render(<Notification heading="Test" variant="default" />);
    expect(d.querySelector('.ui-notification--default')).not.toBeNull();
    cleanup();

    const { container: s } = render(<Notification heading="Test" variant="subtle" />);
    expect(s.querySelector('.ui-notification--subtle')).not.toBeNull();
  });

  it('renders heading text', () => {
    const { getByText } = render(<Notification heading="Hello world" />);
    expect(getByText('Hello world')).not.toBeNull();
  });

  it('heading is in a .ui-notification__heading element', () => {
    const { container } = render(<Notification heading="My heading" />);
    expect(container.querySelector('.ui-notification__heading')?.textContent).toBe('My heading');
  });

  it('renders children as description', () => {
    const { getByText } = render(
      <Notification heading="Title">Some description text</Notification>,
    );
    expect(getByText('Some description text')).not.toBeNull();
  });

  it('does not render description element when no children', () => {
    const { container } = render(<Notification heading="Title" />);
    expect(container.querySelector('.ui-notification__description')).toBeNull();
  });

  it('renders close button by default', () => {
    const { container } = render(<Notification heading="Title" />);
    expect(container.querySelector('.ui-notification__close')).not.toBeNull();
  });

  it('does not render close button when hasCloseButton=false', () => {
    const { container } = render(<Notification heading="Title" hasCloseButton={false} />);
    expect(container.querySelector('.ui-notification__close')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Notification heading="Title" onClose={onClose} />);
    fireEvent.click(container.querySelector('.ui-notification__close') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button has accessible label', () => {
    const { container } = render(<Notification heading="Title" />);
    expect(container.querySelector('.ui-notification__close')?.getAttribute('aria-label')).toBe(
      'Close notification',
    );
  });

  it('icon element is always present in the DOM (visibility via CSS)', () => {
    const { container: d } = render(<Notification heading="Title" variant="default" />);
    expect(d.querySelector('.ui-notification__icon')).not.toBeNull();
    cleanup();

    const { container: s } = render(<Notification heading="Title" variant="subtle" />);
    expect(s.querySelector('.ui-notification__icon')).not.toBeNull();
  });

  it('forwards className to root element', () => {
    const { container } = render(<Notification heading="Title" className="custom-class" />);
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  it('forwards style to root element', () => {
    const { container } = render(<Notification heading="Title" style={{ maxWidth: '400px' }} />);
    expect((container.querySelector('.ui-notification') as HTMLElement).style.maxWidth).toBe(
      '400px',
    );
  });
});

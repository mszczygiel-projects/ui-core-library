import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Notification } from './Notification.js';

afterEach(() => cleanup());

describe('Notification', () => {
  it('renders without error', () => {
    const { container } = render(<Notification title="Test notification" />);
    expect(container.querySelector('.ui-notification')).not.toBeNull();
  });

  it('has role="alert"', () => {
    const { container } = render(<Notification title="Test" />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('applies status class', () => {
    const statuses = ['info', 'success', 'warning', 'error'] as const;
    for (const status of statuses) {
      const { container } = render(<Notification title="Test" status={status} />);
      expect(container.querySelector(`.ui-notification--${status}`)).not.toBeNull();
      cleanup();
    }
  });

  it('applies variant class', () => {
    const { container: d } = render(<Notification title="Test" variant="default" />);
    expect(d.querySelector('.ui-notification--default')).not.toBeNull();
    cleanup();

    const { container: s } = render(<Notification title="Test" variant="subtle" />);
    expect(s.querySelector('.ui-notification--subtle')).not.toBeNull();
  });

  it('renders title text', () => {
    const { getByText } = render(<Notification title="Hello world" />);
    expect(getByText('Hello world')).not.toBeNull();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <Notification title="Title" description="Some description text" />,
    );
    expect(getByText('Some description text')).not.toBeNull();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<Notification title="Title" />);
    expect(container.querySelector('.ui-notification__description')).toBeNull();
  });

  it('renders close button by default', () => {
    const { container } = render(<Notification title="Title" />);
    expect(container.querySelector('.ui-notification__close')).not.toBeNull();
  });

  it('does not render close button when hasCloseButton=false', () => {
    const { container } = render(<Notification title="Title" hasCloseButton={false} />);
    expect(container.querySelector('.ui-notification__close')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Notification title="Title" onClose={onClose} />);
    const btn = container.querySelector('.ui-notification__close') as HTMLElement;
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button has accessible label', () => {
    const { container } = render(<Notification title="Title" />);
    const btn = container.querySelector('.ui-notification__close');
    expect(btn?.getAttribute('aria-label')).toBe('Close notification');
  });

  it('icon element is always present in the DOM (visibility controlled by CSS)', () => {
    const { container: d } = render(<Notification title="Title" variant="default" />);
    expect(d.querySelector('.ui-notification__icon')).not.toBeNull();
    cleanup();

    const { container: s } = render(<Notification title="Title" variant="subtle" />);
    expect(s.querySelector('.ui-notification__icon')).not.toBeNull();
  });

  it('forwards className to root element', () => {
    const { container } = render(<Notification title="Title" className="custom-class" />);
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  it('forwards style to root element', () => {
    const { container } = render(<Notification title="Title" style={{ maxWidth: '400px' }} />);
    const el = container.querySelector('.ui-notification') as HTMLElement;
    expect(el.style.maxWidth).toBe('400px');
  });
});

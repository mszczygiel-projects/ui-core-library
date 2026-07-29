import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Badge } from './Badge.js';

afterEach(() => cleanup());

describe('Badge', () => {
  it('renders a span with the label text', () => {
    const { container } = render(<Badge>New</Badge>);
    const root = container.querySelector('.ui-badge');
    expect(root).not.toBeNull();
    expect(root!.tagName).toBe('SPAN');
    expect(container.querySelector('.ui-badge__label')!.textContent).toBe('New');
  });

  it('applies default classes (neutral solid), no size/shape modifiers', () => {
    const { container } = render(<Badge>New</Badge>);
    const cls = container.querySelector('.ui-badge')!.className;
    expect(cls).toContain('ui-badge--neutral');
    expect(cls).toContain('ui-badge--solid');
    expect(cls).not.toContain('ui-badge--medium');
    expect(cls).not.toContain('ui-badge--square');
    expect(cls).not.toContain('ui-badge--icon-only');
  });

  it('applies variant class', () => {
    const { container } = render(<Badge variant="error">Failed</Badge>);
    expect(container.querySelector('.ui-badge')!.className).toContain('ui-badge--error');
  });

  it('applies appearance class', () => {
    const { container } = render(<Badge appearance="subtle">New</Badge>);
    expect(container.querySelector('.ui-badge')!.className).toContain('ui-badge--subtle');
  });

  it('applies size class for medium', () => {
    const { container } = render(<Badge size="medium">New</Badge>);
    expect(container.querySelector('.ui-badge')!.className).toContain('ui-badge--medium');
  });

  it('applies shape class for square', () => {
    const { container } = render(<Badge shape="square">New</Badge>);
    expect(container.querySelector('.ui-badge')!.className).toContain('ui-badge--square');
  });

  it('renders icon inside an aria-hidden wrapper', () => {
    const { container } = render(<Badge icon={<svg data-testid="i" />}>New</Badge>);
    const icon = container.querySelector('.ui-badge__icon');
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
    expect(icon!.querySelector('svg')).not.toBeNull();
  });

  it('derives icon-only mode when icon is set and children are absent', () => {
    const { container } = render(<Badge icon={<svg />} aria-label="Info" />);
    const root = container.querySelector('.ui-badge')!;
    expect(root.className).toContain('ui-badge--icon-only');
    expect(container.querySelector('.ui-badge__label')).toBeNull();
    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Info');
  });

  it('does not set role="img" when label text is present', () => {
    const { container } = render(
      <Badge icon={<svg />} aria-label="Status">
        New
      </Badge>,
    );
    const root = container.querySelector('.ui-badge')!;
    expect(root.className).not.toContain('ui-badge--icon-only');
    expect(root.getAttribute('role')).toBeNull();
    expect(root.getAttribute('aria-label')).toBe('Status');
  });

  it('forwards className and style to the root element', () => {
    const { container } = render(
      <Badge className="custom" style={{ marginTop: 4 }}>
        New
      </Badge>,
    );
    const root = container.querySelector('.ui-badge') as HTMLSpanElement;
    expect(root.className).toContain('custom');
    expect(root.style.marginTop).toBe('4px');
  });
});

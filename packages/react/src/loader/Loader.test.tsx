import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Loader } from './Loader.js';

afterEach(() => cleanup());

describe('Loader', () => {
  it('renders with role="status"', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it('aria-label reflects label prop', () => {
    const { container } = render(<Loader label="Please wait" />);
    expect(container.querySelector('[role="status"]')!.getAttribute('aria-label')).toBe(
      'Please wait',
    );
  });

  it('matches snapshot', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

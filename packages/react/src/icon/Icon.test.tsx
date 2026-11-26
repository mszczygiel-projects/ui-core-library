import '@mszczygiel-projects/ui-core-foundations/tokens.css';
import './icon.css';
import '../internal/action.css';
import '../icon-button/icon-button.css';

import { iconSearch } from '@mszczygiel-projects/ui-core-icons';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { IconButton } from '../icon-button/IconButton.tsx';
import { Icon, type IconSize } from './Icon.tsx';

/** The width of the artwork in the first icon of the container, in pixels. */
function artworkWidth(container: Element): number | undefined {
  return container.querySelector('.ui-icon svg')?.getBoundingClientRect().width;
}

describe('Icon', () => {
  it('inserts the SVG into a span hidden from assistive technology', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <Icon ref={ref} svg={iconSearch} id="search" className="spaced" data-owner="page" />,
    );
    expect(ref.current?.querySelector('svg')).not.toBeNull();
    expect(ref.current?.getAttribute('aria-hidden')).toBe('true');
    expect(ref.current?.id).toBe('search');
    expect(ref.current?.classList.contains('spaced')).toBe(true);
    expect(ref.current?.dataset['owner']).toBe('page');
  });

  it('is as large as the font size around it without a size', async () => {
    const screen = await render(
      <div style={{ fontSize: '40px' }}>
        <Icon svg={iconSearch} />
      </div>,
    );
    expect(artworkWidth(screen.container)).toBe(40);
  });

  it.each<[IconSize, number, number]>([
    ['2xs', 12, 12],
    ['xs', 16, 12],
    ['sm', 20, 16],
    ['md', 24, 20],
    ['lg', 32, 24],
  ])('takes the size %s from its token in both densities', async (size, comfortable, compact) => {
    const screen = await render(
      <div style={{ fontSize: '40px' }}>
        <Icon svg={iconSearch} size={size} />
        <div data-density="compact">
          <Icon svg={iconSearch} size={size} />
        </div>
      </div>,
    );
    const widths = [...screen.container.querySelectorAll('.ui-icon svg')].map(
      (svg) => svg.getBoundingClientRect().width,
    );
    expect(widths).toEqual([comfortable, compact]);
  });

  it('takes the icon size of the component whose slot holds it', async () => {
    const screen = await render(
      <div style={{ fontSize: '40px', ['--button-icon-size' as string]: '28px' }}>
        <IconButton label="Search" icon={<Icon svg={iconSearch} />} />
      </div>,
    );
    expect(artworkWidth(screen.container)).toBe(28);
  });

  it('renders on the server and hydrates without a warning', async () => {
    const element = <Icon svg={iconSearch} size="sm" />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recovered = vi.fn();
    const root = hydrateRoot(container, element, { onRecoverableError: recovered });
    await vi.waitFor(() => {
      expect(container.querySelector('.ui-icon svg')).not.toBeNull();
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(errors).not.toHaveBeenCalled();
    expect(recovered).not.toHaveBeenCalled();
    errors.mockRestore();
    root.unmount();
    container.remove();
  });
});

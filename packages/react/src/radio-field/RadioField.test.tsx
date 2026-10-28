import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { RadioGroup } from '../radio-group/RadioGroup.tsx';
import { RadioField } from './RadioField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('RadioField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<RadioField ref={ref} value="a" label="A" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<RadioField value="a" label="A" hint="First" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <RadioField value="a" label="A" hint="First" />, {
      onRecoverableError: recoverable,
    });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('takes the name of its group and stays out of every form when the group has none', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(
      <RadioGroup label="Pick">
        <RadioField ref={ref} value="a" label="A" />
      </RadioGroup>,
    );
    expect(ref.current?.name).not.toBe('');
    expect(ref.current?.form).toBeNull();
    expect(ref.current?.getAttribute('form')).toBe('');
  });
});

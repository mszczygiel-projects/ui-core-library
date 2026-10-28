import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { RadioField } from '../radio-field/RadioField.tsx';
import { RadioGroup } from './RadioGroup.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('RadioGroup', () => {
  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(
      <RadioGroup label="Pick" name="pick" defaultValue="a">
        <RadioField value="a" label="A" />
        <RadioField value="b" label="B" />
      </RadioGroup>,
    );
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <RadioGroup label="Pick" name="pick" defaultValue="a">
        <RadioField value="a" label="A" />
        <RadioField value="b" label="B" />
      </RadioGroup>,
      { onRecoverableError: recoverable },
    );
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('passes its ref to the element with the role radiogroup', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <RadioGroup ref={ref} label="Pick">
        <RadioField value="a" label="A" />
      </RadioGroup>,
    );
    expect(ref.current?.getAttribute('role')).toBe('radiogroup');
  });
});

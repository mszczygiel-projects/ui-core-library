import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Listbox } from './Listbox.tsx';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Listbox', () => {
  it('passes its ref to the element with its role', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Listbox ref={ref} label="Fruit" options={options} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('listbox');
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Listbox label="Fruit" options={options} defaultValue="b" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <Listbox label="Fruit" options={options} defaultValue="b" />,
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

  it('submits one entry for each chosen value through its hidden select', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    await render(
      <Listbox label="Fruit" name="fruit" multiple options={options} defaultValue={['a', 'b']} />,
      {
        container: form,
      },
    );
    expect(new FormData(form).getAll('fruit')).toEqual(['a', 'b']);
    form.remove();
  });

  it('follows a disabled fieldset', async () => {
    const fieldset = document.createElement('fieldset');
    document.body.append(fieldset);
    await render(<Listbox label="Fruit" options={options} />, { container: fieldset });
    fieldset.disabled = true;
    await expect
      .poll(() => fieldset.querySelector('[role="listbox"]')?.getAttribute('aria-disabled'))
      .toBe('true');
    fieldset.remove();
  });
});

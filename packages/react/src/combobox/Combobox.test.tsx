import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Combobox } from './Combobox.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

describe('Combobox', () => {
  it('passes its ref to the element with its role', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<Combobox label="Fruit" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.getAttribute('role')).toBe('combobox');
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Combobox label="Fruit" options={options} defaultValue="a" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <Combobox label="Fruit" options={options} defaultValue="a" />,
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

  it('submits each chosen value through its hidden select', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const screen = await render(
      <Combobox label="Fruit" name="fruit" options={options} multiple value={['a', 'b']} />,
      { container: form },
    );
    expect(new FormData(form).getAll('fruit')).toEqual(['a', 'b']);
    await screen.rerender(<Combobox label="Fruit" name="fruit" options={options} value="b" />);
    expect(new FormData(form).getAll('fruit')).toEqual(['b']);
    form.remove();
  });

  it('does not render its popup while closed', async () => {
    const screen = await render(<Combobox label="Fruit" options={options} />);
    expect(screen.container.ownerDocument.querySelector('[role="listbox"]')).toBeNull();
  });

  it('renders again after a press when it has no options', async () => {
    const screen = await render(<Combobox label="Fruit" allowCreate />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('kiwi');
    await expect.element(screen.getByRole('option', { name: 'Create “kiwi”' })).toBeVisible();
  });
});

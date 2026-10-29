import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SelectField } from './SelectField.tsx';

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

describe('SelectField', () => {
  it('passes its ref to the element with its role', async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(<SelectField ref={ref} label="Fruit" options={options} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.getAttribute('role')).toBe('combobox');
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<SelectField label="Fruit" options={options} defaultValue="b" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <SelectField label="Fruit" options={options} defaultValue="b" />,
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

  it('submits the chosen value, or an empty string, through its hidden select', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const screen = await render(<SelectField label="Fruit" name="fruit" options={options} />, {
      container: form,
    });
    expect(new FormData(form).get('fruit')).toBe('');
    await screen.rerender(<SelectField label="Fruit" name="fruit" options={options} value="b" />);
    expect(new FormData(form).get('fruit')).toBe('b');
    form.remove();
  });

  it('does not render its popup while closed', async () => {
    const screen = await render(<SelectField label="Fruit" options={options} />);
    expect(screen.container.ownerDocument.querySelector('[role="listbox"]')).toBeNull();
  });
});

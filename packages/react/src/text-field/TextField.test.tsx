import { type ChangeEvent, createRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { TextField, type TextFieldValueChangeDetails } from './TextField.tsx';

describe('TextField', () => {
  it('passes the ref, native attributes and author ARIA to the input', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(
      <TextField
        ref={ref}
        id="account"
        className="owner"
        data-owner="page"
        data-density="compact"
        style={{ width: 200 }}
        aria-label="Work email"
        aria-describedby="external"
        hint="Internal hint"
        autoComplete="email"
        inputMode="email"
        enterKeyHint="next"
        spellCheck={false}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.id).toBe('account');
    expect(screen.container.querySelector('.ui-text-field')?.classList.contains('owner')).toBe(
      true,
    );
    expect(ref.current?.classList.contains('owner')).toBe(false);
    expect(screen.container.querySelector<HTMLElement>('.ui-text-field')?.dataset['owner']).toBe(
      'page',
    );
    expect(ref.current?.dataset['owner']).toBeUndefined();
    expect(screen.container.querySelector<HTMLElement>('.ui-text-field')?.style.width).toBe(
      '200px',
    );
    expect(screen.container.querySelector<HTMLElement>('.ui-text-field')?.dataset['density']).toBe(
      'compact',
    );
    expect(ref.current?.style.width).toBe('');
    expect(ref.current?.getAttribute('aria-label')).toBe('Work email');
    expect(ref.current?.getAttribute('aria-describedby')).toBe(
      `external ${screen.container.querySelector('.ui-text-field__hint')?.id ?? ''}`,
    );
    expect([
      ref.current?.autocomplete,
      ref.current?.inputMode,
      ref.current?.enterKeyHint,
      ref.current?.spellcheck,
    ]).toEqual(['email', 'email', 'next', false]);
    ref.current?.setCustomValidity('Taken');
    expect(ref.current?.validationMessage).toBe('Taken');
  });

  it('supports controlled values and both native React edit handlers', async () => {
    const changed = vi.fn<(event: ChangeEvent<HTMLInputElement>) => void>();
    const input = vi.fn();
    const valueChanged = vi.fn<(value: string, details: TextFieldValueChangeDetails) => void>();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <TextField
          label="Name"
          value={value}
          onInput={input}
          onChange={changed}
          onValueChange={(next, details) => {
            valueChanged(next, details);
            setValue(next);
          }}
        />
      );
    }
    const screen = await render(<Controlled />);
    await screen.getByRole('textbox').fill('Ada');
    expect(screen.container.querySelector('input')?.value).toBe('Ada');
    expect(changed).toHaveBeenCalledOnce();
    expect(input).toHaveBeenCalledOnce();
    expect(valueChanged).toHaveBeenCalledOnce();
    expect(valueChanged.mock.calls[0]?.[1].originalEvent).toBe(
      changed.mock.calls[0]?.[0].nativeEvent,
    );
  });

  it('retains a controlled value when the consumer declines an edit', async () => {
    const screen = await render(
      <TextField label="Name" value="Saved" onValueChange={() => undefined} />,
    );
    await screen.getByRole('textbox').fill('Rejected');
    expect(screen.container.querySelector('input')?.value).toBe('Saved');
  });

  it('supports uncontrolled edits, silent reset and callback ref cleanup', async () => {
    const changed = vi.fn();
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const screen = await render(
      <form>
        <TextField ref={ref} label="Name" defaultValue="Initial" onValueChange={changed} />
      </form>,
    );
    await screen.getByRole('textbox').fill('Edited');
    expect(screen.container.querySelector('input')?.value).toBe('Edited');
    changed.mockClear();
    screen.container.querySelector('form')?.reset();
    expect(screen.container.querySelector('input')?.value).toBe('Initial');
    expect(changed).not.toHaveBeenCalled();
    await screen.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('hydrates stable labels and descriptions without warnings', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recovered = vi.fn();
    const container = document.createElement('div');
    document.body.append(container);
    let finishHydration: (() => void) | undefined;
    const hydrated = new Promise<void>((resolve) => {
      finishHydration = resolve;
    });
    const view = (
      <TextField
        ref={() => {
          finishHydration?.();
        }}
        label="Name"
        hint="Use your work account"
        defaultValue="Ada"
        labelPlacement="floating"
      />
    );
    container.innerHTML = renderToString(view);
    const before = container.querySelector('input')?.id;
    const root = hydrateRoot(container, view, { onRecoverableError: recovered });
    try {
      await hydrated;
      expect(container.querySelector('input')?.id).toBe(before);
      expect(container.querySelector('label')?.htmlFor).toBe(before);
      expect(container.querySelector('input')?.value).toBe('Ada');
      expect(error).not.toHaveBeenCalled();
      expect(recovered).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      container.remove();
      error.mockRestore();
    }
  });
});

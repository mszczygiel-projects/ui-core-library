import { createRef, StrictMode, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { NumberField } from './NumberField.tsx';

describe('NumberField', () => {
  it('forwards the ref and native attributes to the visible input, and appearance to the root', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(
      <NumberField
        ref={ref}
        label="Entry"
        id="entry"
        data-owner="page"
        className="owner"
        aria-label="Alternative"
        inputMode="numeric"
        enterKeyHint="done"
        defaultValue={12.5}
        locale="pl-PL"
      />,
    );
    expect(ref.current?.value).toBe('12,5');
    expect(ref.current?.id).toBe('entry');
    expect(ref.current?.getAttribute('aria-label')).toBe('Alternative');
    expect(ref.current?.inputMode).toBe('numeric');
    expect(screen.container.querySelector('.owner')?.getAttribute('data-owner')).toBe('page');
    expect(ref.current?.classList.contains('owner')).toBe(false);
  });

  it('renders without reading the browser language and hydrates before adopting it', async () => {
    const language = vi.spyOn(navigator, 'language', 'get');
    language.mockImplementation(() => {
      throw new Error('Browser language read during SSR');
    });
    let html: string;
    try {
      html = renderToString(<NumberField label="Entry" defaultValue={12.5} />);
    } finally {
      language.mockReturnValue('pl-PL');
    }
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    expect(container.querySelector('input')?.value).toBe('12.5');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <NumberField label="Entry" defaultValue={12.5} />, {
      onRecoverableError: recoverable,
    });
    try {
      await expect.poll(() => container.querySelector('input')?.value).toBe('12,5');
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      container.remove();
      errors.mockRestore();
      language.mockRestore();
    }
  });

  it('preserves a partial draft when a controlled parent echoes the empty parsed value', async () => {
    const changed = vi.fn();
    const ref = createRef<HTMLInputElement>();
    function Controlled() {
      const [value, setValue] = useState<number | null>(null);
      return (
        <NumberField
          ref={ref}
          label="Entry"
          locale="pl-PL"
          value={value}
          onValueChange={(next, details) => {
            setValue(next);
            changed(next, details);
          }}
        />
      );
    }
    await render(
      <StrictMode>
        <Controlled />
      </StrictMode>,
    );
    if (ref.current === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(ref.current).fill('12,');
    expect(ref.current.value).toBe('12,');
    expect(changed).toHaveBeenCalledOnce();
    expect(ref.current.validity.customError).toBe(true);
  });

  it('submits only the controlled value accepted by the parent', async () => {
    const changed = vi.fn();
    const screen = await render(
      <form>
        <NumberField label="Entry" name="entry" locale="pl-PL" value={1} onValueChange={changed} />
      </form>,
    );
    const input = screen.container.querySelector('input');
    const form = screen.container.querySelector('form');
    if (input === null || form === null) {
      throw new Error('Missing form');
    }
    await page.elementLocator(input).fill('2');
    expect(changed).toHaveBeenCalledOnce();
    expect(new FormData(form).get('entry')).toBe('1');
    expect(input.value).toBe('1');
  });

  it('clears proposed constraint errors when a controlled parent rejects the edit', async () => {
    const screen = await render(<NumberField label="Entry" value={1} max={2} />);
    const input = screen.container.querySelector('input');
    if (input === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(input).fill('3');
    expect(input.value).toBe('1');
    expect(input.validity.valid).toBe(true);
  });

  it('keeps the accepted value visible when a controlled parent rejects clearing', async () => {
    const screen = await render(<NumberField label="Entry" value={1} locale="pl-PL" />);
    const input = screen.container.querySelector('input');
    if (input === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(input).fill('');
    expect(input.value).toBe('1');
    expect(input.validity.valid).toBe(true);
  });

  it('replaces a draft on an external value change and associates both inputs with an external form', async () => {
    const props = { label: 'Entry', name: 'entry', locale: 'pl-PL', form: 'external-form' };
    const screen = await render(
      <>
        <form id="external-form" />
        <NumberField {...props} value={null} />
      </>,
    );
    const input = screen.container.querySelector('input');
    if (input === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(input).fill('-');
    await screen.rerender(
      <>
        <form id="external-form" />
        <NumberField {...props} value={23} />
      </>,
    );
    expect(input.value).toBe('23');
    const form = input.form;
    if (form === null) {
      throw new Error('Missing association');
    }
    expect([...new FormData(form)]).toEqual([['entry', '23']]);
  });

  it('synchronizes native restoration without an edit callback', async () => {
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    await render(<NumberField ref={ref} label="Entry" locale="pl-PL" onValueChange={changed} />);
    if (ref.current === null) {
      throw new Error('Missing input');
    }
    ref.current.value = '23';
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    await expect.poll(() => ref.current?.value).toBe('23');
    expect(changed).not.toHaveBeenCalled();
  });
});

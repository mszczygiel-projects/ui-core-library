import { createRef, StrictMode, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { DateField } from './DateField.tsx';

describe('DateField', () => {
  it('forwards the ref and native attributes to the visible input, and appearance to the root', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(
      <DateField
        ref={ref}
        label="Entry"
        id="entry"
        data-owner="page"
        className="owner"
        aria-label="Alternative"
        inputMode="numeric"
        enterKeyHint="done"
        defaultValue={'2026-12-31'}
        locale="pl-PL"
      />,
    );
    expect(ref.current?.value).toBe('31.12.2026');
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
      html = renderToString(<DateField label="Entry" defaultValue={'2026-12-31'} />);
    } finally {
      language.mockReturnValue('pl-PL');
    }
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    expect(container.querySelector('input')?.value).toBe('12/31/2026');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <DateField label="Entry" defaultValue={'2026-12-31'} />, {
      onRecoverableError: recoverable,
    });
    try {
      await expect.poll(() => container.querySelector('input')?.value).toBe('31.12.2026');
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
      const [value, setValue] = useState<string>('');
      return (
        <DateField
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
    await page.elementLocator(ref.current).fill('31.12.20');
    expect(ref.current.value).toBe('31.12.20');
    expect(changed).toHaveBeenCalledOnce();
    expect(ref.current.validity.customError).toBe(true);
  });

  it('submits only the controlled value accepted by the parent', async () => {
    const changed = vi.fn();
    const screen = await render(
      <form>
        <DateField
          label="Entry"
          name="entry"
          locale="pl-PL"
          value={'2026-01-01'}
          onValueChange={changed}
        />
      </form>,
    );
    const input = screen.container.querySelector('input');
    const form = screen.container.querySelector('form');
    if (input === null || form === null) {
      throw new Error('Missing form');
    }
    await page.elementLocator(input).fill('02.01.2026');
    expect(changed).toHaveBeenCalledOnce();
    expect(new FormData(form).get('entry')).toBe('2026-01-01');
    expect(input.value).toBe('01.01.2026');
  });

  it('keeps the accepted value visible when a controlled parent rejects clearing', async () => {
    const screen = await render(<DateField label="Entry" value={'2026-01-01'} locale="pl-PL" />);
    const input = screen.container.querySelector('input');
    if (input === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(input).fill('');
    expect(input.value).toBe('01.01.2026');
    expect(input.validity.valid).toBe(true);
  });

  it('replaces a draft on an external value change and associates both inputs with an external form', async () => {
    const props = { label: 'Entry', name: 'entry', locale: 'pl-PL', form: 'external-form' };
    const screen = await render(
      <>
        <form id="external-form" />
        <DateField {...props} value={''} />
      </>,
    );
    const input = screen.container.querySelector('input');
    if (input === null) {
      throw new Error('Missing input');
    }
    await page.elementLocator(input).fill('31.');
    await screen.rerender(
      <>
        <form id="external-form" />
        <DateField {...props} value={'2026-12-31'} />
      </>,
    );
    expect(input.value).toBe('31.12.2026');
    const form = input.form;
    if (form === null) {
      throw new Error('Missing association');
    }
    expect([...new FormData(form)]).toEqual([['entry', '2026-12-31']]);
  });

  it('synchronizes native restoration without an edit callback', async () => {
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    await render(<DateField ref={ref} label="Entry" locale="pl-PL" onValueChange={changed} />);
    if (ref.current === null) {
      throw new Error('Missing input');
    }
    ref.current.value = '31.12.2026';
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    await expect.poll(() => ref.current?.value).toBe('31.12.2026');
    expect(changed).not.toHaveBeenCalled();
  });
});

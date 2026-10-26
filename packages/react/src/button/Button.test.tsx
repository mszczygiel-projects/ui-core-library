import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Button } from './Button.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => {
      resolve();
    }),
  );
}

describe('Button', () => {
  it('passes its ref and native attributes to the native button', async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <Button
        ref={ref}
        id="save"
        className="spaced"
        style={{ margin: 0 }}
        data-owner="page"
        aria-label="Save draft"
        form="editor"
        formAction="/draft"
        formNoValidate
      >
        Save
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.id).toBe('save');
    expect(ref.current?.classList.contains('spaced')).toBe(true);
    expect(ref.current?.dataset['owner']).toBe('page');
    expect(ref.current?.getAttribute('aria-label')).toBe('Save draft');
    expect(ref.current?.getAttribute('form')).toBe('editor');
    expect(ref.current?.getAttribute('formaction')).toBe('/draft');
    expect(ref.current?.formNoValidate).toBe(true);
  });

  it('gives its button to a callback ref and takes it back on unmount', async () => {
    const ref = vi.fn();
    const screen = await render(<Button ref={ref}>Save</Button>);
    expect(ref).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenLastCalledWith(screen.container.querySelector('button'));
    await screen.unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it('writes no name or value it was not given, and no icon box for a node that renders nothing', async () => {
    const screen = await render(
      <Button leadingIcon={false} trailingIcon="">
        Save
      </Button>,
    );
    const button = screen.container.querySelector('button');
    expect(button?.hasAttribute('name')).toBe(false);
    expect(button?.hasAttribute('value')).toBe(false);
    expect(button?.querySelector('.ui-button__leading-icon')).toBeNull();
    expect(button?.querySelector('.ui-button__trailing-icon')).toBeNull();
  });

  it('keeps the native submitter and a native description while loading', async () => {
    const submitted = vi.fn();
    const screen = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted(event.nativeEvent.submitter);
        }}
      >
        <Button type="submit" name="action" value="save">
          Save
        </Button>
      </form>,
    );
    await screen.getByRole('button').click();
    expect(submitted).toHaveBeenCalledWith(screen.container.querySelector('button'));
    await screen.rerender(
      <Button loading aria-describedby="instructions">
        Save
      </Button>,
    );
    const ids = screen.container
      .querySelector('button')
      ?.getAttribute('aria-describedby')
      ?.split(' ');
    expect(ids?.[0]).toBe('instructions');
    expect(screen.container.querySelector('span[hidden]')?.id).toBe(ids?.[1]);
  });

  it('renders loading on a server and hydrates without losing its description', async () => {
    const view = (
      <Button loading loadingLabel="Saving draft" size="large">
        Save
      </Button>
    );
    const markup = renderToString(view);
    expect(markup).toContain('aria-busy="true"');
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    const description = container.querySelector('button')?.getAttribute('aria-describedby');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError: recoverable });
    try {
      await nextFrame();
      await nextFrame();
      expect(container.querySelector('button')?.getAttribute('aria-describedby')).toBe(description);
      expect(container.querySelector('span[hidden]')?.textContent).toBe('Saving draft');
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      container.remove();
      errors.mockRestore();
    }
  });
});

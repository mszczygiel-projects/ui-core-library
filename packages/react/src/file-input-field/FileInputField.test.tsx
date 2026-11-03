import { type ChangeEvent, createRef, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { FileInputField } from './FileInputField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

function file(name: string, type = 'text/plain'): File {
  return new File(['content'], name, { type, lastModified: 1 });
}

const notes = file('notes.txt');
const photo = file('photo.png', 'image/png');

function drop(zone: Element, files: readonly File[]): void {
  const dataTransfer = new DataTransfer();
  for (const item of files) {
    dataTransfer.items.add(item);
  }
  for (const type of ['dragenter', 'dragover', 'drop']) {
    zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
  }
}

describe('FileInputField', () => {
  it('passes its ref to its native file input, and its attributes to the input or the root', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(
      <FileInputField
        ref={ref}
        label="Attachment"
        id="upload"
        className="custom"
        data-testid="root"
        aria-describedby="extra"
        hint="Help"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('file');
    expect(ref.current?.id).toBe('upload');
    expect(ref.current?.getAttribute('aria-describedby')).toMatch(/^extra /);
    const root = screen.container.querySelector('[data-testid="root"]');
    expect(root?.classList.contains('custom')).toBe(true);
    expect(root?.classList.contains('ui-file-input-field')).toBe(true);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const element = <FileInputField label="Attachment" hint="Help" defaultValue={[photo]} />;
    const html = renderToString(element);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, element, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^blob:/);
    expect(container.querySelector('input')?.files?.[0]?.name).toBe('photo.png');
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('keeps the input files of a controlled field in step with its value', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const changed = vi.fn();
    const screen = await render(
      <FileInputField
        label="Files"
        name="files"
        multiple
        value={[notes]}
        onValueChange={changed}
      />,
      { container: form },
    );
    const input = form.querySelector('input');
    expect(input?.files?.[0]).toBe(notes);
    const zone = form.querySelector('.ui-file-input-field__dropzone');
    if (zone !== null) {
      drop(zone, [photo]);
    }
    expect(changed).toHaveBeenCalledTimes(1);
    await nextFrame();
    // The parent kept its value, so the field and the form still hold only the first file.
    expect(new FormData(form).getAll('files')).toEqual([notes]);
    await screen.rerender(
      <FileInputField label="Files" name="files" multiple value={[notes, photo]} />,
    );
    expect(new FormData(form).getAll('files')).toEqual([notes, photo]);
    form.remove();
  });

  it('replaces a file in its input when only the bytes differ', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const before = new File(['old'], 'a.txt', { lastModified: 1 });
    const after = new File(['new'], 'a.txt', { lastModified: 1 });
    const screen = await render(<FileInputField label="File" name="file" value={[before]} />, {
      container: form,
    });
    expect(new FormData(form).get('file')).toBe(before);
    await screen.rerender(<FileInputField label="File" name="file" value={[after]} />);
    expect(new FormData(form).get('file')).toBe(after);
    form.remove();
  });

  it('calls a native onChange of the input along with onValueChange', async () => {
    const targets: EventTarget[] = [];
    // React clears currentTarget after the handler, so the handler keeps it.
    const changed = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      targets.push(event.currentTarget);
    });
    const valueChanged = vi.fn();
    const screen = await render(
      <FileInputField label="File" onChange={changed} onValueChange={valueChanged} />,
    );
    const input = screen.container.querySelector('input');
    if (input !== null) {
      const transfer = new DataTransfer();
      transfer.items.add(notes);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(changed).toHaveBeenCalledTimes(1);
    expect(targets).toEqual([input]);
    expect(valueChanged).toHaveBeenCalledWith([notes], expect.objectContaining({ reason: 'add' }));
  });

  it('revokes the object URL of a preview when it unmounts, also in strict mode', async () => {
    const revoked = vi.spyOn(URL, 'revokeObjectURL');
    const screen = await render(
      <StrictMode>
        <FileInputField label="Photo" defaultValue={[photo]} />
      </StrictMode>,
    );
    const image = screen.container.querySelector('img');
    await expect.poll(() => image?.getAttribute('src')).toMatch(/^blob:/);
    const source = image?.getAttribute('src');
    await screen.unmount();
    expect(revoked).toHaveBeenCalledWith(source);
    revoked.mockRestore();
  });
});

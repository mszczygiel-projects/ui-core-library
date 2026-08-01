import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { FileInputField } from './FileInputField.js';

afterEach(cleanup);

beforeAll(() => {
  // jsdom ships no object-URL implementation; the component creates one per
  // image so the preview and the list thumbnails have a src.
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:stub');
    URL.revokeObjectURL = vi.fn();
  }
});

const png = (name = 'photo.png') => new File([new Uint8Array(64)], name, { type: 'image/png' });
const pdf = (name = 'contract.pdf') =>
  new File([new Uint8Array(64)], name, { type: 'application/pdf' });

const dropOn = (element: Element, files: File[]) =>
  fireEvent.drop(element, { dataTransfer: { files } });

const dropzone = (container: HTMLElement) =>
  container.querySelector('.ui-file-input-field__dropzone')!;

describe('FileInputField', () => {
  it('renders without error', () => {
    render(<FileInputField label="Photo" />);
    expect(screen.getByLabelText('Photo')).toBeDefined();
  });

  it('applies outline variant and default size classes by default', () => {
    const { container } = render(<FileInputField />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-file-input-field--outline')).toBe(true);
    expect(root.classList.contains('ui-file-input-field--default')).toBe(false);
  });

  it('maps variant, size and state props to class names', () => {
    const { container } = render(<FileInputField variant="filled" size="large" state="error" />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-file-input-field--filled')).toBe(true);
    expect(root.classList.contains('ui-file-input-field--large')).toBe(true);
    expect(root.classList.contains('ui-file-input-field--state-error')).toBe(true);
  });

  it('opts into the shared control-field aliases', () => {
    const { container } = render(<FileInputField variant="filled" size="small" />);
    const root = container.firstElementChild!;
    expect(root.classList.contains('ui-control-field')).toBe(true);
    expect(root.classList.contains('ui-control-field--filled')).toBe(true);
    expect(root.classList.contains('ui-control-field--small')).toBe(true);
  });

  it('forwards className and style to the root', () => {
    const { container } = render(<FileInputField className="custom" style={{ marginTop: 8 }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.style.marginTop).toBe('8px');
  });

  it('falls back to the configured browse label and lets prompt override it', () => {
    const { container, unmount } = render(<FileInputField />);
    expect(container.querySelector('.ui-file-input-field__prompt')!.textContent).toBe(
      'Drag & drop or browse',
    );
    unmount();

    const overridden = render(<FileInputField prompt="Upload your logo" />);
    expect(overridden.container.querySelector('.ui-file-input-field__prompt')!.textContent).toBe(
      'Upload your logo',
    );
  });

  it('links description and hint through aria-describedby', () => {
    render(<FileInputField label="Photo" description="PNG only" hint="Max 2 MB" />);
    const input = screen.getByLabelText('Photo');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(document.getElementById(id)).not.toBeNull();
  });

  it('marks the input invalid in the error state', () => {
    render(<FileInputField label="Photo" state="error" />);
    expect(screen.getByLabelText('Photo').getAttribute('aria-invalid')).toBe('true');
  });

  it('renders the preview for a single image and reports the mode', () => {
    const { container } = render(<FileInputField defaultFiles={[png()]} />);
    expect(container.firstElementChild!.getAttribute('data-value')).toBe('filled');
    expect(container.querySelector('.ui-file-input-field__preview')).not.toBeNull();
  });

  it('renders a list for a non-image file', () => {
    const { container } = render(<FileInputField defaultFiles={[pdf()]} />);
    expect(container.firstElementChild!.getAttribute('data-value')).toBe('list');
    expect(container.querySelectorAll('.ui-file-input-field__item')).toHaveLength(1);
  });

  it('renders a list for several files in multiple mode', () => {
    const { container } = render(
      <FileInputField multiple defaultFiles={[png('a.png'), png('b.png')]} />,
    );
    expect(container.querySelectorAll('.ui-file-input-field__item')).toHaveLength(2);
  });

  it('reports dropped files through onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<FileInputField onChange={onChange} />);
    dropOn(dropzone(container), [png('logo.png')]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['logo.png']);
  });

  it('appends in multiple mode and replaces in single-file mode', () => {
    const onChange = vi.fn();
    const multi = render(
      <FileInputField multiple defaultFiles={[png('a.png')]} onChange={onChange} />,
    );
    dropOn(dropzone(multi.container), [png('b.png')]);
    expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png', 'b.png']);
    multi.unmount();

    const single = render(<FileInputField defaultFiles={[png('a.png')]} onChange={onChange} />);
    dropOn(dropzone(single.container), [png('b.png')]);
    expect(onChange.mock.calls[1][0].map((f: File) => f.name)).toEqual(['b.png']);
  });

  it('rejects a file outside accept', () => {
    const onReject = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <FileInputField accept="image/*" onReject={onReject} onChange={onChange} />,
    );
    dropOn(dropzone(container), [pdf()]);
    expect(onReject.mock.calls[0][0][0].reason).toBe('type');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects a file larger than maxSize', () => {
    const onReject = vi.fn();
    const { container } = render(<FileInputField maxSize={10} onReject={onReject} />);
    dropOn(dropzone(container), [png()]);
    expect(onReject.mock.calls[0][0][0].reason).toBe('size');
  });

  it('rejects files beyond maxFiles', () => {
    const onReject = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <FileInputField multiple maxFiles={1} onReject={onReject} onChange={onChange} />,
    );
    dropOn(dropzone(container), [png('a.png'), png('b.png')]);
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
    expect(onReject.mock.calls[0][0][0].reason).toBe('count');
  });

  it('removes a file and reports which one left', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onChange = vi.fn();
    render(
      <FileInputField
        multiple
        defaultFiles={[png('a.png'), png('b.png')]}
        onRemove={onRemove}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.png' }), 0);
    expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['b.png']);
  });

  it('names the remove button after the file it removes', () => {
    render(<FileInputField defaultFiles={[png('team-photo.png')]} />);
    expect(screen.getByRole('button', { name: 'Remove team-photo.png' })).toBeDefined();
  });

  it('leaves the selection to the caller when controlled', () => {
    const onChange = vi.fn();
    const { container } = render(<FileInputField files={[]} onChange={onChange} />);
    dropOn(dropzone(container), [png()]);
    expect(onChange).toHaveBeenCalledTimes(1);
    // The prop still says "no files", so the presentation must not move on.
    expect(container.firstElementChild!.getAttribute('data-value')).toBe('empty');
  });

  it('ignores drops while disabled', () => {
    const onChange = vi.fn();
    const { container } = render(<FileInputField state="disabled" onChange={onChange} />);
    dropOn(dropzone(container), [png()]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('flags drag-over only while a drag is in progress', () => {
    const { container } = render(<FileInputField />);
    const root = container.firstElementChild!;
    fireEvent.dragEnter(dropzone(container));
    expect(root.classList.contains('ui-file-input-field--dragover')).toBe(true);
    fireEvent.dragLeave(dropzone(container));
    expect(root.classList.contains('ui-file-input-field--dragover')).toBe(false);
  });

  it('renders extra controls passed through actions', () => {
    render(<FileInputField defaultFiles={[png()]} actions={<button type="button">Crop</button>} />);
    expect(screen.getByRole('button', { name: 'Crop' })).toBeDefined();
  });

  it('uses a custom formatSize for the file meta line', () => {
    const { container } = render(
      <FileInputField defaultFiles={[pdf('contract.pdf')]} formatSize={() => '64 bajty'} />,
    );
    expect(container.querySelector('.ui-file-input-field__meta')!.textContent).toBe(
      'PDF · 64 bajty',
    );
  });
});

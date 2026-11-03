import '../../dist/components/ui-file-input-field.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiFileInputFieldElement & {
  formStateRestoreCallback(state: FormData | string | null): void;
};

function file(name: string, type = 'text/plain', size = 10): File {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

async function mount(
  properties: Partial<HTMLUiFileInputFieldElement> = {},
  attributes: Record<string, string> = {},
  parent: HTMLElement = document.body,
) {
  const field = document.createElement('ui-file-input-field') as Field;
  for (const [name, value] of Object.entries(attributes)) {
    field.setAttribute(name, value);
  }
  Object.assign(field, { label: 'Attachment' }, properties);
  parent.append(field);
  await nextRender();
  return field;
}

function drop(field: HTMLElement, files: readonly File[]): void {
  const zone = field.shadowRoot?.querySelector('.dropzone');
  const dataTransfer = new DataTransfer();
  for (const item of files) {
    dataTransfer.items.add(item);
  }
  for (const type of ['dragenter', 'dragover', 'drop']) {
    zone?.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll('ui-file-input-field, form').forEach((node) => {
    node.remove();
  });
});

describe('ui-file-input-field', () => {
  it('writes no attribute on its host: the host belongs to the page', async () => {
    const field = await mount();
    expect(field.getAttributeNames()).toEqual([]);
  });

  it('reflects only its name and disabled state', async () => {
    const field = await mount({ name: 'files', disabled: true, multiple: true, required: true });
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('reads its limits from the max-size and max-files attributes', async () => {
    const field = await mount({ multiple: true }, { 'max-size': '100', 'max-files': '1' });
    const rejected = vi.fn();
    field.addEventListener('ui-reject', (event) => {
      rejected(
        (event as CustomEvent<{ rejections: readonly { reason: string }[] }>).detail.rejections,
      );
    });
    drop(field, [file('large.txt', 'text/plain', 200), file('a.txt'), file('b.txt')]);
    expect(field.value.map(({ name }) => name)).toEqual(['a.txt']);
    expect(rejected).toHaveBeenCalledWith([
      expect.objectContaining({ reason: 'size' }),
      expect.objectContaining({ reason: 'count' }),
    ]);
  });

  it('restores the files the browser saved, without an event', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const field = await mount({ name: 'files', multiple: true }, {}, form);
    const changed = vi.fn();
    field.addEventListener('ui-value-change', changed);
    const state = new FormData();
    state.append('file', file('a.txt'));
    state.append('file', file('b.txt'));
    field.formStateRestoreCallback(state);
    expect(field.value.map(({ name }) => name)).toEqual(['a.txt', 'b.txt']);
    expect(new FormData(form).getAll('files')).toHaveLength(2);
    field.formStateRestoreCallback('not files');
    expect(field.value).toHaveLength(2);
    expect(changed).not.toHaveBeenCalled();
  });

  it('restores its default files synchronously on a form reset', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const initial = file('initial.txt');
    const field = await mount({ name: 'files', required: true }, {}, form);
    field.defaultValue = [initial];
    field.value = [];
    expect(form.checkValidity()).toBe(false);
    form.reset();
    expect(field.value).toEqual([initial]);
    expect(new FormData(form).getAll('files')).toEqual([initial]);
    expect(form.checkValidity()).toBe(true);
    // Like a native input, a field the reset left untouched follows a new default.
    field.defaultValue = [];
    expect(field.value).toEqual([]);
    field.value = [initial];
    field.defaultValue = [file('other.txt')];
    expect(field.value).toEqual([initial]);
  });

  it('takes only files from a script', async () => {
    const field = await mount();
    field.value = [file('a.txt'), 'b.txt'] as unknown as File[];
    expect(field.value.map(({ name }) => name)).toEqual(['a.txt']);
    field.value = 'c.txt' as unknown as File[];
    expect(field.value).toEqual([]);
  });

  it('revokes the object URL of a preview when its image leaves and on removal', async () => {
    const created = vi.spyOn(URL, 'createObjectURL');
    const revoked = vi.spyOn(URL, 'revokeObjectURL');
    const field = await mount({ value: [file('a.png', 'image/png')] });
    expect(created).toHaveBeenCalledTimes(1);
    const url = created.mock.results[0]?.value as string;
    expect(field.shadowRoot?.querySelector('img')?.getAttribute('src')).toBe(url);
    field.value = [file('b.png', 'image/png')];
    expect(revoked).toHaveBeenCalledWith(url);
    expect(created).toHaveBeenCalledTimes(2);
    const second = created.mock.results[1]?.value as string;
    field.remove();
    expect(revoked).toHaveBeenCalledWith(second);
  });

  it('exposes its disabled, dragover and invalid states to styles', async () => {
    const field = await mount({ state: 'error' });
    expect(field.matches(':state(invalid)')).toBe(true);
    expect(field.matches(':state(disabled)')).toBe(false);
    const zone = field.shadowRoot?.querySelector('.dropzone');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file('a.txt'));
    zone?.dispatchEvent(
      new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }),
    );
    await nextRender();
    expect(field.matches(':state(dragover)')).toBe(true);
    field.disabled = true;
    await nextRender();
    expect(field.matches(':state(disabled)')).toBe(true);
    expect(field.matches(':state(dragover)')).toBe(false);
  });
});

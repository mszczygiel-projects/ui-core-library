import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  FileInputFieldProps,
  FileInputFieldRejectDetails,
  FileInputFieldRejection,
  FileInputFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudo, pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';
import { resolvedColor } from './action.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface FileInputFieldContractProps extends FileInputFieldProps<File> {
  /** The initial files: the defaultValue property of the web component, defaultValue in React. */
  readonly defaultValue?: readonly File[];
  readonly onValueChange?: (
    value: readonly File[],
    details: FileInputFieldValueChangeDetails<Event, File>,
  ) => void;
  readonly onReject?: (
    rejections: readonly FileInputFieldRejection<File>[],
    details: FileInputFieldRejectDetails<Event>,
  ) => void;
}

type Field = Mounted<FileInputFieldContractProps>;

function file(name: string, type = 'text/plain', size = 10, lastModified = 1): File {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}

const notes = file('notes.txt');
const report = file('report.pdf', 'application/pdf', 2000);
const photo = file('photo.png', 'image/png', 1200);
const sketch = file('sketch.png', 'image/png', 900);

/** The native file input, inside the shadow root of the web component or the root in React. */
function inputOf(field: Field): HTMLInputElement {
  const input = (field.element.shadowRoot ?? field.element).querySelector<HTMLInputElement>(
    'input[type="file"]',
  );
  if (input === null) {
    throw new Error('Missing the file input');
  }
  return input;
}

function removeButtons(field: Field): HTMLElement[] {
  const root = field.element.shadowRoot ?? field.element;
  return [...root.querySelectorAll<HTMLElement>('[part~="remove"], .ui-file-input-field__remove')];
}

/** The element that has the focus, through the shadow roots. */
function focused(): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

function names(field: Field): string[] {
  const root = field.element.shadowRoot ?? field.element;
  return [...root.querySelectorAll('[part~="name"], .ui-file-input-field__name')].map(
    (node) => node.textContent,
  );
}

/** Drops files on an element, as a drag from the system does. */
function dragFiles(target: Element, type: string, files: readonly File[]): DragEvent {
  const dataTransfer = new DataTransfer();
  for (const item of files) {
    dataTransfer.items.add(item);
  }
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    dataTransfer,
  });
  target.dispatchEvent(event);
  return event;
}

function drop(field: Field, files: readonly File[]): void {
  const zone = field.part('dropzone');
  dragFiles(zone, 'dragenter', files);
  dragFiles(zone, 'dragover', files);
  dragFiles(zone, 'drop', files);
}

async function upload(field: Field, files: File | readonly File[]): Promise<void> {
  await userEvent.upload(page.elementLocator(inputOf(field)), [files].flat());
}

function borderColor(field: Field): string {
  return getComputedStyle(field.part('dropzone')).borderTopColor;
}

function label(text: string): string {
  return tokenValue('--control-label-text-uppercase') === 'uppercase' ? text.toUpperCase() : text;
}

/** The behaviour of FileInputField, applied unchanged to the web component and the React component. */
export function fileInputFieldContract(adapter: Mount<FileInputFieldContractProps>): void {
  const mounted: Field[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: FileInputFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Attachment', ...props }, options);
    mounted.push(field);
    return field;
  }
  /** Moves the pointer off every field, so that none shows its hover state. */
  async function parkPointer() {
    const corner = document.createElement('div');
    corner.style.cssText =
      'position:fixed;inset-block-end:0;inset-inline-end:0;inline-size:4px;block-size:4px';
    document.body.append(corner);
    fixtures.push(corner);
    await userEvent.hover(corner);
  }
  afterEach(async () => {
    resetUiCoreConfig();
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('is a file input named by its label and described by its hint, alone in the tab order', async () => {
    const field = await mount({ hint: 'Up to 2 MB' });
    const tree = await field.accessibleTree();
    const node = tree.find((item) => item.description === 'Up to 2 MB');
    expect(node?.name).toBe(label('Attachment'));
    expect(node?.role).toBe('button');
    expect(node?.description).toBe('Up to 2 MB');
    await userEvent.tab();
    expect(focused()).toBe(inputOf(field));
    await userEvent.tab();
    expect(focused()).not.toBe(inputOf(field));
  });

  it('lets an author name a field without a visible label', async () => {
    const field = await mount({ label: '' }, { attributes: { 'aria-label': 'Avatar' } });
    const tree = await field.accessibleTree();
    expect(tree.find(({ role }) => role === 'button')?.name).toBe('Avatar');
  });

  it('blocks a submission until a required field has a file', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'files', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    await upload(field, notes);
    await expect.poll(() => form.checkValidity()).toBe(true);
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it('submits every file under its name in order, and a removed file leaves', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'files', multiple: true }, { parent: fieldset });
    await upload(field, [notes, report]);
    await expect
      .poll(() => new FormData(form).getAll('files').map((entry) => (entry as File).name))
      .toEqual(['notes.txt', 'report.pdf']);
    await expect.poll(() => removeButtons(field).length).toBe(2);
    await userEvent.click(removeButtons(field)[0] ?? field.element);
    await expect
      .poll(() => new FormData(form).getAll('files').map((entry) => (entry as File).name))
      .toEqual(['report.pdf']);
    // The last file leaves no empty entry behind, as a native empty file input would.
    await userEvent.click(removeButtons(field)[0] ?? field.element);
    await expect.poll(() => names(field)).toEqual([]);
    expect(new FormData(form).getAll('files')).toEqual([]);
  });

  it('submits under a name given after the files', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'first' }, { parent: fieldset });
    await upload(field, notes);
    await expect.poll(() => new FormData(form).getAll('first').length).toBe(1);
    await field.update({ name: 'second' });
    expect(new FormData(form).getAll('first')).toEqual([]);
    expect(new FormData(form).getAll('second').map((entry) => (entry as File).name)).toEqual([
      'notes.txt',
    ]);
  });

  it('submits nothing without a name or while disabled', async () => {
    const { form, fieldset } = formFixture(fixtures);
    await mount({ defaultValue: [notes] }, { parent: fieldset });
    await mount({ name: 'off', disabled: true, defaultValue: [notes] }, { parent: fieldset });
    await mount({ name: 'empty', required: true }, { parent: fieldset });
    expect([...new FormData(form)].filter(([, entry]) => entry instanceof File)).toEqual([]);
    expect(form.checkValidity()).toBe(false);
  });

  it('resets to its initial files without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const field = await mount(
      { name: 'files', required: true, defaultValue: [notes], onValueChange: changed },
      { parent: fieldset },
    );
    expect(new FormData(form).getAll('files').map((entry) => (entry as File).name)).toEqual([
      'notes.txt',
    ]);
    await upload(field, report);
    await expect.poll(() => names(field)).toEqual(['report.pdf']);
    changed.mockClear();
    form.reset();
    await expect
      .poll(() => new FormData(form).getAll('files').map((entry) => (entry as File).name))
      .toEqual(['notes.txt']);
    expect(form.checkValidity()).toBe(true);
    await expect.poll(() => names(field)).toEqual(['notes.txt']);
    // A second reset changes no value, so no render puts the files back for it.
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(new FormData(form).getAll('files').map((entry) => (entry as File).name)).toEqual([
      'notes.txt',
    ]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps its files when the page cancels a reset from a reset button', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'files', defaultValue: [notes] }, { parent: fieldset });
    await upload(field, report);
    await expect.poll(() => names(field)).toEqual(['report.pdf']);
    const button = document.createElement('button');
    button.type = 'reset';
    button.textContent = 'Reset';
    form.append(button);
    const cancel = (event: Event) => {
      event.preventDefault();
    };
    form.addEventListener('reset', cancel);
    await userEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(names(field)).toEqual(['report.pdf']);
    expect(new FormData(form).getAll('files').map((entry) => (entry as File).name)).toEqual([
      'report.pdf',
    ]);
    form.removeEventListener('reset', cancel);
    await userEvent.click(button);
    await expect.poll(() => names(field)).toEqual(['notes.txt']);
    await expect
      .poll(() => new FormData(form).getAll('files').map((entry) => (entry as File).name))
      .toEqual(['notes.txt']);
  });

  it('follows a disabled fieldset, and comes back after its own disabled prop is removed', async () => {
    const { fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'files', disabled: true }, { parent: fieldset });
    expect(inputOf(field).matches(':disabled')).toBe(true);
    await field.update({ disabled: false });
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(false);
    fieldset.disabled = true;
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(true);
    fieldset.disabled = false;
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(false);
  });

  it('adds files from the dialog and from a drop, with the reason add', async () => {
    const changed = vi.fn<NonNullable<FileInputFieldContractProps['onValueChange']>>();
    const field = await mount({ multiple: true, onValueChange: changed });
    await upload(field, notes);
    await expect.poll(() => changed.mock.calls.length).toBe(1);
    drop(field, [report]);
    await expect.poll(() => changed.mock.calls.length).toBe(2);
    const [[firstValue, firstDetails], [secondValue, secondDetails]] = changed.mock.calls as [
      Parameters<typeof changed>,
      Parameters<typeof changed>,
    ];
    expect(firstValue.map(({ name }) => name)).toEqual(['notes.txt']);
    expect(firstDetails.reason).toBe('add');
    expect(firstDetails.files.map(({ name }) => name)).toEqual(['notes.txt']);
    expect(firstDetails.originalEvent.type).toBe('change');
    expect(secondValue.map(({ name }) => name)).toEqual(['notes.txt', 'report.pdf']);
    expect(secondDetails.reason).toBe('add');
    expect(secondDetails.originalEvent.type).toBe('drop');
    await expect.poll(() => names(field)).toEqual(['notes.txt', 'report.pdf']);
  });

  it('replaces its file without multiple, and appends without duplicates with it', async () => {
    const changed = vi.fn<NonNullable<FileInputFieldContractProps['onValueChange']>>();
    const single = await mount({ onValueChange: changed });
    await upload(single, notes);
    await expect.poll(() => names(single)).toEqual(['notes.txt']);
    await upload(single, report);
    await expect.poll(() => names(single)).toEqual(['report.pdf']);
    expect(changed.mock.calls.map(([, details]) => details.reason)).toEqual(['add', 'replace']);
    changed.mockClear();
    const multiple = await mount({ multiple: true, onValueChange: changed });
    drop(multiple, [notes]);
    await expect.poll(() => names(multiple)).toEqual(['notes.txt']);
    drop(multiple, [file('notes.txt'), report]);
    await expect.poll(() => names(multiple)).toEqual(['notes.txt', 'report.pdf']);
    expect(changed.mock.calls[1]?.[1].files.map(({ name }) => name)).toEqual(['report.pdf']);
  });

  it('rejects files of another type, too large or too many, from the dialog and a drop', async () => {
    const rejected = vi.fn<NonNullable<FileInputFieldContractProps['onReject']>>();
    const changed = vi.fn();
    const byExtension = await mount({ accept: '.png', onReject: rejected, onValueChange: changed });
    await upload(byExtension, report);
    await expect.poll(() => rejected.mock.calls.length).toBe(1);
    expect(rejected.mock.calls[0]?.[0]).toEqual([{ file: report, reason: 'type' }]);
    expect(changed).not.toHaveBeenCalled();
    expect(names(byExtension)).toEqual([]);
    expect(inputOf(byExtension).files?.length).toBe(0);
    rejected.mockClear();
    const byWildcard = await mount({ accept: 'image/*', multiple: true, onReject: rejected });
    drop(byWildcard, [photo, report]);
    await expect.poll(() => names(byWildcard)).toEqual(['photo.png']);
    expect(rejected.mock.calls[0]?.[0].map(({ reason }) => reason)).toEqual(['type']);
    rejected.mockClear();
    const byType = await mount({ accept: 'image/png', onReject: rejected });
    drop(byType, [file('photo.jpg', 'image/jpeg')]);
    expect(rejected.mock.calls[0]?.[0].map(({ reason }) => reason)).toEqual(['type']);
    rejected.mockClear();
    const bySize = await mount({ maxSize: 1000, multiple: true, maxFiles: 1, onReject: rejected });
    drop(bySize, [report, notes, sketch]);
    await expect.poll(() => names(bySize)).toEqual(['notes.txt']);
    expect(rejected.mock.calls[0]?.[0].map(({ file: { name }, reason }) => [name, reason])).toEqual(
      [
        ['report.pdf', 'size'],
        ['sketch.png', 'count'],
      ],
    );
    expect(rejected.mock.calls[0]?.[1].originalEvent.type).toBe('drop');
  });

  it('removes a file with its named button and moves the focus to the next one', async () => {
    const changed = vi.fn<NonNullable<FileInputFieldContractProps['onValueChange']>>();
    const field = await mount({
      multiple: true,
      defaultValue: [notes, report, file('summary.txt')],
      onValueChange: changed,
    });
    const buttons = removeButtons(field);
    const accessible = await field.accessibleTree();
    expect(accessible.filter((node) => node.role === 'button').map(({ name }) => name)).toEqual(
      expect.arrayContaining(['Remove notes.txt', 'Remove report.pdf', 'Remove summary.txt']),
    );
    await userEvent.click(buttons[1] ?? field.element);
    await expect.poll(() => names(field)).toEqual(['notes.txt', 'summary.txt']);
    expect(changed.mock.calls[0]?.[1].reason).toBe('remove');
    expect(changed.mock.calls[0]?.[1].files.map(({ name }) => name)).toEqual(['report.pdf']);
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('Remove summary.txt');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => names(field)).toEqual(['notes.txt']);
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('Remove notes.txt');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => names(field)).toEqual([]);
    await expect.poll(() => focused()).toBe(inputOf(field));
  });

  it('counts the drag across the children of the zone, and a disabled field ignores a drop', async () => {
    const changed = vi.fn();
    const field = await mount({ onValueChange: changed });
    const rest = borderColor(field);
    const zone = field.part('dropzone');
    const prompt = field.part('prompt');
    dragFiles(zone, 'dragenter', [notes]);
    dragFiles(prompt, 'dragenter', [notes]);
    dragFiles(zone, 'dragleave', [notes]);
    const dragover = resolvedColor(tokenValue('--color-file-input-dropzone-border-dragover'));
    await expect.poll(() => borderColor(field)).toBe(dragover);
    dragFiles(prompt, 'dragleave', [notes]);
    await expect.poll(() => borderColor(field)).toBe(rest);
    await field.update({ disabled: true });
    const over = dragFiles(zone, 'dragover', [notes]);
    expect(over.defaultPrevented).toBe(true);
    dragFiles(zone, 'drop', [notes]);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(changed).not.toHaveBeenCalled();
    expect(names(field)).toEqual([]);
  });

  it('previews one image with Replace and Remove, whose presses never reach the zone', async () => {
    const field = await mount({ defaultValue: [photo] });
    const image = field.part('preview-image');
    expect(image.getAttribute('alt')).toBe('photo.png');
    await expect.poll(() => image.getAttribute('src')).toMatch(/^blob:/);
    expect(names(field)).toEqual([]);
    const opened = vi.spyOn(inputOf(field), 'click').mockImplementation(() => undefined);
    await userEvent.click(field.part('replace'));
    expect(opened).toHaveBeenCalledTimes(1);
    await userEvent.click(image);
    expect(opened).toHaveBeenCalledTimes(2);
    await userEvent.click(removeButtons(field)[0] ?? field.element);
    expect(opened).toHaveBeenCalledTimes(2);
    await expect.poll(() => focused()).toBe(inputOf(field));
    expect(field.text()).toContain('Drag files here or browse');
    await field.update({ multiple: true, value: [sketch] });
    await expect.poll(() => names(field)).toEqual(['sketch.png']);
  });

  it('takes the texts it renders from the configuration, or from its props', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ defaultValue: [photo] });
    expect(field.text()).toContain(pseudo('Replace'));
    await expect
      .poll(async () => (await field.accessibleTree()).map(({ name }) => name))
      .toContain(pseudo('Remove photo.png'));
    const empty = await mount();
    expect(empty.text()).toContain(pseudo('Drag files here or browse'));
    const own = await mount({
      defaultValue: [photo],
      promptLabel: 'Drop a photo',
      replaceLabel: 'Change',
      getRemoveLabel: (name) => `Delete ${name}`,
    });
    expect(own.text()).toContain('Change');
    expect((await own.accessibleTree()).map(({ name }) => name)).toContain('Delete photo.png');
    await own.update({ value: [] });
    await expect.poll(() => own.text()).toContain('Drop a photo');
  });

  it('formats the size of a file in its locale', async () => {
    const big = file('archive.zip', 'application/zip', 1_234_567);
    const field = await mount({ defaultValue: [big] });
    expect(field.part('meta').textContent).toBe('ZIP · 1.2 MB');
    await field.update({ locale: 'pl-PL' });
    await expect.poll(() => field.part('meta').textContent).toBe('ZIP · 1,2 MB');
  });

  it('sets aria-invalid for the error state without a constraint failure', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'files', state: 'error' }, { parent: fieldset });
    expect(inputOf(field).getAttribute('aria-invalid')).toBe('true');
    expect(form.checkValidity()).toBe(true);
    await field.update({ state: 'default' });
    await expect.poll(() => inputOf(field).hasAttribute('aria-invalid')).toBe(false);
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const field = await mount();
    const explicit = await mount({ variant: 'outline', size: 'medium', state: 'default' });
    await parkPointer();
    const look = (target: Field) => {
      const style = getComputedStyle(target.part('dropzone'));
      return [style.borderTopStyle, style.borderTopColor, style.minHeight, style.paddingTop];
    };
    expect(look(field)).toEqual(look(explicit));
    await field.update({
      variant: 'unsupported',
      size: 'unsupported',
      state: 'unsupported',
    } as unknown as FileInputFieldContractProps);
    expect(look(field)).toEqual(look(explicit));
  });

  it('lays out its rows in right-to-left text', async () => {
    const field = await mount({ defaultValue: [notes, report], multiple: true }, { dir: 'rtl' });
    const [item] = [field.part('item')];
    const info = item.querySelector('[part~="info"], .ui-file-input-field__info');
    const button = removeButtons(field)[0];
    expect(info?.getBoundingClientRect().left).toBeGreaterThan(
      button?.getBoundingClientRect().right ?? Number.POSITIVE_INFINITY,
    );
    expect(field.part('thumb').getBoundingClientRect().right).toBeCloseTo(
      item.getBoundingClientRect().right -
        pixels(tokenValue('--file-input-item-padding-inline')) -
        pixels(tokenValue('--file-input-border-width')),
      0,
    );
  });

  it('draws its variants, sizes, states and the tints of a drag from the tokens', async () => {
    const color = (name: string) => resolvedColor(tokenValue(name));
    const outline = await mount();
    await parkPointer();
    const zone = getComputedStyle(outline.part('dropzone'));
    expect(zone.borderTopStyle).toBe('dashed');
    expect(zone.borderTopColor).toBe(color('--color-control-outline-border-default'));
    expect(zone.backgroundColor).toBe(color('--color-control-outline-background-default'));
    expect(zone.minHeight).toBe(`${String(pixels(tokenValue('--file-input-min-height')))}px`);
    const filled = await mount({ variant: 'filled', size: 'large' });
    const filledZone = getComputedStyle(filled.part('dropzone'));
    expect(filledZone.borderTopStyle).toBe('solid');
    expect(filledZone.backgroundColor).toBe(color('--color-control-filled-background-default'));
    expect(filledZone.minHeight).toBe(
      `${String(pixels(tokenValue('--file-input-large-min-height')))}px`,
    );
    const small = await mount({ size: 'small' });
    expect(getComputedStyle(small.part('prompt')).fontSize).toBe(
      `${String(pixels(tokenValue('--file-input-small-title-font-size')))}px`,
    );
    const error = await mount({ state: 'error', hint: 'Too large' });
    expect(borderColor(error)).toBe(color('--color-control-outline-border-error'));
    expect(getComputedStyle(error.part('hint')).color).toBe(
      color('--color-control-outline-hint-error'),
    );
    const disabled = await mount({ disabled: true, defaultValue: [notes] });
    expect(getComputedStyle(disabled.part('dropzone')).backgroundColor).toBe(
      color('--color-control-outline-background-disabled'),
    );
    expect(getComputedStyle(disabled.part('name')).color).toBe(
      color('--color-control-outline-text-disabled'),
    );
    // A translucent tint lies over the background as an image, never in place of it.
    dragFiles(outline.part('dropzone'), 'dragenter', [notes]);
    await expect
      .poll(() => getComputedStyle(outline.part('dropzone')).backgroundImage)
      .toContain(color('--color-file-input-dropzone-background-dragover'));
    expect(getComputedStyle(outline.part('dropzone')).backgroundColor).toBe(
      color('--color-control-outline-background-default'),
    );
    const list = await mount({ defaultValue: [notes] });
    const item = list.part('item');
    expect(getComputedStyle(item).backgroundColor).toBe(
      color('--color-file-input-item-background-default'),
    );
    await userEvent.hover(item);
    await expect
      .poll(() => getComputedStyle(item).backgroundImage)
      .toContain(color('--color-file-input-item-background-active'));
  });
}

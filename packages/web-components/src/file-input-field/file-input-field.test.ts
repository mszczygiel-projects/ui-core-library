import { expect, fixture, html } from '@open-wc/testing';
import './file-input-field.js';
import type { UiFileInputField } from './file-input-field.js';

const png = (name = 'photo.png') => new File([new Uint8Array(1024)], name, { type: 'image/png' });
const pdf = (name = 'contract.pdf') =>
  new File([new Uint8Array(1024)], name, { type: 'application/pdf' });

/** Drives the component the way a user would, rather than poking private methods. */
function drop(el: UiFileInputField, files: File[]) {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  const zone = el.shadowRoot!.querySelector('.dropzone')!;
  zone.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
}

describe('ui-file-input-field', () => {
  it('renders with documented defaults', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    expect(el.variant).to.equal('outline');
    expect(el.size).to.equal('default');
    expect(el.state).to.equal('default');
    expect(el.multiple).to.equal(false);
    expect(el.files.length).to.equal(0);
    expect(el.mode).to.equal('empty');
  });

  it('reflects variant, size and state to attributes', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field variant="filled" data-size="large" state="error">
      </ui-file-input-field>`,
    );
    expect(el.getAttribute('variant')).to.equal('filled');
    expect(el.getAttribute('data-size')).to.equal('large');
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('falls back to the configured browse label and lets prompt override it', async () => {
    const fallback = await fixture<UiFileInputField>(
      html`<ui-file-input-field></ui-file-input-field>`,
    );
    expect(fallback.shadowRoot!.querySelector('.prompt')!.textContent!.trim()).to.equal(
      'Drag & drop or browse',
    );

    const overridden = await fixture<UiFileInputField>(
      html`<ui-file-input-field prompt="Upload your logo"></ui-file-input-field>`,
    );
    expect(overridden.shadowRoot!.querySelector('.prompt')!.textContent!.trim()).to.equal(
      'Upload your logo',
    );
  });

  it('links description and hint through aria-describedby', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field description="PNG only" hint="Max 2 MB"></ui-file-input-field>`,
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('description hint');
  });

  it('marks the input invalid in the error state', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field state="error"></ui-file-input-field>`,
    );
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).to.equal('true');
  });

  it('derives the preview mode from a single image in single-file mode', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    drop(el, [png()]);
    await el.updateComplete;
    expect(el.mode).to.equal('filled');
    expect(el.getAttribute('data-value')).to.equal('filled');
    expect(el.shadowRoot!.querySelectorAll('.preview').length).to.equal(1);
  });

  it('derives the list mode for a non-image file', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    drop(el, [pdf()]);
    await el.updateComplete;
    expect(el.mode).to.equal('list');
    expect(el.shadowRoot!.querySelectorAll('.item').length).to.equal(1);
  });

  it('accumulates files and lists them in multiple mode', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field multiple></ui-file-input-field>`,
    );
    drop(el, [png('a.png')]);
    await el.updateComplete;
    drop(el, [png('b.png')]);
    await el.updateComplete;
    expect(el.files.length).to.equal(2);
    expect(el.mode).to.equal('list');
    expect(el.shadowRoot!.querySelectorAll('.item').length).to.equal(2);
  });

  it('replaces the selection instead of appending in single-file mode', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    drop(el, [png('first.png')]);
    await el.updateComplete;
    drop(el, [png('second.png')]);
    await el.updateComplete;
    expect(el.files.length).to.equal(1);
    expect(el.files[0].name).to.equal('second.png');
  });

  it('fires ui-change with the accepted files', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    let names: string[] = [];
    el.addEventListener('ui-change', (e) => {
      names = (e as CustomEvent<{ files: File[] }>).detail.files.map((f) => f.name);
    });
    drop(el, [png('logo.png')]);
    await el.updateComplete;
    expect(names).to.deep.equal(['logo.png']);
  });

  it('rejects a file whose type is outside accept', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field accept="image/*"></ui-file-input-field>`,
    );
    let reasons: string[] = [];
    el.addEventListener('ui-reject', (e) => {
      reasons = (e as CustomEvent<{ rejections: { reason: string }[] }>).detail.rejections.map(
        (r) => r.reason,
      );
    });
    drop(el, [pdf()]);
    await el.updateComplete;
    expect(reasons).to.deep.equal(['type']);
    expect(el.files.length).to.equal(0);
  });

  it('rejects a file larger than maxSize', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field max-size="10"></ui-file-input-field>`,
    );
    let reasons: string[] = [];
    el.addEventListener('ui-reject', (e) => {
      reasons = (e as CustomEvent<{ rejections: { reason: string }[] }>).detail.rejections.map(
        (r) => r.reason,
      );
    });
    drop(el, [png()]);
    await el.updateComplete;
    expect(reasons).to.deep.equal(['size']);
    expect(el.files.length).to.equal(0);
  });

  it('rejects files beyond maxFiles', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field multiple max-files="1"></ui-file-input-field>`,
    );
    let reasons: string[] = [];
    el.addEventListener('ui-reject', (e) => {
      reasons = (e as CustomEvent<{ rejections: { reason: string }[] }>).detail.rejections.map(
        (r) => r.reason,
      );
    });
    drop(el, [png('a.png'), png('b.png')]);
    await el.updateComplete;
    expect(el.files.length).to.equal(1);
    expect(reasons).to.deep.equal(['count']);
  });

  it('removes a file and reports which one left', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field multiple></ui-file-input-field>`,
    );
    drop(el, [png('a.png'), png('b.png')]);
    await el.updateComplete;

    let removedName = '';
    let removedIndex = -1;
    el.addEventListener('ui-remove', (e) => {
      const detail = (e as CustomEvent<{ file: File; index: number }>).detail;
      removedName = detail.file.name;
      removedIndex = detail.index;
    });

    const removeButton = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.item .action')[0];
    removeButton.click();
    await el.updateComplete;

    expect(removedName).to.equal('a.png');
    expect(removedIndex).to.equal(0);
    expect(el.files.map((f) => f.name)).to.deep.equal(['b.png']);
  });

  it('names the remove button after the file it removes', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    drop(el, [png('team-photo.png')]);
    await el.updateComplete;
    const button = el.shadowRoot!.querySelector('.action--icon')!;
    expect(button.getAttribute('aria-label')).to.equal('Remove team-photo.png');
  });

  it('ignores drops while disabled', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field disabled></ui-file-input-field>`,
    );
    drop(el, [png()]);
    await el.updateComplete;
    expect(el.files.length).to.equal(0);
  });

  it('flags drag-over only while a drag is in progress', async () => {
    const el = await fixture<UiFileInputField>(html`<ui-file-input-field></ui-file-input-field>`);
    const zone = el.shadowRoot!.querySelector('.dropzone')!;
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
    expect(el.hasAttribute('data-dragover')).to.equal(true);
    zone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
    expect(el.hasAttribute('data-dragover')).to.equal(false);
  });

  it('projects extra controls into the actions slot', async () => {
    const el = await fixture<UiFileInputField>(
      html`<ui-file-input-field
        ><button slot="actions" id="extra">Crop</button></ui-file-input-field
      >`,
    );
    drop(el, [png()]);
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="actions"]')!;
    const assigned = slot.assignedElements().map((node) => node.id);
    expect(assigned).to.deep.equal(['extra']);
  });
});

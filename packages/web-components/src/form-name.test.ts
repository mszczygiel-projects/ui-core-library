import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import './checkbox-field/checkbox-field.js';
import './combobox/combobox.js';
import './date-field/date-field.js';
import './file-input-field/file-input-field.js';
import './number-field/number-field.js';
import './password-field/password-field.js';
import './radio-field/radio-field.js';
import './search-field/search-field.js';
import './select-field/select-field.js';
import './switch-field/switch-field.js';
import './text-field/text-field.js';
import './textarea-field/textarea-field.js';

type FormField = HTMLElement & { name?: string; updateComplete: Promise<unknown> };

/**
 * Populates a field so it contributes a submission entry, and reports the value
 * that entry is expected to carry.
 */
const FIELDS: Record<string, { fill: (el: FormField) => void; expected: string }> = {
  'ui-checkbox-field': {
    fill: (el) => Object.assign(el, { value: 'yes', checked: true }),
    expected: 'yes',
  },
  'ui-combobox': { fill: (el) => Object.assign(el, { value: 'a' }), expected: 'a' },
  // Dates are held as `startDate`/`endDate`, not `value`.
  'ui-date-field': {
    fill: (el) => Object.assign(el, { startDate: '2026-08-16' }),
    expected: '2026-08-16',
  },
  'ui-number-field': { fill: (el) => Object.assign(el, { value: 5 }), expected: '5' },
  'ui-password-field': {
    fill: (el) => Object.assign(el, { value: 'hunter2' }),
    expected: 'hunter2',
  },
  'ui-radio-field': {
    fill: (el) => Object.assign(el, { value: 'one', checked: true }),
    expected: 'one',
  },
  'ui-search-field': { fill: (el) => Object.assign(el, { value: 'query' }), expected: 'query' },
  'ui-select-field': { fill: (el) => Object.assign(el, { value: 'opt' }), expected: 'opt' },
  'ui-switch-field': {
    fill: (el) => Object.assign(el, { value: 'on', checked: true }),
    expected: 'on',
  },
  'ui-text-field': { fill: (el) => Object.assign(el, { value: 'hello' }), expected: 'hello' },
  'ui-textarea-field': { fill: (el) => Object.assign(el, { value: 'para' }), expected: 'para' },
};

const TAGS = Object.keys(FIELDS);

async function settle(el: FormField) {
  await el.updateComplete;
  await aTimeout(0);
  await el.updateComplete;
}

function entries(form: HTMLFormElement): [string, FormDataEntryValue][] {
  return Array.from(new FormData(form).entries());
}

describe('form-associated fields — submission entry name', () => {
  for (const tag of TAGS) {
    describe(tag, () => {
      it('submits under a name set as an attribute', async () => {
        const form = await fixture<HTMLFormElement>(html`<form></form>`);
        const el = document.createElement(tag) as FormField;
        el.setAttribute('name', 'field');
        form.append(el);
        FIELDS[tag].fill(el);
        await settle(el);

        expect(entries(form)).to.deep.equal([['field', FIELDS[tag].expected]]);
      });

      it('submits under a name set as a property', async () => {
        const form = await fixture<HTMLFormElement>(html`<form></form>`);
        const el = document.createElement(tag) as FormField;
        form.append(el);
        // Regression: the submission entry name comes from the `name` *content
        // attribute*, so without reflection an imperatively named field — what a
        // framework binding props produces — was dropped from the form silently.
        el.name = 'field';
        FIELDS[tag].fill(el);
        await settle(el);

        expect(el.getAttribute('name'), 'name reflected to attribute').to.equal('field');
        expect(entries(form)).to.deep.equal([['field', FIELDS[tag].expected]]);
      });

      it('follows a name changed after the value was set', async () => {
        const form = await fixture<HTMLFormElement>(html`<form></form>`);
        const el = document.createElement(tag) as FormField;
        el.setAttribute('name', 'before');
        form.append(el);
        FIELDS[tag].fill(el);
        await settle(el);
        expect(entries(form)).to.deep.equal([['before', FIELDS[tag].expected]]);

        el.name = 'after';
        await settle(el);
        expect(entries(form)).to.deep.equal([['after', FIELDS[tag].expected]]);
      });

      it('is dropped from the form when it has no name at all', async () => {
        const form = await fixture<HTMLFormElement>(html`<form></form>`);
        const el = document.createElement(tag) as FormField;
        form.append(el);
        FIELDS[tag].fill(el);
        await settle(el);

        expect(entries(form)).to.deep.equal([]);
      });
    });
  }

  // These two build their own FormData, so the entry names come from that object
  // rather than from the host attribute — a separate path that has to be covered
  // explicitly, and the one where a late `name` change previously went stale.
  describe('multi-entry fields', () => {
    it('ui-combobox submits one entry per selected value in multiple mode', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('ui-combobox') as FormField;
      form.append(el);
      Object.assign(el, { multiple: true, values: ['a', 'b'] });
      el.name = 'tags';
      await settle(el);

      expect(entries(form)).to.deep.equal([
        ['tags', 'a'],
        ['tags', 'b'],
      ]);
    });

    it('ui-combobox re-syncs multi-mode entries when the name changes', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('ui-combobox') as FormField;
      el.setAttribute('name', 'before');
      form.append(el);
      Object.assign(el, { multiple: true, values: ['a', 'b'] });
      await settle(el);

      el.name = 'after';
      await settle(el);
      expect(entries(form)).to.deep.equal([
        ['after', 'a'],
        ['after', 'b'],
      ]);
    });

    it('ui-file-input-field submits its files, including when named after selection', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('ui-file-input-field') as FormField;
      form.append(el);
      const file = new File(['x'], 'note.txt', { type: 'text/plain' });
      Object.assign(el, { files: [file] });
      await settle(el);
      // Named only after the files were picked — the sync at selection time saw no
      // name and stored `null`.
      el.name = 'upload';
      await settle(el);

      const list = entries(form);
      expect(list.length).to.equal(1);
      expect(list[0][0]).to.equal('upload');
      expect((list[0][1] as File).name).to.equal('note.txt');
    });
  });
});

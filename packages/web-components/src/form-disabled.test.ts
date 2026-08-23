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

type FormField = HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> };

/**
 * Tag name → selector for the control that carries the native `disabled`, i.e. the
 * one a user types into or activates. Auxiliary controls (steppers, clear buttons)
 * disable for their own reasons and are deliberately not asserted here.
 */
const PRIMARY_CONTROL: Record<string, string> = {
  'ui-checkbox-field': 'input',
  'ui-combobox': 'input',
  'ui-date-field': 'input',
  'ui-file-input-field': 'input[type="file"]',
  'ui-number-field': 'input',
  'ui-password-field': 'input',
  'ui-radio-field': 'input',
  'ui-search-field': 'input',
  'ui-select-field': 'button.trigger',
  'ui-switch-field': 'input',
  'ui-text-field': 'input',
  'ui-textarea-field': 'textarea',
};

const TAGS = Object.keys(PRIMARY_CONTROL);

function control(el: FormField): HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement {
  const selector = PRIMARY_CONTROL[el.localName];
  const node = el.shadowRoot!.querySelector<
    HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement
  >(selector);
  if (!node) throw new Error(`${el.localName}: no control matching "${selector}"`);
  return node;
}

/** Lets Lit settle plus any form-association callback that lands after the update. */
async function settle(el: FormField) {
  await el.updateComplete;
  await aTimeout(0);
  await el.updateComplete;
}

describe('form-associated fields — disabled propagation', () => {
  for (const tag of TAGS) {
    describe(tag, () => {
      it('propagates disabled to the control and back off again', async () => {
        const el = (await fixture(html`${document.createElement(tag)}`)) as FormField;
        expect(control(el).disabled, 'initially enabled').to.equal(false);

        el.disabled = true;
        await settle(el);
        expect(control(el).disabled, 'disabled by property').to.equal(true);

        // Regression: `disabled` reflects to an attribute, and that reflection fires
        // formDisabledCallback *during* Lit's update — after render() has read its
        // values. Tracking the element's own disabled state there left the control
        // stuck disabled while the host attribute (and its styling) said otherwise.
        el.disabled = false;
        await settle(el);
        expect(control(el).disabled, 're-enabled by property').to.equal(false);
        expect(el.hasAttribute('disabled'), 'host attribute cleared').to.equal(false);
      });

      it('follows an ancestor <fieldset disabled> in both directions', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <fieldset>${document.createElement(tag)}</fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector(tag) as FormField;
        await settle(el);
        expect(control(el).disabled, 'initially enabled').to.equal(false);

        fieldset.disabled = true;
        await settle(el);
        expect(control(el).disabled, 'disabled by fieldset').to.equal(true);
        expect(el.hasAttribute('disabled'), 'fieldset must not set the host attribute').to.equal(
          false,
        );

        fieldset.disabled = false;
        await settle(el);
        expect(control(el).disabled, 're-enabled by fieldset').to.equal(false);
      });

      it('stays disabled while either source still applies', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <fieldset>${document.createElement(tag)}</fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector(tag) as FormField;
        await settle(el);

        el.disabled = true;
        fieldset.disabled = true;
        await settle(el);
        expect(control(el).disabled, 'both sources').to.equal(true);

        // Releasing one source must not re-enable the control while the other holds.
        fieldset.disabled = false;
        await settle(el);
        expect(control(el).disabled, 'own disabled still set').to.equal(true);

        el.disabled = false;
        await settle(el);
        expect(control(el).disabled, 'both released').to.equal(false);
      });
    });
  }
});

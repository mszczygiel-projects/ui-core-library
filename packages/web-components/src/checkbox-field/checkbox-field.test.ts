import { fixture, html, expect } from '@open-wc/testing';
import type { UiCheckboxField } from './checkbox-field.js';
import './checkbox-field.js';

describe('UiCheckboxField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field label="Accept"></ui-checkbox-field>`,
    );
    expect(el).to.not.equal(null);
  });

  it('renders inner <input type="checkbox">', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(input).to.not.equal(null);
  });

  it('reflects label attribute', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field label="Remember me"></ui-checkbox-field>`,
    );
    expect(el.getAttribute('label')).to.equal('Remember me');
    expect(el.shadowRoot!.querySelector('.label-text')!.textContent).to.equal('Remember me');
  });

  it('does not render label-text when label is empty', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    expect(el.shadowRoot!.querySelector('.label-text')).to.equal(null);
  });

  it('renders hint when provided', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field hint="Helper text"></ui-checkbox-field>`,
    );
    const hint = el.shadowRoot!.querySelector('.hint');
    expect(hint).to.not.equal(null);
    expect(hint!.textContent).to.equal('Helper text');
  });

  it('does not render hint when not provided', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
  });

  it('reflects checked attribute and forwards to input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field checked></ui-checkbox-field>`,
    );
    expect(el.checked).to.equal(true);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.checked).to.equal(true);
  });

  it('checked defaults to false', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    expect(el.checked).to.equal(false);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.checked).to.equal(false);
  });

  it('reflects indeterminate attribute and sets input.indeterminate property', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field indeterminate></ui-checkbox-field>`,
    );
    await el.updateComplete;
    expect(el.indeterminate).to.equal(true);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.indeterminate).to.equal(true);
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field state="error"></ui-checkbox-field>`,
    );
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('state=disabled disables inner input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field state="disabled"></ui-checkbox-field>`,
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.disabled).to.equal(true);
  });

  it('disabled prop reflects and disables inner input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field disabled></ui-checkbox-field>`,
    );
    expect(el.getAttribute('disabled')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.disabled).to.equal(true);
  });

  it('required prop reflects and forwards to input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field required></ui-checkbox-field>`,
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.required).to.equal(true);
    expect(el.getAttribute('required')).to.not.equal(null);
  });

  it('name forwards to inner input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field name="agree"></ui-checkbox-field>`,
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.name).to.equal('agree');
  });

  it('value forwards to inner input', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field value="yes"></ui-checkbox-field>`,
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.value).to.equal('yes');
  });

  it('input aria-invalid is set on error state', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field state="error"></ui-checkbox-field>`,
    );
    expect(
      el.shadowRoot!.querySelector<HTMLInputElement>('input')!.getAttribute('aria-invalid'),
    ).to.equal('true');
  });

  it('input aria-describedby points to hint when hint is set', async () => {
    const el = await fixture<UiCheckboxField>(
      html`<ui-checkbox-field hint="Some hint"></ui-checkbox-field>`,
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).to.equal('hint');
    expect(el.shadowRoot!.getElementById('hint')).to.not.equal(null);
  });

  it('dispatches ui-change event with checked value on toggle', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    let received: boolean | undefined;
    el.addEventListener('ui-change', (e: Event) => {
      received = (e as CustomEvent<{ checked: boolean }>).detail.checked;
    });
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(received).to.equal(true);
  });

  it('updates checked property when input changes', async () => {
    const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(el.checked).to.equal(true);
  });

  describe('form-associated', () => {
    it('submits value via FormData when checked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-checkbox-field name="agree" value="yes" checked></ui-checkbox-field>
        </form>
      `);

      expect(new FormData(form).get('agree')).to.equal('yes');
    });

    it('does not submit value via FormData when unchecked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-checkbox-field name="agree" value="yes"></ui-checkbox-field>
        </form>
      `);

      expect(new FormData(form).get('agree')).to.equal(null);
    });

    it('resets checked state on form reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-checkbox-field name="agree" value="yes" checked></ui-checkbox-field>
        </form>
      `);
      const el = form.querySelector<UiCheckboxField>('ui-checkbox-field')!;
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;

      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      await el.updateComplete;

      form.reset();
      await el.updateComplete;

      expect(el.checked).to.equal(true);
      expect(new FormData(form).get('agree')).to.equal('yes');
    });

    it('excludes value from FormData when disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-checkbox-field name="agree" value="yes" checked disabled></ui-checkbox-field>
        </form>
      `);

      expect(new FormData(form).get('agree')).to.equal(null);
    });

    it('dispatches native change event on toggle', async () => {
      const el = await fixture<UiCheckboxField>(html`<ui-checkbox-field></ui-checkbox-field>`);
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
      let fired = false;

      el.addEventListener('change', () => {
        fired = true;
      });

      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

      expect(fired).to.equal(true);
    });
  });
});

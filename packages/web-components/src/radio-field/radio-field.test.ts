import { fixture, html, expect } from '@open-wc/testing';
import type { UiRadioField } from './radio-field.js';
import './radio-field.js';

describe('UiRadioField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field label="Accept"></ui-radio-field>`);
    expect(el).to.not.equal(null);
  });

  it('renders inner <input type="radio">', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="radio"]');
    expect(input).to.not.equal(null);
  });

  it('reflects label attribute', async () => {
    const el = await fixture<UiRadioField>(
      html`<ui-radio-field label="Remember me"></ui-radio-field>`,
    );
    expect(el.getAttribute('label')).to.equal('Remember me');
    expect(el.shadowRoot!.querySelector('.label-text')!.textContent).to.equal('Remember me');
  });

  it('does not render label-text when label is empty', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
    expect(el.shadowRoot!.querySelector('.label-text')).to.equal(null);
  });

  it('renders hint when provided', async () => {
    const el = await fixture<UiRadioField>(
      html`<ui-radio-field hint="Helper text"></ui-radio-field>`,
    );
    const hint = el.shadowRoot!.querySelector('.hint');
    expect(hint).to.not.equal(null);
    expect(hint!.textContent).to.equal('Helper text');
  });

  it('does not render hint when not provided', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
    expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
  });

  it('reflects checked attribute and forwards to input', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field checked></ui-radio-field>`);
    expect(el.checked).to.equal(true);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.checked).to.equal(true);
  });

  it('checked defaults to false', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
    expect(el.checked).to.equal(false);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.checked).to.equal(false);
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field state="error"></ui-radio-field>`);
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('state=disabled disables inner input', async () => {
    const el = await fixture<UiRadioField>(
      html`<ui-radio-field state="disabled"></ui-radio-field>`,
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.disabled).to.equal(true);
  });

  it('disabled prop reflects and disables inner input', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field disabled></ui-radio-field>`);
    expect(el.getAttribute('disabled')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.disabled).to.equal(true);
  });

  it('required prop reflects and forwards to input', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field required></ui-radio-field>`);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.required).to.equal(true);
    expect(el.getAttribute('required')).to.not.equal(null);
  });

  it('name forwards to inner input', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field name="agree"></ui-radio-field>`);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.name).to.equal('agree');
  });

  it('value forwards to inner input', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field value="yes"></ui-radio-field>`);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input')!.value).to.equal('yes');
  });

  it('input aria-invalid is set on error state', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field state="error"></ui-radio-field>`);
    expect(
      el.shadowRoot!.querySelector<HTMLInputElement>('input')!.getAttribute('aria-invalid'),
    ).to.equal('true');
  });

  it('input aria-describedby points to hint when hint is set', async () => {
    const el = await fixture<UiRadioField>(
      html`<ui-radio-field hint="Some hint"></ui-radio-field>`,
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).to.equal('hint');
    expect(el.shadowRoot!.getElementById('hint')).to.not.equal(null);
  });

  it('dispatches ui-change event with checked value on toggle', async () => {
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
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
    const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(el.checked).to.equal(true);
  });

  describe('form-associated', () => {
    it('submits value via FormData when checked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-radio-field name="choice" value="yes" checked></ui-radio-field>
        </form>
      `);

      expect(new FormData(form).get('choice')).to.equal('yes');
    });

    it('does not submit value via FormData when unchecked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-radio-field name="choice" value="yes"></ui-radio-field>
        </form>
      `);

      expect(new FormData(form).get('choice')).to.equal(null);
    });

    it('resets checked state on form reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-radio-field name="choice" value="yes" checked></ui-radio-field>
        </form>
      `);
      const el = form.querySelector<UiRadioField>('ui-radio-field')!;
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;

      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      await el.updateComplete;

      form.reset();
      await el.updateComplete;

      expect(el.checked).to.equal(true);
      expect(new FormData(form).get('choice')).to.equal('yes');
    });

    it('excludes value from FormData when disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-radio-field name="choice" value="yes" checked disabled></ui-radio-field>
        </form>
      `);

      expect(new FormData(form).get('choice')).to.equal(null);
    });

    it('dispatches native change event on toggle', async () => {
      const el = await fixture<UiRadioField>(html`<ui-radio-field></ui-radio-field>`);
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

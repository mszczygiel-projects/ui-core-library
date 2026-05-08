import { fixture, html, expect } from '@open-wc/testing';
import type { UiPasswordField } from './password-field.js';
import './password-field.js';

describe('UiPasswordField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field label="Password"></ui-password-field>`,
    );
    expect(el).to.not.equal(null);
  });

  it('renders inner <input> element', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    expect(el.shadowRoot!.querySelector('input')).to.not.equal(null);
  });

  it('input type is password by default', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('password');
  });

  it('input type is text when show-password is set', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field show-password></ui-password-field>`,
    );
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('text');
  });

  it('clicking toggle changes input type to text', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('text');
    expect(el.showPassword).to.equal(true);
  });

  it('clicking toggle twice reverts to password type', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    toggle.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('password');
  });

  it('toggle button has aria-label', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.getAttribute('aria-label')).to.equal('Show password');
  });

  it('toggle aria-label changes after toggle', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-label')).to.equal('Hide password');
  });

  it('toggle has aria-pressed reflecting show-password state', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.getAttribute('aria-pressed')).to.equal('false');
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-pressed')).to.equal('true');
  });

  it('toggle button is disabled when state=disabled', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field state="disabled"></ui-password-field>`,
    );
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.disabled).to.equal(true);
  });

  it('toggle button is disabled when disabled attribute is set', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field disabled></ui-password-field>`,
    );
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.disabled).to.equal(true);
  });

  it('dispatches ui-toggle event on click', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    let eventDetail: { showPassword: boolean } | null = null;
    el.addEventListener('ui-toggle', (e) => {
      eventDetail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!.click();
    await el.updateComplete;
    expect(eventDetail).to.not.equal(null);
    expect(eventDetail!.showPassword).to.equal(true);
  });

  it('dispatches ui-input event on typing', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    let fired = false;
    el.addEventListener('ui-input', () => {
      fired = true;
    });
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fired).to.equal(true);
  });

  it('reflects show-password attribute', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    el.showPassword = true;
    await el.updateComplete;
    expect(el.hasAttribute('show-password')).to.equal(true);
  });

  it('always has has-trailing-icon attribute', async () => {
    const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
    await el.updateComplete;
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field variant="filled"></ui-password-field>`,
    );
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiPasswordField>(
      html`<ui-password-field state="error"></ui-password-field>`,
    );
    expect(el.getAttribute('state')).to.equal('error');
  });

  describe('form-associated', () => {
    it('submits value via FormData', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-password-field name="password" value="secret"></ui-password-field>
        </form>
      `);

      expect(new FormData(form).get('password')).to.equal('secret');
    });

    it('submits updated value after user input', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-password-field name="password" value="secret"></ui-password-field>
        </form>
      `);
      const el = form.querySelector<UiPasswordField>('ui-password-field')!;
      const nativeInput = el.shadowRoot!.querySelector('input')!;

      nativeInput.value = 'updated-secret';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await el.updateComplete;

      expect(new FormData(form).get('password')).to.equal('updated-secret');
    });

    it('resets to initial value on form reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-password-field name="password" value="secret"></ui-password-field>
        </form>
      `);
      const el = form.querySelector<UiPasswordField>('ui-password-field')!;
      const nativeInput = el.shadowRoot!.querySelector('input')!;

      nativeInput.value = 'updated-secret';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await el.updateComplete;

      form.reset();
      await el.updateComplete;

      expect(el.value).to.equal('secret');
      expect(new FormData(form).get('password')).to.equal('secret');
    });

    it('excludes value from FormData when disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-password-field name="password" value="secret" disabled></ui-password-field>
        </form>
      `);

      expect(new FormData(form).get('password')).to.equal(null);
    });

    it('dispatches native input event on user input', async () => {
      const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      let fired = false;

      el.addEventListener('input', () => {
        fired = true;
      });

      nativeInput.value = 'secret';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

      expect(fired).to.equal(true);
    });

    it('dispatches native change event on user change', async () => {
      const el = await fixture<UiPasswordField>(html`<ui-password-field></ui-password-field>`);
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      let fired = false;

      el.addEventListener('change', () => {
        fired = true;
      });

      nativeInput.value = 'secret';
      nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

      expect(fired).to.equal(true);
    });
  });
});

import { fixture, html, expect } from '@open-wc/testing';
import type { UiTextField } from './text-field.js';
import './text-field.js';

describe('UiTextField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Email"></ui-text-field>`);
    expect(el).to.not.equal(null);
  });

  it('renders inner <input> element', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')).to.not.equal(null);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field variant="filled"></ui-text-field>`);
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('defaults variant to outline', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    expect(el.variant).to.equal('outline');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field state="error"></ui-text-field>`);
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('reflects label-placement attribute', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field label-placement="floating"></ui-text-field>`,
    );
    expect(el.getAttribute('label-placement')).to.equal('floating');
  });

  it('disabled prop disables inner <input>', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field disabled></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('state=disabled disables inner <input>', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field state="disabled"></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('required prop reflects and forwards to input', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field required></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.required).to.equal(true);
    expect(el.getAttribute('required')).to.not.equal(null);
  });

  it('readonly prop forwards to input', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field readonly></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.readOnly).to.equal(true);
  });

  it('renders top label outside field-wrapper', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field label="Name" label-placement="top"></ui-text-field>`,
    );
    const shadow = el.shadowRoot!;
    const label = shadow.querySelector('label');
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    expect(label).to.not.equal(null);
    expect(fieldWrapper!.contains(label)).to.equal(false);
  });

  it('renders floating label inside field-wrapper', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field label="Name" label-placement="floating"></ui-text-field>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = fieldWrapper!.querySelector('label');
    expect(label).to.not.equal(null);
  });

  it('variant=underlined with label-placement=top renders top label outside field-wrapper', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field variant="underlined" label="Name" label-placement="top"></ui-text-field>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = shadow.querySelector('label');
    expect(label).to.not.equal(null);
    expect(fieldWrapper!.contains(label)).to.equal(false);
  });

  it('variant=underlined with label-placement=floating renders floating label inside field-wrapper', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field
        variant="underlined"
        label="Name"
        label-placement="floating"
      ></ui-text-field>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = fieldWrapper!.querySelector('label');
    expect(label).to.not.equal(null);
  });

  it('variant=filled with label-placement=floating renders floating label inside field-wrapper', async () => {
    const el = await fixture<UiTextField>(
      html`<ui-text-field
        variant="filled"
        label="Name"
        label-placement="floating"
      ></ui-text-field>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = fieldWrapper!.querySelector('label');
    expect(label).to.not.equal(null);
  });

  it('renders hint when provided', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field hint="Helper text"></ui-text-field>`);
    const hint = el.shadowRoot!.querySelector('.hint');
    expect(hint).to.not.equal(null);
    expect(hint!.textContent).to.equal('Helper text');
  });

  it('does not render hint when not provided', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
  });

  it('input aria-invalid is set on error state', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field state="error"></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).to.equal('true');
  });

  it('input aria-describedby points to hint when hint is set', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field hint="Some hint"></ui-text-field>`);
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-describedby')).to.equal(
      'hint',
    );
  });

  it('sets has-leading-icon attribute when slot is filled', async () => {
    const el = await fixture<UiTextField>(html`
      <ui-text-field>
        <span slot="leading-icon">icon</span>
      </ui-text-field>
    `);
    await el.updateComplete;
    expect(el.hasAttribute('has-leading-icon')).to.equal(true);
  });

  it('sets has-trailing-icon attribute when slot is filled', async () => {
    const el = await fixture<UiTextField>(html`
      <ui-text-field>
        <span slot="trailing-icon">icon</span>
      </ui-text-field>
    `);
    await el.updateComplete;
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('renders default danger trailing icon in error state', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field state="error"></ui-text-field>`);
    await el.updateComplete;

    const trailingSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="trailing-icon"]',
    );
    const fallbackIcon = trailingSlot!.querySelector('.icon-content svg');

    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
    expect(fallbackIcon).to.not.equal(null);
  });

  it('does not render default danger icon when custom trailing icon is provided', async () => {
    const el = await fixture<UiTextField>(html`
      <ui-text-field state="error">
        <span slot="trailing-icon">custom</span>
      </ui-text-field>
    `);
    await el.updateComplete;

    const trailingSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="trailing-icon"]',
    );
    const fallbackIcon = trailingSlot!.querySelector('.icon-content');

    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
    expect(fallbackIcon).to.equal(null);
  });

  it('removes default danger trailing icon outside error state', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field state="error"></ui-text-field>`);
    await el.updateComplete;

    el.state = 'default';
    await el.updateComplete;

    const trailingSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="trailing-icon"]',
    );
    const fallbackIcon = trailingSlot!.querySelector('.icon-content');

    expect(el.hasAttribute('has-trailing-icon')).to.equal(false);
    expect(fallbackIcon).to.equal(null);
  });

  it('dispatches ui-input event with value on input', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    const nativeInput = el.shadowRoot!.querySelector('input')!;
    let received: string | undefined;
    el.addEventListener('ui-input', (e: Event) => {
      received = (e as CustomEvent<{ value: string }>).detail.value;
    });
    nativeInput.value = 'hello';
    nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(received).to.equal('hello');
  });

  it('dispatches ui-change event on change', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    const nativeInput = el.shadowRoot!.querySelector('input')!;
    let received: string | undefined;
    el.addEventListener('ui-change', (e: Event) => {
      received = (e as CustomEvent<{ value: string }>).detail.value;
    });
    nativeInput.value = 'world';
    nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(received).to.equal('world');
  });

  it('renders leading-icon and trailing-icon slots', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    const shadow = el.shadowRoot!;
    expect(shadow.querySelector('slot[name="leading-icon"]')).to.not.equal(null);
    expect(shadow.querySelector('slot[name="trailing-icon"]')).to.not.equal(null);
  });

  describe('form-associated', () => {
    it('submits value via FormData', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-text-field name="username" value="alice"></ui-text-field>
        </form>
      `);
      const data = new FormData(form);
      expect(data.get('username')).to.equal('alice');
    });

    it('submits updated value after user input', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-text-field name="username" value="alice"></ui-text-field>
        </form>
      `);
      const el = form.querySelector<UiTextField>('ui-text-field')!;
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      nativeInput.value = 'bob';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(new FormData(form).get('username')).to.equal('bob');
    });

    it('resets to initial value on form reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-text-field name="username" value="alice"></ui-text-field>
        </form>
      `);
      const el = form.querySelector<UiTextField>('ui-text-field')!;
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      nativeInput.value = 'bob';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await el.updateComplete;

      form.reset();
      await el.updateComplete;
      expect(el.value).to.equal('alice');
      expect(new FormData(form).get('username')).to.equal('alice');
    });

    it('excludes value from FormData when disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <ui-text-field name="username" value="alice" disabled></ui-text-field>
        </form>
      `);
      expect(new FormData(form).get('username')).to.equal(null);
    });

    it('dispatches native input event on user input', async () => {
      const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      let fired = false;
      el.addEventListener('input', () => {
        fired = true;
      });
      nativeInput.value = 'test';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(fired).to.equal(true);
    });

    it('dispatches native change event on change', async () => {
      const el = await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
      const nativeInput = el.shadowRoot!.querySelector('input')!;
      let fired = false;
      el.addEventListener('change', () => {
        fired = true;
      });
      nativeInput.value = 'test';
      nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      expect(fired).to.equal(true);
    });
  });
});

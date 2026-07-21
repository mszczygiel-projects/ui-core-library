import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiTextareaField } from './textarea-field.js';
import './textarea-field.js';

const textareaOf = (el: UiTextareaField) => el.shadowRoot!.querySelector('textarea')!;

describe('UiTextareaField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field label="Message"></ui-textarea-field>`,
    );
    expect(el).to.not.equal(null);
  });

  it('renders inner <textarea> element', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    expect(el.shadowRoot!.querySelector('textarea')).to.not.equal(null);
  });

  it('applies documented defaults', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    expect(el.variant).to.equal('outline');
    expect(el.size).to.equal('default');
    expect(el.labelPlacement).to.equal('top');
    expect(el.state).to.equal('default');
    expect(el.resize).to.equal('vertical');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field variant="filled"></ui-textarea-field>`,
    );
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('reflects resize attribute', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    el.resize = 'auto';
    await el.updateComplete;
    expect(el.getAttribute('resize')).to.equal('auto');
  });

  it('reflects state and label-placement attributes', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field state="error" label-placement="floating"></ui-textarea-field>`,
    );
    expect(el.getAttribute('state')).to.equal('error');
    expect(el.getAttribute('label-placement')).to.equal('floating');
  });

  it('disabled prop disables inner <textarea>', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field disabled></ui-textarea-field>`,
    );
    expect(textareaOf(el).disabled).to.equal(true);
  });

  it('state=disabled disables inner <textarea>', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field state="disabled"></ui-textarea-field>`,
    );
    expect(textareaOf(el).disabled).to.equal(true);
  });

  it('required prop reflects and forwards to textarea', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field required></ui-textarea-field>`,
    );
    expect(textareaOf(el).required).to.equal(true);
    expect(el.getAttribute('required')).to.not.equal(null);
  });

  it('readonly prop forwards to textarea', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field readonly></ui-textarea-field>`,
    );
    expect(textareaOf(el).readOnly).to.equal(true);
  });

  it('renders top label outside the field wrapper', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field label="Message" label-placement="top"></ui-textarea-field>`,
    );
    const shadow = el.shadowRoot!;
    const label = shadow.querySelector('.label')!;
    expect(label.textContent).to.equal('Message');
    expect(label.closest('.field-wrapper')).to.equal(null);
  });

  it('renders inner label inside the field wrapper', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field label="Message" label-placement="inner"></ui-textarea-field>`,
    );
    const label = el.shadowRoot!.querySelector('.label')!;
    expect(label.closest('.field-wrapper')).to.not.equal(null);
  });

  it('renders floating label after the textarea so the sibling selector works', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field label="Message" label-placement="floating"></ui-textarea-field>`,
    );
    const wrapper = el.shadowRoot!.querySelector('.field-wrapper')!;
    const children = Array.from(wrapper.children);
    expect(children.indexOf(wrapper.querySelector('.label')!)).to.be.greaterThan(
      children.indexOf(wrapper.querySelector('textarea')!),
    );
  });

  it('uses a blank placeholder in floating mode so :placeholder-shown stays accurate', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field
        label="Message"
        label-placement="floating"
        placeholder="Ignored"
      ></ui-textarea-field>`,
    );
    expect(textareaOf(el).placeholder).to.equal(' ');
  });

  it('renders hint and links it via aria-describedby', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field hint="Max 500 characters"></ui-textarea-field>`,
    );
    const hint = el.shadowRoot!.querySelector('.hint')!;
    expect(hint.textContent).to.equal('Max 500 characters');
    expect(textareaOf(el).getAttribute('aria-describedby')).to.equal(hint.id);
  });

  it('sets aria-invalid in the error state', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field state="error"></ui-textarea-field>`,
    );
    expect(textareaOf(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('syncs the value property to the inner textarea', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    el.value = 'Hello\nthere';
    await el.updateComplete;
    expect(textareaOf(el).value).to.equal('Hello\nthere');
  });

  it('emits ui-input with the current value', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    const textarea = textareaOf(el);
    setTimeout(() => {
      textarea.value = 'typed';
      textarea.dispatchEvent(new Event('input'));
    });
    const event = await oneEvent(el, 'ui-input');
    expect(event.detail.value).to.equal('typed');
    expect(el.value).to.equal('typed');
  });

  it('emits ui-change with the current value', async () => {
    const el = await fixture<UiTextareaField>(html`<ui-textarea-field></ui-textarea-field>`);
    const textarea = textareaOf(el);
    setTimeout(() => {
      textarea.value = 'committed';
      textarea.dispatchEvent(new Event('change'));
    });
    const event = await oneEvent(el, 'ui-change');
    expect(event.detail.value).to.equal('committed');
  });

  it('publishes its value to a surrounding form', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-textarea-field name="message" value="hi"></ui-textarea-field>
      </form>
    `);
    expect(new FormData(form).get('message')).to.equal('hi');
  });

  it('withholds its value from the form when disabled', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-textarea-field name="message" value="hi" disabled></ui-textarea-field>
      </form>
    `);
    expect(new FormData(form).get('message')).to.equal(null);
  });

  it('restores the initial value on form reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-textarea-field name="message" value="initial"></ui-textarea-field>
      </form>
    `);
    const el = form.querySelector<UiTextareaField>('ui-textarea-field')!;
    el.value = 'edited';
    await el.updateComplete;
    form.reset();
    await el.updateComplete;
    expect(el.value).to.equal('initial');
  });

  it('publishes a measured height to CSS when resize is auto', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field resize="auto" value="one"></ui-textarea-field>`,
    );
    await el.updateComplete;
    const height = textareaOf(el).style.getPropertyValue('--_auto-height');
    expect(height).to.match(/^\d+(\.\d+)?px$/);
  });

  it('grows the published height as content is added', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field resize="auto"></ui-textarea-field>`,
    );
    await el.updateComplete;
    const before = parseFloat(textareaOf(el).style.getPropertyValue('--_auto-height'));

    el.value = 'one\ntwo\nthree\nfour\nfive\nsix';
    await el.updateComplete;
    const after = parseFloat(textareaOf(el).style.getPropertyValue('--_auto-height'));

    expect(after).to.be.greaterThan(before);
  });

  it('does not publish a height when resize is not auto', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field resize="vertical" value="one"></ui-textarea-field>`,
    );
    await el.updateComplete;
    expect(textareaOf(el).style.getPropertyValue('--_auto-height')).to.equal('');
  });

  it('drops the published height when switching away from auto', async () => {
    const el = await fixture<UiTextareaField>(
      html`<ui-textarea-field resize="auto" value="one"></ui-textarea-field>`,
    );
    await el.updateComplete;
    expect(textareaOf(el).style.getPropertyValue('--_auto-height')).to.not.equal('');

    el.resize = 'none';
    await el.updateComplete;
    expect(textareaOf(el).style.getPropertyValue('--_auto-height')).to.equal('');
  });
});

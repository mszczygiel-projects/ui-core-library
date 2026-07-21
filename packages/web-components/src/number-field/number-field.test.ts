import { fixture, html, expect } from '@open-wc/testing';
import type { UiNumberField } from './number-field.js';
import './number-field.js';
import { commitValue, formatValue, parseValue, roundToPrecision, stepValue } from './numeric.js';

const aTimeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const input = (el: UiNumberField) => el.shadowRoot!.querySelector('input')!;
const stepper = (el: UiNumberField, label: string) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

/** pointerdown that the component treats as the start of a press-and-hold. */
const press = (button: HTMLButtonElement) =>
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

describe('numeric helpers', () => {
  it('rounds without leaking float drift', () => {
    expect(roundToPrecision(2.3000000000000003, 1)).to.equal(2.3);
    expect(roundToPrecision(0.1 + 0.2, 2)).to.equal(0.3);
  });

  it('clamps after rounding, not before', () => {
    expect(commitValue(1.996, 0, 2, 2)).to.equal(2);
    expect(commitValue(150, 1, 99, 0)).to.equal(99);
    expect(commitValue(-5, 1, 99, 0)).to.equal(1);
  });

  it('parses empty and invalid text as null', () => {
    expect(parseValue('')).to.equal(null);
    expect(parseValue('abc')).to.equal(null);
    expect(parseValue('12')).to.equal(12);
  });

  it('formats to the configured precision', () => {
    expect(formatValue(null, 0)).to.equal('');
    expect(formatValue(2.5, 2)).to.equal('2.50');
  });

  it('re-rounds after each step so repeated ticks do not accumulate drift', () => {
    let value = 0.1;
    for (let i = 0; i < 3; i += 1) value = stepValue(value, 1, 0.1, 0, 10, 2);
    expect(value).to.equal(0.4);
  });
});

describe('UiNumberField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiNumberField>(html`<ui-number-field label="Qty"></ui-number-field>`);
    expect(el).to.not.equal(null);
  });

  it('renders an inner input with spinbutton semantics', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field min="1" max="99" .value=${12}></ui-number-field>`,
    );
    const field = input(el);
    expect(field.getAttribute('role')).to.equal('spinbutton');
    expect(field.getAttribute('aria-valuenow')).to.equal('12');
    expect(field.getAttribute('aria-valuemin')).to.equal('1');
    expect(field.getAttribute('aria-valuemax')).to.equal('99');
  });

  it('renders no steppers by default', async () => {
    const el = await fixture<UiNumberField>(html`<ui-number-field></ui-number-field>`);
    expect(el.shadowRoot!.querySelector('button')).to.equal(null);
  });

  it('renders both steppers when controls is inline', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline"></ui-number-field>`,
    );
    expect(stepper(el, 'Decrease')).to.not.equal(null);
    expect(stepper(el, 'Increase')).to.not.equal(null);
    expect(el.hasAttribute('has-leading-icon')).to.equal(true);
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('insets the steppers from the field edges', async () => {
    // Foundations tokens are not loaded in the test runner, so the token this
    // inset derives from is supplied inline — otherwise every length computes to 0.
    const el = await fixture<UiNumberField>(
      html`<ui-number-field
        controls="inline"
        style="--control-padding-inline: 16px"
      ></ui-number-field>`,
    );
    // all:unset on .stepper wipes the inset .icon--leading/--trailing provide,
    // so it is re-applied as margin — guard against that regressing to flush edges.
    const dec = getComputedStyle(stepper(el, 'Decrease')!);
    const inc = getComputedStyle(stepper(el, 'Increase')!);
    expect(dec.marginInlineStart).to.equal('16px');
    expect(inc.marginInlineEnd).to.equal('16px');
  });

  it('renders bare markup when label and hint are omitted', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline"></ui-number-field>`,
    );
    expect(el.shadowRoot!.querySelector('label')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
  });

  it('uses decimal inputmode only when precision allows decimals', async () => {
    const el = await fixture<UiNumberField>(html`<ui-number-field></ui-number-field>`);
    expect(input(el).getAttribute('inputmode')).to.equal('numeric');
    el.precision = 2;
    await el.updateComplete;
    expect(input(el).getAttribute('inputmode')).to.equal('decimal');
  });

  it('forces label placement to top when controls are inline', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field
        controls="inline"
        label-placement="floating"
        label="Qty"
      ></ui-number-field>`,
    );
    // A floating or inner label lives inside .field-wrapper; a top label does not.
    const label = el.shadowRoot!.querySelector('label')!;
    expect(label.closest('.field-wrapper')).to.equal(null);
  });

  it('does not round while typing, only on commit', async () => {
    const el = await fixture<UiNumberField>(html`<ui-number-field precision="2"></ui-number-field>`);
    const field = input(el);

    field.value = '1.';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(null);

    field.dispatchEvent(new Event('blur', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(1);
    expect(input(el).value).to.equal('1.00');
  });

  it('clamps to max on commit', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field min="1" max="99"></ui-number-field>`,
    );
    const field = input(el);
    field.value = '150';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(99);
  });

  it('fires ui-change on commit with the committed number', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field min="1" max="99"></ui-number-field>`,
    );
    let detail: unknown = undefined;
    el.addEventListener('ui-change', (e) => {
      detail = (e as CustomEvent).detail.value;
    });
    const field = input(el);
    field.value = '150';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    await el.updateComplete;
    expect(detail).to.equal(99);
  });

  it('steps with arrow keys', async () => {
    const el = await fixture<UiNumberField>(html`<ui-number-field .value=${5}></ui-number-field>`);
    input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(6);
    input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(5);
  });

  it('steps once per stepper press', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" .value=${5}></ui-number-field>`,
    );
    press(stepper(el, 'Increase')!);
    await el.updateComplete;
    expect(el.value).to.equal(6);
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });

  it('disables the stepper that would cross a bound', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" min="1" max="5" .value=${5}></ui-number-field>`,
    );
    expect(stepper(el, 'Increase')!.disabled).to.equal(true);
    expect(stepper(el, 'Decrease')!.disabled).to.equal(false);
  });

  it('disables both steppers when read-only', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" readonly .value=${5}></ui-number-field>`,
    );
    expect(stepper(el, 'Increase')!.disabled).to.equal(true);
    expect(stepper(el, 'Decrease')!.disabled).to.equal(true);
  });

  it('repeats while a stepper is held and stops on release', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" .value=${0}></ui-number-field>`,
    );
    const increase = stepper(el, 'Increase')!;

    press(increase);
    await el.updateComplete;
    expect(el.value).to.equal(1);

    // nothing repeats before the 500ms initial delay
    await aTimeout(400);
    expect(el.value).to.equal(1);

    await aTimeout(350); // 500ms delay elapsed + ~2-3 ticks at 100ms
    expect(el.value).to.be.greaterThan(1);

    increase.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    const settled = el.value;
    await aTimeout(300);
    expect(el.value).to.equal(settled);
  });

  it('stops repeating once the value reaches a bound', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" min="0" max="3" .value=${0}></ui-number-field>`,
    );
    const increase = stepper(el, 'Increase')!;
    press(increase);
    await aTimeout(500 + 100 * 8);
    expect(el.value).to.equal(3);
    increase.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });

  it('clears its hold timer when removed mid-hold', async () => {
    const el = await fixture<UiNumberField>(
      html`<ui-number-field controls="inline" .value=${0}></ui-number-field>`,
    );
    press(stepper(el, 'Increase')!);
    await el.updateComplete;
    const atRemoval = el.value;
    el.remove();
    await aTimeout(800);
    // a dangling interval would have kept incrementing after disconnect
    expect(el.value).to.equal(atRemoval);
  });

  it('participates in form submission under its name', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <ui-number-field name="qty" .value=${7}></ui-number-field>
      </form>`,
    );
    const el = form.querySelector<UiNumberField>('ui-number-field')!;
    await el.updateComplete;
    expect(new FormData(form).get('qty')).to.equal('7');
  });

  it('restores the initial value on form reset', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <ui-number-field name="qty" value="7"></ui-number-field>
      </form>`,
    );
    const el = form.querySelector<UiNumberField>('ui-number-field')!;
    el.value = 42;
    await el.updateComplete;
    form.reset();
    await el.updateComplete;
    expect(el.value).to.equal(7);
  });
});

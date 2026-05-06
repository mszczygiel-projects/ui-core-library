import { fixture, html, expect } from '@open-wc/testing';
import type { UiSearchInput } from './search-input.js';
import './search-input.js';

describe('UiSearchInput', () => {
  it('renders without error', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    expect(el).to.not.equal(null);
  });

  it('renders inner <input> element', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    expect(el.shadowRoot!.querySelector('input')).to.not.equal(null);
  });

  it('input type is search', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('search');
  });

  it('always has has-leading-icon attribute', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    await el.updateComplete;
    expect(el.hasAttribute('has-leading-icon')).to.equal(true);
  });

  it('always has has-trailing-icon attribute', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    await el.updateComplete;
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('clear button is hidden when value is empty', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    await el.updateComplete;
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    const style = window.getComputedStyle(clear);
    expect(style.visibility).to.equal('hidden');
  });

  it('clear button is visible when value is non-empty', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input value="test query"></ui-search-input>`,
    );
    await el.updateComplete;
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    const style = window.getComputedStyle(clear);
    expect(style.visibility).to.not.equal('hidden');
  });

  it('clear button has aria-label', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    expect(clear.getAttribute('aria-label')).to.equal('Clear search');
  });

  it('clear button has aria-hidden when value is empty', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    await el.updateComplete;
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    expect(clear.getAttribute('aria-hidden')).to.equal('true');
  });

  it('clear button has no aria-hidden when value is non-empty', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input value="query"></ui-search-input>`,
    );
    await el.updateComplete;
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    expect(clear.getAttribute('aria-hidden')).to.equal(null);
  });

  it('clicking clear button resets value to empty string', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input value="hello"></ui-search-input>`,
    );
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!.click();
    await el.updateComplete;
    expect(el.value).to.equal('');
  });

  it('clicking clear button dispatches ui-clear event', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input value="hello"></ui-search-input>`,
    );
    let fired = false;
    el.addEventListener('ui-clear', () => {
      fired = true;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!.click();
    expect(fired).to.equal(true);
  });

  it('clicking clear button dispatches ui-input with empty value', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input value="hello"></ui-search-input>`,
    );
    let detail: { value: string } | null = null;
    el.addEventListener('ui-input', (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!.click();
    expect(detail).to.not.equal(null);
    expect(detail!.value).to.equal('');
  });

  it('dispatches ui-input on typing', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    let fired = false;
    el.addEventListener('ui-input', () => {
      fired = true;
    });
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fired).to.equal(true);
  });

  it('dispatches ui-input with correct value on typing', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    let detail: { value: string } | null = null;
    el.addEventListener('ui-input', (e) => {
      detail = (e as CustomEvent).detail;
    });
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(detail!.value).to.equal('hello');
  });

  it('clear button is disabled when state=disabled', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input state="disabled" value="test"></ui-search-input>`,
    );
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    expect(clear.disabled).to.equal(true);
  });

  it('clear button is disabled when disabled attribute is set', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input disabled value="test"></ui-search-input>`,
    );
    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('button.clear')!;
    expect(clear.disabled).to.equal(true);
  });

  it('placeholder defaults to Search...', async () => {
    const el = await fixture<UiSearchInput>(html`<ui-search-input></ui-search-input>`);
    expect(el.shadowRoot!.querySelector('input')!.placeholder).to.equal('Search...');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input data-size="small"></ui-search-input>`,
    );
    expect(el.size).to.equal('small');
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiSearchInput>(
      html`<ui-search-input state="error"></ui-search-input>`,
    );
    expect(el.getAttribute('state')).to.equal('error');
  });
});

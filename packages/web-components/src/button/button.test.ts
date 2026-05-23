import { fixture, html, expect } from '@open-wc/testing';
import type { UiButton } from './button.js';
import './button.js';

describe('UiButton', () => {
  it('renders inner <button> element', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')).to.not.equal(null);
  });

  it('has type="button" on inner <button> by default', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.type).to.equal('button');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiButton>(html`<ui-button variant="secondary">Click</ui-button>`);
    expect(el.getAttribute('variant')).to.equal('secondary');
  });

  it('defaults variant to primary', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.variant).to.equal('primary');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiButton>(html`<ui-button></ui-button>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('disabled prop disables inner <button>', async () => {
    const el = await fixture<UiButton>(html`<ui-button disabled>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.disabled).to.equal(true);
  });

  it('loading prop disables inner <button> and sets aria-busy', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.disabled).to.equal(true);
    expect(btn.getAttribute('aria-busy')).to.equal('true');
  });

  it('loading prop reflects on host', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    expect(el.hasAttribute('loading')).to.equal(true);
  });

  it('loading renders ui-loader and hides icon slots', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.equal(null);
  });

  it('non-loading renders icon slots', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.equal(null);
  });

  it('label prop sets aria-label on inner <button>', async () => {
    const el = await fixture<UiButton>(html`<ui-button label="Delete item">Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).to.equal(
      'Delete item',
    );
  });

  it('default slot projects label text', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save changes</ui-button>`);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');
    expect(slot).to.not.equal(null);
    expect(slot!.assignedNodes()[0].textContent).to.equal('Save changes');
  });

  it('icon-left slot projects content', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button><span slot="icon-left">★</span>Click</ui-button>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon-left"]');
    expect(slot!.assignedElements()[0].textContent).to.equal('★');
  });

  it('submits name and value with form submit', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-button type="submit" name="action" value="accept">Accept</ui-button>
      </form>
    `);
    const el = form.querySelector<UiButton>('ui-button')!;
    const innerButton = el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;

    let submittedValue: FormDataEntryValue | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submittedValue = new FormData(form).get('action');
    });

    innerButton.click();
    await el.updateComplete;

    expect(submittedValue).to.equal('accept');
  });

  it('renders leading icon box and separator when has-leading-icon is set', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon> <span slot="leading-icon">★</span>Click </ui-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box--leading')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')).to.not.equal(null);
  });

  it('renders trailing icon box and separator when has-trailing-icon is set', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-trailing-icon> <span slot="trailing-icon">★</span>Click </ui-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box--trailing')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')).to.not.equal(null);
  });

  it('renders two separators when both icon boxes are set', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon has-trailing-icon>
        <span slot="leading-icon">★</span>
        <span slot="trailing-icon">→</span>
        Click
      </ui-button>`,
    );
    expect(el.shadowRoot!.querySelectorAll('.separator')).to.have.length(2);
  });

  it('does not add split class without split-leading attribute', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon><span slot="leading-icon">★</span>Click</ui-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box--split')).to.equal(null);
  });

  it('adds split class and role=button when split-leading is set', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon split-leading>
        <span slot="leading-icon">★</span>Click
      </ui-button>`,
    );
    const box = el.shadowRoot!.querySelector('.icon-box--leading');
    expect(box?.classList.contains('icon-box--split')).to.equal(true);
    expect(box?.getAttribute('role')).to.equal('button');
    expect(box?.getAttribute('tabindex')).to.equal('0');
  });

  it('dispatches leading-icon-click and stops propagation when split leading is clicked', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon split-leading>
        <span slot="leading-icon">★</span>Click
      </ui-button>`,
    );
    const box = el.shadowRoot!.querySelector('.icon-box--leading')!;

    let leadingFired = false;
    let buttonClicked = false;

    el.addEventListener('leading-icon-click', () => {
      leadingFired = true;
    });
    el.shadowRoot!.querySelector('button')!.addEventListener('click', () => {
      buttonClicked = true;
    });

    (box as HTMLElement).click();
    await el.updateComplete;

    expect(leadingFired).to.equal(true);
    expect(buttonClicked).to.equal(false);
  });

  it('dispatches trailing-icon-click when split trailing is clicked', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-trailing-icon split-trailing>
        <span slot="trailing-icon">→</span>Click
      </ui-button>`,
    );
    const box = el.shadowRoot!.querySelector('.icon-box--trailing')!;

    let trailingFired = false;
    el.addEventListener('trailing-icon-click', () => {
      trailingFired = true;
    });

    (box as HTMLElement).click();
    await el.updateComplete;

    expect(trailingFired).to.equal(true);
  });

  it('split mode disabled when button is disabled — no role/tabIndex on icon box', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button has-leading-icon split-leading disabled>
        <span slot="leading-icon">★</span>Click
      </ui-button>`,
    );
    const box = el.shadowRoot!.querySelector('.icon-box--leading');
    expect(box?.getAttribute('role')).to.equal(null);
    expect(box?.getAttribute('tabindex')).to.equal(null);
  });
});

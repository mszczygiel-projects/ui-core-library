import { fixture, html, expect } from '@open-wc/testing';
import type { UiLinkButton } from './link-button.js';
import './link-button.js';

describe('UiLinkButton', () => {
  it('renders inner <a> element', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')).to.not.equal(null);
  });

  it('renders no <button> element', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('button')).to.equal(null);
  });

  it('sets href on inner <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('href')).to.equal('/page');
  });

  it('does not set disabled HTML attribute on <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" disabled>Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')!.hasAttribute('disabled')).to.equal(false);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" variant="secondary">Click</ui-link-button>`,
    );
    expect(el.getAttribute('variant')).to.equal('secondary');
  });

  it('defaults variant to primary', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.variant).to.equal('primary');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiLinkButton>(html`<ui-link-button href="/page"></ui-link-button>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('disabled sets aria-disabled and tabindex on inner <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" disabled>Click</ui-link-button>`,
    );
    const a = el.shadowRoot!.querySelector('a')!;
    expect(a.getAttribute('aria-disabled')).to.equal('true');
    expect(a.getAttribute('tabindex')).to.equal('-1');
  });

  it('loading sets aria-disabled, aria-busy and tabindex on inner <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" loading>Click</ui-link-button>`,
    );
    const a = el.shadowRoot!.querySelector('a')!;
    expect(a.getAttribute('aria-disabled')).to.equal('true');
    expect(a.getAttribute('aria-busy')).to.equal('true');
    expect(a.getAttribute('tabindex')).to.equal('-1');
  });

  it('loading reflects on host', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" loading>Click</ui-link-button>`,
    );
    expect(el.hasAttribute('loading')).to.equal(true);
  });

  it('loading renders ui-loader and hides icon slots', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" loading>Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('ui-loader')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.equal(null);
  });

  it('non-loading renders icon slots', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.equal(null);
  });

  it('label prop sets aria-label on inner <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" label="Go to page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('aria-label')).to.equal('Go to page');
  });

  it('target="_blank" without rel sets noopener noreferrer', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="https://example.com" target="_blank">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('rel')).to.equal('noopener noreferrer');
  });

  it('target="_blank" with explicit rel uses provided rel', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="https://example.com" target="_blank" rel="noopener"
        >Click</ui-link-button
      >`,
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('rel')).to.equal('noopener');
  });

  it('no rel attribute when target is not _blank', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('a')!.hasAttribute('rel')).to.equal(false);
  });

  it('default slot projects label text', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Go to dashboard</ui-link-button>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');
    expect(slot).to.not.equal(null);
    expect(slot!.assignedNodes()[0].textContent).to.equal('Go to dashboard');
  });

  it('icon-left slot projects content', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page"><span slot="icon-left">★</span>Click</ui-link-button>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon-left"]');
    expect(slot!.assignedElements()[0].textContent).to.equal('★');
  });

  it('renders leading icon box and separator when has-leading-icon is set', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" has-leading-icon>
        <span slot="leading-icon">★</span>Click
      </ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box--leading')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')).to.not.equal(null);
  });

  it('renders trailing icon box and separator when has-trailing-icon is set', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" has-trailing-icon>
        <span slot="trailing-icon">→</span>Click
      </ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box--trailing')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')).to.not.equal(null);
  });

  it('renders two separators when both icon boxes are set', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" has-leading-icon has-trailing-icon>
        <span slot="leading-icon">★</span>
        <span slot="trailing-icon">→</span>
        Click
      </ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelectorAll('.separator')).to.have.length(2);
  });

  it('does not render icon boxes when neither attribute is set', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    expect(el.shadowRoot!.querySelector('.icon-box')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')).to.equal(null);
  });

  it('icon boxes have no role or tabindex — no split mode on LinkButton', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page" has-leading-icon has-trailing-icon>
        <span slot="leading-icon">★</span>
        <span slot="trailing-icon">→</span>
        Click
      </ui-link-button>`,
    );
    const boxes = el.shadowRoot!.querySelectorAll('.icon-box');
    boxes.forEach((box) => {
      expect(box.getAttribute('role')).to.equal(null);
      expect(box.getAttribute('tabindex')).to.equal(null);
    });
  });

  it('content wrapper is rendered inside <a>', async () => {
    const el = await fixture<UiLinkButton>(
      html`<ui-link-button href="/page">Click</ui-link-button>`,
    );
    const a = el.shadowRoot!.querySelector('a')!;
    expect(a.querySelector('.content')).to.not.equal(null);
  });
});

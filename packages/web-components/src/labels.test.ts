import { fixture, html, expect } from '@open-wc/testing';
import { configureUiCore, resetUiCoreLabels } from '@mszczygiel-projects/ui-core-foundations';
import type { UiChip } from './chip/chip.js';
import type { UiDialog } from './dialog/dialog.js';
import type { UiPagination } from './pagination/pagination.js';
import type { UiCalendar } from './calendar/calendar.js';
import './chip/chip.js';
import './dialog/dialog.js';
import './pagination/pagination.js';
import './calendar/calendar.js';

/** Accessible name of the first element matching `selector` inside the shadow root. */
function ariaLabelOf(host: HTMLElement, selector: string): string | null {
  const el = host.shadowRoot?.querySelector(selector) ?? null;
  return el?.getAttribute('aria-label') ?? null;
}

describe('i18n labels', () => {
  afterEach(() => {
    resetUiCoreLabels();
  });

  describe('default English fallback', () => {
    it('renders a static label from the built-in defaults', async () => {
      const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
      expect(ariaLabelOf(el, '.dismiss')).to.equal('Remove');
    });

    it('renders a dynamic label from the built-in defaults', async () => {
      const el = await fixture<UiPagination>(
        html`<ui-pagination current-page="2" total-pages="3"></ui-pagination>`,
      );
      const current = el.shadowRoot?.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).to.equal('Page 2');
    });
  });

  describe('configureUiCore overrides globally', () => {
    it('overrides a static label', async () => {
      configureUiCore({ labels: { chip: { dismiss: 'Usuń' } } });
      const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
      expect(ariaLabelOf(el, '.dismiss')).to.equal('Usuń');
    });

    it('overrides a dynamic label', async () => {
      configureUiCore({ labels: { pagination: { item: (page) => `Strona ${page}` } } });
      const el = await fixture<UiPagination>(
        html`<ui-pagination current-page="2" total-pages="3"></ui-pagination>`,
      );
      const current = el.shadowRoot?.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).to.equal('Strona 2');
    });

    it('reaches a nested component through its own config lookup', async () => {
      configureUiCore({ labels: { dialog: { close: 'Zamknij' } } });
      const el = await fixture<UiDialog>(
        html`<ui-dialog open><span slot="title">T</span></ui-dialog>`,
      );
      const close = el.shadowRoot?.querySelector('.close');
      expect(close?.getAttribute('label')).to.equal('Zamknij');
    });
  });

  describe('per-instance prop wins over the global config', () => {
    it('beats an overridden static label', async () => {
      configureUiCore({ labels: { chip: { dismiss: 'Usuń' } } });
      const el = await fixture<UiChip>(
        html`<ui-chip dismissible dismiss-label="Odepnij">Filter</ui-chip>`,
      );
      expect(ariaLabelOf(el, '.dismiss')).to.equal('Odepnij');
    });

    it('beats an overridden dynamic label', async () => {
      configureUiCore({ labels: { pagination: { item: (page) => `Strona ${page}` } } });
      const el = await fixture<UiPagination>(
        html`<ui-pagination current-page="2" total-pages="3"></ui-pagination>`,
      );
      el.itemAriaLabel = (page) => `Karta ${page}`;
      await el.updateComplete;
      const current = el.shadowRoot?.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).to.equal('Karta 2');
    });

    it('carries the visible heading into an overridden calendar label', async () => {
      configureUiCore({
        labels: { calendar: { chooseMonth: (m) => `${m} — wybierz miesiąc` } },
      });
      const el = await fixture<UiCalendar>(
        html`<ui-calendar start-date="2026-07-15" locale="en-US"></ui-calendar>`,
      );
      expect(ariaLabelOf(el, '.zoom')).to.equal('July 2026 — wybierz miesiąc');

      el.chooseMonthLabel = (m) => `${m} (miesiąc)`;
      await el.updateComplete;
      expect(ariaLabelOf(el, '.zoom')).to.equal('July 2026 (miesiąc)');
    });
  });
});

describe('locale', () => {
  afterEach(() => {
    configureUiCore({ locale: '' });
  });

  /** Accessible names of the day buttons — Intl-formatted, so they reveal the locale in use. */
  const dayLabels = (el: HTMLElement) =>
    Array.from(el.shadowRoot?.querySelectorAll('[role="gridcell"] button') ?? []).map(
      (b) => b.getAttribute('aria-label') ?? '',
    );

  it('formats dates with the configured locale', async () => {
    configureUiCore({ locale: 'pl-PL' });
    const el = await fixture<UiCalendar>(html`<ui-calendar start-date="2026-07-15"></ui-calendar>`);
    expect(dayLabels(el).some((l) => l.includes('lipca'))).to.equal(true);
  });

  it('a component property beats the configured locale', async () => {
    configureUiCore({ locale: 'pl-PL' });
    const el = await fixture<UiCalendar>(
      html`<ui-calendar start-date="2026-07-15" locale="en-US"></ui-calendar>`,
    );
    expect(dayLabels(el).some((l) => l.includes('July'))).to.equal(true);
  });

  it('an unset config locale leaves the runtime locale in charge', async () => {
    const el = await fixture<UiCalendar>(html`<ui-calendar start-date="2026-07-15"></ui-calendar>`);
    expect(dayLabels(el).some((l) => l.length > 0)).to.equal(true);
  });
});

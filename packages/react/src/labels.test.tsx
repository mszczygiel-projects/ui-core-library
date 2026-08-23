import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { configureUiCore, resetUiCoreLabels } from '@mszczygiel-projects/ui-core-foundations';
import { Chip } from './Chip/Chip.js';
import { Pagination } from './Pagination/Pagination.js';
import { Listbox } from './Listbox/Listbox.js';
import { Calendar } from './Calendar/Calendar.js';

afterEach(() => {
  cleanup();
  resetUiCoreLabels();
  configureUiCore({ locale: '' });
});

const noop = () => {};

describe('i18n labels', () => {
  describe('default English fallback', () => {
    it('renders a static label from the built-in defaults', () => {
      const { container } = render(<Chip dismissible>Filter</Chip>);
      expect(container.querySelector('[aria-label="Remove"]')).not.toBeNull();
    });

    it('renders a dynamic label from the built-in defaults', () => {
      const { container } = render(<Pagination currentPage={2} totalPages={3} onChange={noop} />);
      const current = container.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).toBe('Page 2');
    });

    it('renders an empty-state message from the built-in defaults', () => {
      const { container } = render(<Listbox idPrefix="l" items={[]} value={undefined} />);
      expect(container.textContent).toContain('No results found');
    });
  });

  describe('configureUiCore overrides globally', () => {
    it('overrides a static label', () => {
      configureUiCore({ labels: { chip: { dismiss: 'Usuń' } } });
      const { container } = render(<Chip dismissible>Filter</Chip>);
      expect(container.querySelector('[aria-label="Usuń"]')).not.toBeNull();
    });

    it('overrides a dynamic label', () => {
      configureUiCore({ labels: { pagination: { item: (page) => `Strona ${page}` } } });
      const { container } = render(<Pagination currentPage={2} totalPages={3} onChange={noop} />);
      const current = container.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).toBe('Strona 2');
    });

    it('reaches a nested component through its own config lookup', () => {
      configureUiCore({ labels: { listbox: { empty: 'Brak wyników' } } });
      const { container } = render(<Listbox idPrefix="l" items={[]} value={undefined} />);
      expect(container.textContent).toContain('Brak wyników');
    });
  });

  describe('per-instance prop wins over the global config', () => {
    it('beats an overridden static label', () => {
      configureUiCore({ labels: { chip: { dismiss: 'Usuń' } } });
      const { container } = render(
        <Chip dismissible dismissLabel="Odepnij">
          Filter
        </Chip>,
      );
      expect(container.querySelector('[aria-label="Odepnij"]')).not.toBeNull();
    });

    it('beats an overridden dynamic label', () => {
      configureUiCore({ labels: { pagination: { item: (page) => `Strona ${page}` } } });
      const { container } = render(
        <Pagination
          currentPage={2}
          totalPages={3}
          onChange={noop}
          getItemAriaLabel={(page) => `Karta ${page}`}
        />,
      );
      const current = container.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('aria-label')).toBe('Karta 2');
    });

    it('carries the visible heading into an overridden calendar label', () => {
      configureUiCore({
        labels: { calendar: { chooseMonth: (m) => `${m} — wybierz miesiąc` } },
      });
      const globalOnly = render(<Calendar startDate="2026-07-15" locale="en-US" />);
      expect(
        globalOnly.container.querySelector('.ui-calendar__zoom')!.getAttribute('aria-label'),
      ).toBe('July 2026 — wybierz miesiąc');
      cleanup();

      const { container } = render(
        <Calendar
          startDate="2026-07-15"
          locale="en-US"
          chooseMonthLabel={(m) => `${m} (miesiąc)`}
        />,
      );
      expect(container.querySelector('.ui-calendar__zoom')!.getAttribute('aria-label')).toBe(
        'July 2026 (miesiąc)',
      );
    });
  });
});

describe('locale', () => {
  /** Accessible name of a day button — Intl-formatted, so it reveals the locale in use. */
  const dayLabels = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[role="gridcell"] button')).map(
      (b) => b.getAttribute('aria-label') ?? '',
    );

  it('formats dates with the configured locale', () => {
    configureUiCore({ locale: 'pl-PL' });
    const { container } = render(<Calendar startDate="2026-07-15" />);
    expect(dayLabels(container).some((l) => l.includes('lipca'))).toBe(true);
  });

  it('a component prop beats the configured locale', () => {
    configureUiCore({ locale: 'pl-PL' });
    const { container } = render(<Calendar startDate="2026-07-15" locale="en-US" />);
    expect(dayLabels(container).some((l) => l.includes('July'))).toBe(true);
  });

  it('an unset config locale leaves the runtime locale in charge', () => {
    const { container } = render(<Calendar startDate="2026-07-15" />);
    // jsdom reports en-US; the point is that the empty config did not take over.
    expect(dayLabels(container).some((l) => l.includes('July'))).toBe(true);
  });
});

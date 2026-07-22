import { afterEach, describe, expect, it } from 'vitest';
import { configureUiCore, getUiCoreConfig, resetUiCoreLabels } from './config.js';

afterEach(() => {
  resetUiCoreLabels();
});

describe('locale', () => {
  it('defaults to empty so components fall through to the runtime locale', () => {
    expect(getUiCoreConfig().locale).toBe('');
  });
});

describe('labels', () => {
  it('falls back to the built-in English defaults', () => {
    const { labels } = getUiCoreConfig();

    expect(labels.dialog.close).toBe('Close dialog');
    expect(labels.listbox.empty).toBe('No results found');
    expect(labels.pagination.item(3)).toBe('Page 3');
    expect(labels.combobox.removeChip('Poland')).toBe('Remove Poland');
  });

  it('overrides a static leaf globally', () => {
    configureUiCore({ labels: { dialog: { close: 'Zamknij okno' } } });

    expect(getUiCoreConfig().labels.dialog.close).toBe('Zamknij okno');
  });

  it('overrides a dynamic leaf globally', () => {
    configureUiCore({
      labels: {
        pagination: { item: (page) => `Strona ${page}` },
        combobox: { removeChip: (option) => `Usuń ${option}` },
      },
    });

    const { labels } = getUiCoreConfig();
    expect(labels.pagination.item(7)).toBe('Strona 7');
    expect(labels.combobox.removeChip('Polska')).toBe('Usuń Polska');
  });

  it('merges per leaf — untouched siblings keep their defaults', () => {
    configureUiCore({ labels: { listbox: { empty: 'Brak wyników' } } });

    const { labels } = getUiCoreConfig();
    expect(labels.listbox.empty).toBe('Brak wyników');
    expect(labels.listbox.create).toBe('Create');
    expect(labels.listbox.loading).toBe('Loading...');
    // A different group is untouched entirely.
    expect(labels.dialog.close).toBe('Close dialog');
  });

  it('accumulates across successive calls', () => {
    configureUiCore({ labels: { listbox: { empty: 'Brak wyników' } } });
    configureUiCore({ labels: { listbox: { create: 'Utwórz' } } });

    const { labels } = getUiCoreConfig();
    expect(labels.listbox.empty).toBe('Brak wyników');
    expect(labels.listbox.create).toBe('Utwórz');
  });

  it('leaves non-label config untouched when only labels are passed', () => {
    configureUiCore({ locale: 'pl' });
    configureUiCore({ labels: { dialog: { close: 'Zamknij' } } });

    const config = getUiCoreConfig();
    expect(config.locale).toBe('pl');
    expect(config.loaderVariant).toBe('spinner');

    configureUiCore({ locale: '' });
  });

  it('does not mutate the defaults through a returned config object', () => {
    configureUiCore({ labels: { dialog: { close: 'Zamknij' } } });
    resetUiCoreLabels();

    expect(getUiCoreConfig().labels.dialog.close).toBe('Close dialog');
  });
});

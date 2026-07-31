export type LoaderVariant = 'spinner';

/**
 * Every UI string the components can render on their own.
 *
 * A leaf is a plain `string` when the label is fully static, and a function
 * when the label embeds a variable (a count, a user's query, an option name).
 * Components never assemble a sentence out of fragments — a language whose
 * word order differs from English has to be able to rewrite the whole string.
 *
 * Formatting of *data* (dates, numbers, plurals) is deliberately absent here.
 * The library takes pre-formatted strings or formatter callbacks; it never
 * embeds `Intl` logic for UI copy of its own.
 */
export interface UiCoreLabels {
  loader: {
    /** Accessible name of a standalone spinner. */
    loading: string;
  };
  button: {
    /** Accessible name of the spinner shown while a button is loading. */
    loading: string;
  };
  /** Shared by every listbox surface — SelectField, Combobox, and inline lists. */
  listbox: {
    /** Message shown when no option matches. */
    empty: string;
    /** Message shown while options are still arriving. */
    loading: string;
    /**
     * Prefix of the "create new option" row. The component appends the quoted
     * query itself, so this stays a static string.
     */
    create: string;
  };
  selectField: {
    /** Accessible name of the clear button. */
    clear: string;
  };
  combobox: {
    /** Accessible name of the clear button. */
    clear: string;
    /** Accessible name of a selected chip's dismiss button, in `multiple` mode. */
    removeChip: (optionLabel: string) => string;
  };
  searchField: {
    /** Accessible name of the clear button. */
    clear: string;
  };
  passwordField: {
    /** Accessible name of the visibility toggle while the password is hidden. */
    show: string;
    /** Accessible name of the visibility toggle while the password is visible. */
    hide: string;
  };
  numberField: {
    /** Accessible name of the decrement stepper. */
    decrement: string;
    /** Accessible name of the increment stepper. */
    increment: string;
  };
  pagination: {
    /** Accessible name of the root `<nav>`. */
    label: string;
    /** Accessible name of the previous-page button. */
    previousPage: string;
    /** Accessible name of the next-page button. */
    nextPage: string;
    /** Visible caption and accessible name of the jump-to-page field. */
    jumpToPage: string;
    /** Accessible name of a page item. */
    item: (page: number) => string;
  };
  breadcrumbs: {
    /** Accessible name of the root `<nav>`. */
    label: string;
  };
  chip: {
    /** Accessible name of the dismiss button. */
    dismiss: string;
  };
  notification: {
    /** Accessible name of the close button. */
    close: string;
  };
  dialog: {
    /** Accessible name of the close button. */
    close: string;
  };
  drawer: {
    /** Accessible name of the close button. */
    close: string;
  };
  calendar: {
    /** Accessible name of the previous-month button. */
    previousMonth: string;
    /** Accessible name of the next-month button. */
    nextMonth: string;
  };
  datePicker: {
    /** Label of the Apply button (range mode). */
    apply: string;
    /** Label of the Clear button (range mode). */
    clear: string;
  };
  dateField: {
    /** Accessible name of the calendar toggle button. */
    openCalendar: string;
  };
  fileInput: {
    /** Default prompt inside the drop zone, shown when no file is selected. */
    browse: string;
    /** Label of the button that swaps the currently selected file. */
    replace: string;
    /** Accessible name of a file's remove button. */
    remove: (fileName: string) => string;
  };
}

/** A partial `UiCoreLabels` — every group and every leaf is independently optional. */
export type UiCoreLabelsOverrides = {
  [Group in keyof UiCoreLabels]?: Partial<UiCoreLabels[Group]>;
};

/**
 * English fallbacks. A consumer shipping one language never has to touch these;
 * a consumer with an i18n stack replaces only the leaves it cares about.
 */
export const defaultLabels: UiCoreLabels = {
  loader: {
    loading: 'Loading',
  },
  button: {
    loading: 'Loading',
  },
  listbox: {
    empty: 'No results found',
    loading: 'Loading...',
    create: 'Create',
  },
  selectField: {
    clear: 'Clear selection',
  },
  combobox: {
    clear: 'Clear selection',
    removeChip: (optionLabel) => `Remove ${optionLabel}`,
  },
  searchField: {
    clear: 'Clear search',
  },
  passwordField: {
    show: 'Show password',
    hide: 'Hide password',
  },
  numberField: {
    decrement: 'Decrease',
    increment: 'Increase',
  },
  pagination: {
    label: 'Pagination',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    jumpToPage: 'Go to page',
    item: (page) => `Page ${page}`,
  },
  breadcrumbs: {
    label: 'Breadcrumb',
  },
  chip: {
    dismiss: 'Remove',
  },
  notification: {
    close: 'Close notification',
  },
  dialog: {
    close: 'Close dialog',
  },
  drawer: {
    close: 'Close drawer',
  },
  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  datePicker: {
    apply: 'Apply',
    clear: 'Clear',
  },
  dateField: {
    openCalendar: 'Open calendar',
  },
  fileInput: {
    browse: 'Drag & drop or browse',
    replace: 'Replace',
    remove: (fileName) => `Remove ${fileName}`,
  },
};

export interface UiCoreConfig {
  loaderVariant: LoaderVariant;

  /**
   * BCP 47 tag used to format the dates a component owns — Calendar grid cells,
   * DateField display and parsing. Sits between a component's own `locale` prop
   * and the runtime locale; empty means "fall through to `navigator.language`".
   *
   * This is about formatting *data*, not UI copy. Translated text comes from
   * `labels` below, never from this tag.
   */
  locale: string; // '' | 'en' | 'pl-PL' | …

  /**
   * Every UI string the components render on their own, always fully resolved:
   * whatever the consumer passed to `configureUiCore` merged over the English
   * defaults, so reading a leaf never needs a fallback.
   */
  labels: UiCoreLabels;
}

/** What `configureUiCore` accepts — `Partial<UiCoreConfig>`, except `labels` merges per leaf. */
export interface UiCoreConfigOverrides extends Partial<Omit<UiCoreConfig, 'labels'>> {
  labels?: UiCoreLabelsOverrides;
}

/**
 * The label tree is exactly two levels deep, so iterating it generically loses
 * the key/value correlation TypeScript needs. These helpers do the structural
 * work behind one narrow cast; every public signature stays strict.
 */
type LabelGroups = Record<string, Record<string, unknown>>;

function cloneLabels(source: UiCoreLabels): UiCoreLabels {
  const groups = source as unknown as LabelGroups;
  const clone: LabelGroups = {};
  for (const group of Object.keys(groups)) {
    clone[group] = { ...groups[group] };
  }
  return clone as unknown as UiCoreLabels;
}

const config: UiCoreConfig = {
  loaderVariant: 'spinner',
  // Empty, not 'en': an unset locale must fall through to the runtime locale,
  // which is what the date components did before this config was wired in.
  locale: '',
  labels: cloneLabels(defaultLabels),
};

export function configureUiCore(overrides: UiCoreConfigOverrides): void {
  const { labels, ...rest } = overrides;
  Object.assign(config, rest);

  if (!labels) return;

  // Merge per group, so overriding one leaf never drops its siblings.
  const groups = config.labels as unknown as LabelGroups;
  for (const [group, leaves] of Object.entries(labels)) {
    if (!leaves) continue;
    groups[group] = { ...groups[group], ...leaves };
  }
}

export function getUiCoreConfig(): Readonly<UiCoreConfig> {
  return config;
}

/** Restores the built-in English labels. Intended for tests. */
export function resetUiCoreLabels(): void {
  config.labels = cloneLabels(defaultLabels);
}

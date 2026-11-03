/**
 * The configuration that every component on a page reads: the texts the components render on
 * their own and the look of their loaders. The web component and React packages, and two copies
 * of one package, share it, so its state lives under a global symbol. That state holds only what
 * the application set; each copy merges it over its own defaults, so a newer copy still finds
 * every label its components need.
 */

/** The look of every loader: the Loader component and the loading state of other components. */
export type LoaderVariant = 'spinner';

/** The looks of loaders that this version of the library draws. */
export const loaderVariants: readonly LoaderVariant[] = ['spinner'];

/** Data for a whole validation sentence; each field specifies its own reason vocabulary. */
export interface FieldValidationContext {
  readonly reason: string;
  readonly locale: string;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly step?: number;
  readonly precision?: number;
}

/**
 * Every text that a component renders on its own, grouped by component. A label that holds a
 * value is a function of that value, so that a whole sentence is translated at once.
 */
export interface UiCoreLabels {
  readonly numberField: {
    /** The name of the decrement button. */
    readonly decrement: string;
    /** The name of the increment button. */
    readonly increment: string;
    /** A complete sentence describing the failed constraint. */
    readonly validationMessage: (context: FieldValidationContext) => string;
  };
  readonly dateField: {
    /** A complete sentence describing the expected display format. */
    readonly formatHint: (example: string) => string;
    /** A complete sentence describing the failed constraint. */
    readonly validationMessage: (context: FieldValidationContext) => string;
  };
  readonly breadcrumbs: {
    /** The accessible name of the navigation of a trail. */
    readonly label: string;
  };
  readonly button: {
    /** The description of a button while its action is in progress. */
    readonly loading: string;
  };
  readonly chip: {
    /** The word that names the dismiss button of a chip, read before the text of the chip. */
    readonly dismiss: string;
  };
  readonly combobox: {
    /** The name of the button that clears the chosen options and the query. */
    readonly clear: string;
    /** The text of the option that creates one from the query, as a whole phrase. */
    readonly create: (query: string) => string;
  };
  readonly dialog: {
    /** The name of the button that closes a dialog. */
    readonly close: string;
  };
  readonly drawer: {
    /** The name of the button that closes a drawer. */
    readonly close: string;
  };
  readonly fileInputField: {
    /** The text of the zone that takes files from a dialog or a drop. */
    readonly prompt: string;
    /** The text of the button that replaces a previewed image. */
    readonly replace: string;
    /** The name of the button that removes a file, as a whole phrase. */
    readonly remove: (fileName: string) => string;
  };
  readonly iconButton: {
    /** The description of an icon button while its action is in progress. */
    readonly loading: string;
  };
  readonly listbox: {
    /** The message of a list without options. */
    readonly empty: string;
    /** The message of a list while its options load. */
    readonly loading: string;
  };
  readonly loader: {
    /** The accessible name of a loader that has no `label` of its own. */
    readonly label: string;
  };
  readonly notification: {
    /** The word that names the dismiss button of a notification, read before its heading. */
    readonly dismiss: string;
  };
  readonly pagination: {
    /** The accessible name of the navigation between pages. */
    readonly label: string;
    /** The name of the button that moves to the previous page. */
    readonly previous: string;
    /** The name of the button that moves to the next page. */
    readonly next: string;
    /** The name of the button of a page, as a whole phrase. */
    readonly page: (page: number) => string;
    /** The status text, as a whole sentence. */
    readonly status: (page: number, pageCount: number) => string;
    /** The label of the field that moves to a typed page. */
    readonly jump: string;
    /** The text after the jump field in a narrow container. */
    readonly total: (pageCount: number) => string;
  };
  readonly passwordField: {
    /** The name of the button that shows the password as plain text, whatever its state. */
    readonly reveal: string;
  };
  readonly searchField: {
    /** The name of the button that clears the query. */
    readonly clear: string;
  };
  readonly selectField: {
    /** The name of the button that clears the chosen option. */
    readonly clear: string;
  };
}

/** The configuration as components read it: always complete. */
export interface UiCoreConfig {
  /** The preferred locale; a field's locale prop takes precedence. */
  readonly locale?: string;
  readonly labels: UiCoreLabels;
  readonly loaderVariant: LoaderVariant;
}

/** What {@link configureUiCore} takes: any group of labels and any label in it, alone. */
export interface UiCoreConfigInput {
  /** BCP 47 locale used before the browser language. Reset clears it. */
  readonly locale?: string;
  readonly labels?: {
    readonly [Group in keyof UiCoreLabels]?: Partial<UiCoreLabels[Group]>;
  };
  readonly loaderVariant?: LoaderVariant;
}

/** The English labels that the packages ship. */
export const defaultLabels: UiCoreLabels = freezeLabels({
  numberField: {
    decrement: 'Decrease value',
    increment: 'Increase value',
    validationMessage: ({ reason, min, max, step, precision }) => {
      switch (reason) {
        case 'min':
          return `Enter a number greater than or equal to ${String(min)}.`;
        case 'max':
          return `Enter a number less than or equal to ${String(max)}.`;
        case 'step':
          return `Enter a number in steps of ${String(step ?? 1)} from ${String(min ?? 0)}.`;
        case 'precision':
          return `Enter a number with at most ${String(precision)} decimal places.`;
        case 'incomplete':
          return 'Complete the number.';
        case 'constraints':
          return 'The number limits are inconsistent.';
        default:
          return 'Enter a valid number.';
      }
    },
  },
  dateField: {
    formatHint: (example) => `Use the format ${example}.`,
    validationMessage: ({ reason, min, max }) => {
      switch (reason) {
        case 'min':
          return `Enter a date on or after ${String(min)}.`;
        case 'max':
          return `Enter a date on or before ${String(max)}.`;
        case 'disabled':
          return 'This date is unavailable.';
        case 'incomplete':
          return 'Complete the date.';
        case 'constraints':
          return 'The date limits are inconsistent.';
        default:
          return 'Enter a valid date.';
      }
    },
  },
  breadcrumbs: { label: 'Breadcrumb' },
  button: { loading: 'Loading' },
  chip: { dismiss: 'Remove' },
  combobox: { clear: 'Clear', create: (query) => `Create “${query}”` },
  dialog: { close: 'Close' },
  drawer: { close: 'Close' },
  fileInputField: {
    prompt: 'Drag files here or browse',
    replace: 'Replace',
    remove: (fileName) => `Remove ${fileName}`,
  },
  iconButton: { loading: 'Loading' },
  listbox: { empty: 'No options', loading: 'Loading options' },
  loader: { label: 'Loading' },
  notification: { dismiss: 'Dismiss' },
  pagination: {
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (page) => `Page ${String(page)}`,
    status: (page, pageCount) => `Page ${String(page)} of ${String(pageCount)}`,
    jump: 'Go to page',
    total: (pageCount) => `of ${String(pageCount)}`,
  },
  passwordField: { reveal: 'Show password' },
  searchField: { clear: 'Clear search' },
  selectField: { clear: 'Clear selection' },
});

const DEFAULT_CONFIG: UiCoreConfig = Object.freeze({
  labels: defaultLabels,
  loaderVariant: 'spinner',
});

type LabelGroups = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/** What the application set, shared by every copy of the packages on the page. */
interface SharedState {
  locale?: string;
  version: number;
  labels: LabelGroups;
  loaderVariant: string | undefined;
  readonly listeners: Set<() => void>;
}

const STATE_KEY = Symbol.for('ui-core.config');

type Holder = typeof globalThis & { [STATE_KEY]?: SharedState };

/** Created on first use, so that loading the module changes nothing. */
function sharedState(): SharedState {
  const holder = globalThis as Holder;
  holder[STATE_KEY] ??= {
    version: 0,
    labels: {},
    loaderVariant: undefined,
    listeners: new Set(),
  };
  return holder[STATE_KEY];
}

let cached: { readonly version: number; readonly config: UiCoreConfig } | undefined;

/**
 * Returns the configuration. The same object comes back until the configuration changes, so it
 * can serve as the snapshot of `useSyncExternalStore`.
 */
export function getUiCoreConfig(): UiCoreConfig {
  const state = sharedState();
  if (cached?.version !== state.version) {
    cached = {
      version: state.version,
      config: Object.freeze({
        locale: state.locale,
        labels: mergeLabels(defaultLabels, state.labels),
        loaderVariant: isLoaderVariant(state.loaderVariant)
          ? state.loaderVariant
          : DEFAULT_CONFIG.loaderVariant,
      }),
    };
  }
  return cached.config;
}

/**
 * Sets labels, locale and the look of loaders for every component on the page, those already rendered
 * included. Labels merge one by one over the earlier configuration, so setting one label keeps
 * the others.
 *
 * @example
 * configureUiCore({ labels: { loader: { label: 'Ładowanie' } } });
 */
export function configureUiCore(input: UiCoreConfigInput): void {
  const state = sharedState();
  const labels = mergeOverrides(state.labels, input.labels ?? {});
  const loaderVariant = input.loaderVariant ?? state.loaderVariant;
  const locale = input.locale ?? state.locale;
  if (labels === state.labels && loaderVariant === state.loaderVariant && locale === state.locale) {
    return;
  }
  state.labels = labels;
  state.loaderVariant = loaderVariant;
  state.locale = locale;
  changed(state);
}

/** Restores English labels, the default loader and automatic locale selection. */
export function resetUiCoreConfig(): void {
  const state = sharedState();
  if (
    Object.keys(state.labels).length === 0 &&
    state.loaderVariant === undefined &&
    state.locale === undefined
  ) {
    return;
  }
  state.labels = {};
  state.loaderVariant = undefined;
  state.locale = undefined;
  changed(state);
}

/**
 * Calls `listener` after every change of the configuration, and returns the function that stops
 * it. Components subscribe through it, the web components through their state and React with
 * `useSyncExternalStore`.
 */
export function subscribeUiCoreConfig(listener: () => void): () => void {
  const { listeners } = sharedState();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function changed(state: SharedState): void {
  state.version += 1;
  for (const listener of [...state.listeners]) {
    listener();
  }
}

function isLoaderVariant(value: string | undefined): value is LoaderVariant {
  return loaderVariants.some((variant) => variant === value);
}

/**
 * Merges new overrides into the earlier ones, leaf by leaf. It returns the earlier object when
 * nothing changes, so that setting the same label twice notifies nobody.
 */
function mergeOverrides(earlier: LabelGroups, input: object): LabelGroups {
  let result = earlier;
  for (const [group, leaves] of entriesOf(input)) {
    if (typeof leaves !== 'object' || leaves === null) {
      continue;
    }
    for (const [key, value] of entriesOf(leaves)) {
      if (value === undefined || result[group]?.[key] === value) {
        continue;
      }
      result = { ...result, [group]: { ...result[group], [key]: value } };
    }
  }
  return result;
}

/**
 * Takes the defaults and replaces the leaves the application set. A group or a label that this
 * copy does not know, such as one from a newer copy, is left out.
 */
function mergeLabels(defaults: UiCoreLabels, overrides: LabelGroups): UiCoreLabels {
  const groups: LabelGroups = toGroups(defaults);
  const merged: Record<string, Readonly<Record<string, unknown>>> = {};
  for (const [group, leaves] of Object.entries(groups)) {
    const own = overrides[group] ?? {};
    const entries = Object.entries(leaves).map(([key, value]) => {
      const override = own[key];
      return [key, typeof override === typeof value ? override : value] as const;
    });
    merged[group] = Object.freeze(Object.fromEntries(entries));
  }
  return Object.freeze(merged) as unknown as UiCoreLabels;
}

/** The entries of an object whose values are not known, such as the input of a JavaScript caller. */
function entriesOf(value: object): [string, unknown][] {
  return Object.entries(value as Record<string, unknown>);
}

function toGroups(labels: UiCoreLabels): LabelGroups {
  return labels as unknown as LabelGroups;
}

function freezeLabels(labels: UiCoreLabels): UiCoreLabels {
  for (const leaves of Object.values(toGroups(labels))) {
    Object.freeze(leaves);
  }
  return Object.freeze(labels);
}

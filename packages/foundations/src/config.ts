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

/**
 * Every text that a component renders on its own, grouped by component. A label that holds a
 * value is a function of that value, so that a whole sentence is translated at once.
 */
export interface UiCoreLabels {
  readonly button: {
    /** The description of a button while its action is in progress. */
    readonly loading: string;
  };
  readonly chip: {
    /** The word that names the dismiss button of a chip, read before the text of the chip. */
    readonly dismiss: string;
  };
  readonly iconButton: {
    /** The description of an icon button while its action is in progress. */
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
  readonly passwordField: {
    /** The name of the button that shows the password as plain text, whatever its state. */
    readonly reveal: string;
  };
  readonly searchField: {
    /** The name of the button that clears the query. */
    readonly clear: string;
  };
}

/** The configuration as components read it: always complete. */
export interface UiCoreConfig {
  readonly labels: UiCoreLabels;
  readonly loaderVariant: LoaderVariant;
}

/** What {@link configureUiCore} takes: any group of labels and any label in it, alone. */
export interface UiCoreConfigInput {
  readonly labels?: {
    readonly [Group in keyof UiCoreLabels]?: Partial<UiCoreLabels[Group]>;
  };
  readonly loaderVariant?: LoaderVariant;
}

/** The English labels that the packages ship. */
export const defaultLabels: UiCoreLabels = freezeLabels({
  button: { loading: 'Loading' },
  chip: { dismiss: 'Remove' },
  iconButton: { loading: 'Loading' },
  loader: { label: 'Loading' },
  notification: { dismiss: 'Dismiss' },
  passwordField: { reveal: 'Show password' },
  searchField: { clear: 'Clear search' },
});

const DEFAULT_CONFIG: UiCoreConfig = Object.freeze({
  labels: defaultLabels,
  loaderVariant: 'spinner',
});

type LabelGroups = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/** What the application set, shared by every copy of the packages on the page. */
interface SharedState {
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
 * Sets labels and the look of loaders for every component on the page, those already rendered
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
  if (labels === state.labels && loaderVariant === state.loaderVariant) {
    return;
  }
  state.labels = labels;
  state.loaderVariant = loaderVariant;
  changed(state);
}

/** Restores the English labels and the default loader, for tests and for applications alike. */
export function resetUiCoreConfig(): void {
  const state = sharedState();
  if (Object.keys(state.labels).length === 0 && state.loaderVariant === undefined) {
    return;
  }
  state.labels = {};
  state.loaderVariant = undefined;
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

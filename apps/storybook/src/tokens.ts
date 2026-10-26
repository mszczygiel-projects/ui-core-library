import type {
  ManifestAxis,
  ManifestToken,
  ManifestValue,
  TokenManifest,
} from '@mszczygiel-projects/ui-core-foundations';

/** A context as attribute values, such as `{ theme: 'dark', surface: 'inverse' }`. */
export type Context = Readonly<Partial<Record<ManifestAxis, string>>>;

/**
 * The token's value in a context. An axis the context leaves out takes its base mode, which the
 * manifest lists first, as the page does without the attribute.
 */
export function valueIn(token: ManifestToken, context: Context = {}): ManifestValue | undefined {
  return (
    token.values.find((value) =>
      token.axes.every((axis) => {
        const wanted = context[axis];
        return wanted === undefined
          ? value.context[axis] === token.values[0]?.context[axis]
          : value.context[axis] === wanted;
      }),
    ) ?? token.values[0]
  );
}

export function findToken(manifest: TokenManifest, name: string): ManifestToken | undefined {
  return manifest.tokens.find((token) => token.name === name);
}

/**
 * The tokens whose custom property starts with `prefix`, in the order of the manifest. Figma
 * hides some variables from publishing because they are machinery, such as the copies of the
 * colour roles per surface; they are left out unless asked for.
 */
export function tokensWithPrefix(
  manifest: TokenManifest,
  prefix: string,
  options: { readonly hidden?: boolean } = {},
): ManifestToken[] {
  return manifest.tokens.filter(
    (token) => token.name.startsWith(prefix) && (options.hidden === true || token.hidden !== true),
  );
}

/** Groups tokens by a key, keeping the order in which each group first appears. */
export function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const name = key(item);
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return groups;
}

/** A mode as a label: `dark` → `Dark`, `dark-green` → `Dark green`. */
export function modeLabel(mode: string): string {
  const words = mode.split('-').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** What a toolbar of Storybook lists for an axis: one item per mode, the base mode first. */
export function toolbarItems(modes: readonly string[]): { value: string; title: string }[] {
  return modes.map((mode) => ({ value: mode, title: modeLabel(mode) }));
}

/** A value as a reader wants it: the CSS, with the pixels of a rem, or the pixels of a line height. */
export function describeValue(value: ManifestValue): string {
  if (typeof value.raw === 'number' && value.value.endsWith('rem')) {
    return `${value.value} (${String(value.raw)}px)`;
  }
  // A line height is a ratio of its font size in CSS; its pixels say more to a reader.
  if (typeof value.raw === 'number' && value.value.startsWith('calc(')) {
    return `${String(value.raw)}px`;
  }
  return value.value;
}

/** A context as a label: `{ theme: 'dark', surface: 'inverse' }` → `Dark · Inverse`. */
export function contextLabel(context: Context): string {
  const modes = Object.values(context);
  return modes.length === 0 ? 'Value' : modes.map(modeLabel).join(' · ');
}

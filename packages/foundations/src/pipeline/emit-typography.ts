import { GENERATED_NOTICE } from './emit-css.ts';
import { type Token, tokenId } from './model.ts';
import { cssVarName, normalizedPath } from './names.ts';

/** The properties a text style sets, in the order its class declares them. */
export const TEXT_STYLE_PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
] as const;

export type TextStyleProperty = (typeof TEXT_STYLE_PROPERTIES)[number];

/** The role that sets a property where its name differs: a flag sets the case. */
const ROLE_OF: Readonly<Partial<Record<TextStyleProperty, string>>> = {
  'text-transform': 'text-uppercase',
};

/** Every class of typography.css starts with it, so none can be mistaken for a Tailwind class. */
export const TEXT_CLASS_PREFIX = 'ui-text-';

/**
 * A text style: a group of the `typography/*` roles that sets a font size, such as
 * `typography/heading/h1`. Sizes holds its size and line height, Themes the rest. Its
 * class reads the roles, so it follows the brand and switches to the Desktop sizes at the
 * breakpoint by itself.
 */
export interface TextStyle {
  /** The group's path under `typography/`, such as `['heading', 'h1']`. */
  readonly path: readonly string[];
  readonly className: string;
  /** The custom property behind each property the style sets. */
  readonly properties: Readonly<Partial<Record<TextStyleProperty, string>>>;
  /** The custom property with the weight of `strong` and `b` inside the style. */
  readonly strongWeight?: string;
  /** The token whose font size makes the group a style, for diagnostics. */
  readonly source: string;
}

const STRONG_WEIGHT = 'font-weight-strong';

/**
 * The text styles of the tokens, in the order of their font sizes in the export. A group takes
 * what it lacks from the groups above it: `typography/body/small` sets its own size and takes the
 * font and the weight of `typography/body`.
 */
export function textStyles(tokens: readonly Token[]): TextStyle[] {
  const roles = new Map<string, Token>();
  for (const token of tokens) {
    const path = normalizedPath(token.path);
    if (
      (token.collection === 'Sizes' || token.collection === 'Themes') &&
      path[0] === 'typography'
    ) {
      roles.set(path.slice(1).join('/'), token);
    }
  }
  const inherited = (group: readonly string[], leaf: string): string | undefined => {
    for (let depth = group.length; depth >= 0; depth--) {
      const token = roles.get([...group.slice(0, depth), leaf].join('/'));
      if (token !== undefined) {
        return cssVarName(token.collection, token.path);
      }
    }
    return undefined;
  };

  const styles: TextStyle[] = [];
  for (const [key, token] of roles) {
    const segments = key.split('/');
    if (segments.length < 2 || segments[segments.length - 1] !== 'font-size') {
      continue;
    }
    const group = segments.slice(0, -1);
    const properties: Partial<Record<TextStyleProperty, string>> = {};
    for (const property of TEXT_STYLE_PROPERTIES) {
      const name = inherited(group, ROLE_OF[property] ?? property);
      if (name !== undefined) {
        properties[property] = name;
      }
    }
    const strongWeight = inherited(group, STRONG_WEIGHT);
    styles.push({
      path: group,
      className: `${TEXT_CLASS_PREFIX}${group.join('-').toLowerCase()}`,
      properties,
      ...(strongWeight === undefined ? {} : { strongWeight }),
      source: tokenId(token.collection, token.path),
    });
  }
  return styles;
}

/** Two groups whose paths make the same class name, such as `body/small` and `body-small`. */
export function findClassCollisions(styles: readonly TextStyle[]): string[] {
  const owners = new Map<string, string>();
  const errors: string[] = [];
  for (const style of styles) {
    const owner = owners.get(style.className);
    if (owner === undefined) {
      owners.set(style.className, style.source);
    } else {
      errors.push(
        `${owner} and ${style.source} both make the text style class .${style.className}; rename one of them in Figma`,
      );
    }
  }
  return errors;
}

/**
 * typography.css: one class per text style. The rules live in a layer of their own nested in
 * `components`, behind Tailwind's order of layers: a top-level layer would go after `utilities`
 * whenever Tailwind is imported first, while a layer nested in `components` stays above
 * Tailwind's preflight and below its utilities in either order, so `text-lg` still wins over
 * `ui-text-body`. Without Tailwind the layers are empty, and any unlayered CSS of the
 * application wins.
 */
export function emitTypographyCss(styles: readonly TextStyle[]): string {
  const rules = styles.flatMap((style) => {
    const declarations = TEXT_STYLE_PROPERTIES.flatMap((property) => {
      const name = style.properties[property];
      return name === undefined ? [] : [`    ${property}: var(${name});`];
    });
    const rule = [`  .${style.className} {`, ...declarations, '  }'].join('\n');
    if (style.strongWeight === undefined) {
      return [rule];
    }
    const strong = [
      `  .${style.className} :is(strong, b) {`,
      `    font-weight: var(${style.strongWeight});`,
      '  }',
    ].join('\n');
    return [rule, strong];
  });
  return [
    `/* ${GENERATED_NOTICE} */\n`,
    '@layer theme, base, components, utilities;\n',
    '@layer components.ui-core {',
    rules.join('\n\n'),
    '}\n',
  ].join('\n');
}

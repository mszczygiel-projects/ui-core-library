/**
 * The local Stylelint rules of the components: token names and layers from `tokens.json`, private
 * aliases, raw values and the breakpoints of media and container queries. The configuration at the
 * root of the repository applies them; the components get all five, the CSS of the Storybook site every rule but the layers.
 *
 * The configuration passes Stylelint in, so this tool needs it only for its tests and never adds
 * it to what the repository depends on at run time.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import valueParser from 'postcss-value-parser';
import type stylelint from 'stylelint';

import { isReadableByComponents, manifest, tokensByName } from './manifest.ts';

const DECISION =
  'https://github.com/mszczygiel-projects/ui-core-library/blob/main/docs/decisions/07-styles.md';

type Root = Parameters<ReturnType<stylelint.RuleBase>>[0];
type Node = stylelint.Problem['node'];

/** The custom properties that a value reads with `var()`, fallbacks included. */
export function customPropertiesRead(value: string): string[] {
  const names: string[] = [];
  valueParser(value).walk((node) => {
    if (node.type === 'function' && node.value.toLowerCase() === 'var') {
      const first = node.nodes.find((child) => child.type === 'word');
      if (first?.value.startsWith('--')) {
        names.push(first.value);
      }
    }
  });
  return names;
}

/**
 * The private aliases that the shared stylesheets of a package declare, in `src/internal`, for a
 * component stylesheet in a folder beside it. A family of components, such as the actions, reads
 * them from its shared surface; any other stylesheet reads only its own.
 */
export function sharedAliases(file: string | undefined): Set<string> {
  const aliases = new Set<string>();
  if (file === undefined || basename(dirname(file)) === 'internal') {
    return aliases;
  }
  const internal = join(dirname(dirname(file)), 'internal');
  if (!existsSync(internal)) {
    return aliases;
  }
  for (const name of readdirSync(internal).filter((entry) => entry.endsWith('.css'))) {
    for (const [, alias = ''] of readFileSync(join(internal, name), 'utf8').matchAll(
      /(--_[\w-]+)\s*:/g,
    )) {
      aliases.add(alias);
    }
  }
  return aliases;
}

/**
 * Units that describe geometry rather than a visual value: shares of the parent, the viewport or
 * a container, fractions and turns.
 */
const GEOMETRY_UNITS = new Set([
  '%',
  'fr',
  'deg',
  'turn',
  ...['vw', 'vh', 'vi', 'vb', 'vmin', 'vmax'].flatMap((unit) => [
    unit,
    `s${unit}`,
    `l${unit}`,
    `d${unit}`,
  ]),
  ...['cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax'],
]);

/** Properties whose unitless numbers are visual values that a token has to hold. */
const VISUAL_NUMBERS = new Set(['opacity', 'line-height', 'font-weight', 'font-size']);

/** The raw values of a declaration: lengths, times and the unitless numbers of visual properties. */
export function rawValues(property: string, value: string): string[] {
  const found: string[] = [];
  const visualNumbers = VISUAL_NUMBERS.has(property.toLowerCase());
  valueParser(value).walk((node) => {
    if (node.type !== 'word') {
      return;
    }
    const parsed = valueParser.unit(node.value);
    if (parsed === false || Number(parsed.number) === 0) {
      return;
    }
    const unit = parsed.unit.toLowerCase();
    if (unit === '' ? visualNumbers : !GEOMETRY_UNITS.has(unit)) {
      found.push(node.value);
    }
  });
  return found;
}

/** The lengths in the condition of a media query. */
export function mediaLengths(params: string): string[] {
  return [...params.matchAll(/(?<![\w-])(-?\d*\.?\d+)([a-z]+)/gi)].map(
    ([, number = '', unit = '']) => `${number}${unit}`,
  );
}

/**
 * The lengths a container query may use: the values of the breakpoint tokens. A container query
 * cannot read a custom property, so it names the value of the token.
 */
export const containerBreakpoints: readonly string[] = manifest.tokens
  .filter((token) => token.path.startsWith('breakpoint/'))
  .flatMap((token) => token.values.map((entry) => entry.value));

/** The local rules, as Stylelint plugins made with the Stylelint of the caller. */
export function uiCorePlugins(stylelintApi: typeof stylelint): stylelint.Plugin[] {
  const { createPlugin, utils } = stylelintApi;

  function plugin(
    ruleName: string,
    message: (...args: string[]) => string,
    check: (root: Root, report: (node: Node, ...args: string[]) => void) => void,
  ): stylelint.Plugin {
    const messages = utils.ruleMessages(ruleName, { rejected: message });
    const ruleFunction: stylelint.RuleBase = (primary: unknown) => (root, result) => {
      if (!utils.validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
        return;
      }
      check(root, (node, ...args) => {
        utils.report({ ruleName, result, node, message: messages.rejected, messageArgs: args });
      });
    };
    const rule: stylelint.Rule = Object.assign(ruleFunction, {
      ruleName,
      messages,
      meta: { url: DECISION },
    });
    return createPlugin(ruleName, rule);
  }

  const knownTokens = plugin(
    'ui-core/known-tokens',
    (name = '') =>
      name.startsWith('--_')
        ? `${name} is read but never declared in this stylesheet: a component reads only its own private aliases and those of the shared stylesheets of its package`
        : `Unknown token ${name}: take token names from packages/foundations/token-names.txt`,
    (root, report) => {
      const declared = sharedAliases(root.source?.input.file);
      root.walkDecls((declaration) => {
        if (declaration.prop.startsWith('--_')) {
          declared.add(declaration.prop);
        }
      });
      root.walkDecls((declaration) => {
        for (const name of customPropertiesRead(declaration.value)) {
          const known = name.startsWith('--_') ? declared.has(name) : tokensByName.has(name);
          if (!known) {
            report(declaration, name);
          }
        }
      });
    },
  );

  const tokenLayer = plugin(
    'ui-core/token-layer',
    (name = '', collection = '') =>
      `${name} is a token of ${collection}: a component reads the Components layer, the roles of the focus ring and the motion primitives`,
    (root, report) => {
      root.walkDecls((declaration) => {
        for (const name of customPropertiesRead(declaration.value)) {
          const token = tokensByName.get(name);
          if (token !== undefined && !isReadableByComponents(token)) {
            report(declaration, name, token.collection);
          }
        }
      });
    },
  );

  const noRawValues = plugin(
    'ui-core/no-raw-values',
    (value = '') => `Raw value ${value}: every visual value comes from a token`,
    (root, report) => {
      root.walkDecls((declaration) => {
        for (const value of rawValues(declaration.prop, declaration.value)) {
          report(declaration, value);
        }
      });
    },
  );

  const breakpoint = plugin(
    'ui-core/breakpoint',
    (length = '') =>
      `Media query at ${length}: the layout changes at the breakpoint of tokens.json, ${manifest.breakpoint}`,
    (root, report) => {
      root.walkAtRules(/^media$/i, (atRule) => {
        for (const length of mediaLengths(atRule.params)) {
          if (length !== manifest.breakpoint) {
            report(atRule, length);
          }
        }
      });
    },
  );

  const containerBreakpoint = plugin(
    'ui-core/container-breakpoint',
    (length = '') =>
      `Container query at ${length}: a component changes with its own width at a breakpoint of tokens.json, ${containerBreakpoints.join(', ')}`,
    (root, report) => {
      root.walkAtRules(/^container$/i, (atRule) => {
        for (const length of mediaLengths(atRule.params)) {
          if (!containerBreakpoints.includes(length)) {
            report(atRule, length);
          }
        }
      });
    },
  );

  return [knownTokens, tokenLayer, noRawValues, breakpoint, containerBreakpoint];
}

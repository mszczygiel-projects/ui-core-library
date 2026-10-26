import { emitTokensCss } from './emit-css.ts';
import { buildManifest, emitTokensJson } from './emit-manifest.ts';
import { emitTailwindCss } from './emit-tailwind.ts';
import { emitTokensTs } from './emit-ts.ts';
import { emitTypographyCss, findClassCollisions, textStyles } from './emit-typography.ts';
import type { Token } from './model.ts';
import { themeModeParts } from './modes.ts';
import { modeSlug } from './names.ts';
import { baseModeOf, buildRegistry, collectModes, tokenKey } from './resolve.ts';
import {
  checkLayoutConstants,
  checkPrimitiveAliases,
  type Exceptions,
  findErrors,
  findMetadataViolations,
  findViolations,
  judge,
  NO_EXCEPTIONS,
} from './validate.ts';

/** The files a build writes. Their names are part of the CLI's contract. */
export const OUTPUT_FILES = [
  'tokens.css',
  'tailwind.css',
  'tokens.ts',
  'typography.css',
  'tokens.json',
] as const;

export type OutputFile = (typeof OUTPUT_FILES)[number];

export interface BuildOptions {
  /**
   * Fail on every violation of the token rules not listed as known, as the library's own build
   * does. Off, the violations are warnings, as in a client's fork.
   */
  readonly strict: boolean;
  /** Mirror a theme mode named Dark onto `prefers-color-scheme: dark`. */
  readonly autoDarkMode: boolean;
  readonly exceptions?: Exceptions;
}

export interface BuildResult {
  /** The generated files, or null when an error stopped the build. */
  readonly files: Readonly<Record<OutputFile, string>> | null;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  /** Violations accepted because the exceptions list them as known. */
  readonly knownViolations: number;
  /** What the build produced, for its report. */
  readonly summary: readonly string[];
}

/** Validates the tokens and, when nothing stops it, generates the files. */
export function buildTokens(tokens: readonly Token[], options: BuildOptions): BuildResult {
  const exceptions = options.exceptions ?? NO_EXCEPTIONS;
  const registry = buildRegistry(tokens);
  const styles = textStyles(tokens);
  const errors = [
    ...findErrors(tokens, registry),
    ...checkLayoutConstants(exceptions.layoutConstants, tokens),
    ...checkPrimitiveAliases(exceptions.primitiveAliases ?? [], tokens, exceptions.layoutConstants),
    ...findClassCollisions(styles),
  ];

  // The Desktop values of Sizes apply from the large breakpoint.
  const breakpoint = registry.get(tokenKey('Primitives Sizes', ['breakpoint', 'lg']))?.value;
  if (typeof breakpoint !== 'number') {
    errors.push(
      'Primitives Sizes/breakpoint/lg must be a number: the Desktop values of Sizes apply from that width',
    );
  }

  const layoutConstants = new Set(exceptions.layoutConstants.map((constant) => constant.token));
  const violations = [
    ...findViolations(tokens, layoutConstants, exceptions.primitiveAliases),
    ...findMetadataViolations(tokens),
  ];
  const verdict = judge(violations, {
    strict: options.strict,
    knownViolations: exceptions.knownViolations,
  });
  errors.push(...verdict.errors);

  if (errors.length > 0 || typeof breakpoint !== 'number') {
    return {
      files: null,
      errors,
      warnings: verdict.warnings,
      knownViolations: verdict.known,
      summary: [],
    };
  }

  const { css, warnings } = emitTokensCss(tokens, registry, {
    breakpointPx: breakpoint,
    autoDarkMode: options.autoDarkMode,
  });
  return {
    files: {
      'tokens.css': css,
      'tailwind.css': emitTailwindCss(tokens),
      'tokens.ts': emitTokensTs(tokens),
      'typography.css': emitTypographyCss(styles),
      'tokens.json': emitTokensJson(
        buildManifest(tokens, registry, styles, { breakpointPx: breakpoint }),
      ),
    },
    errors: [],
    warnings: [...verdict.warnings, ...warnings.map((warning) => warning.message)],
    knownViolations: verdict.known,
    summary: summarize(tokens),
  };
}

function summarize(tokens: readonly Token[]): string[] {
  const modes = collectModes(tokens.filter((t) => t.collection === 'Themes'));
  const base = baseModeOf(modes);
  const themes = modes.map((mode) => {
    const { brand, scheme } = themeModeParts(mode);
    const attributes = [
      ...(brand === null ? [] : [`[data-brand="${brand}"]`]),
      ...(scheme === null || (brand !== null && scheme === 'light')
        ? []
        : [`[data-theme="${scheme}"]`]),
    ].join('');
    return mode === base ? `${mode} (:root)` : `${mode} (${attributes || modeSlug(mode)})`;
  });
  const components = tokens.filter((t) => t.collection === 'Components').length;
  return [
    `${String(tokens.length)} tokens, ${String(components)} of them component tokens`,
    `theme modes: ${themes.length > 0 ? themes.join(', ') : 'none'}`,
  ];
}

/** The lines a build reports: errors and warnings to stderr, the outcome to stdout. */
export function reportLines(result: BuildResult): { out: string[]; err: string[] } {
  const err = [
    ...result.warnings.map((warning) => `⚠ ${warning}`),
    ...result.errors.map((error) => `✗ ${error}`),
  ];
  const out = result.summary.map((line) => `  ${line}`);
  if (result.knownViolations > 0) {
    out.push(`  ${String(result.knownViolations)} known violations, listed in the exceptions`);
  }
  if (result.files === null) {
    err.push(`✗ Nothing was written: ${String(result.errors.length)} error(s)`);
  }
  return { out, err };
}

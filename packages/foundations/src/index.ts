/**
 * Typed references to the design tokens. Every leaf is the `var(--…)` of a custom property that
 * tokens.css declares, so a style written with it follows the theme, the surface and the density.
 */
export type { TokenKey, Tokens } from './generated/tokens.ts';
export { tokens } from './generated/tokens.ts';
export type {
  ManifestAxis,
  ManifestShadow,
  ManifestTextStyle,
  ManifestToken,
  ManifestValue,
  TokenManifest,
} from './pipeline/emit-manifest.ts';

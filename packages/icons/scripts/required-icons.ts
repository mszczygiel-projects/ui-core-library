/**
 * Icons the component packages render themselves — the contract any replacement
 * icon set must satisfy.
 *
 * This list is **hand-maintained on purpose**. It cannot be derived by scanning
 * imports, because at least one call site resolves the key at runtime
 * (`number-field.ts` picks between `icon-minus` and `icon-plus`), so a static
 * pass would silently miss icons and produce an incomplete contract.
 *
 * When a component starts using a new icon from `svgMap` or
 * `@mszczygiel-projects/ui-core-icons/react`, add it here in the same commit.
 * The icons build fails when the generated set does not cover this list, so a
 * consumer regenerating the package from their own SVGs finds out at build
 * time rather than through an invisible empty button.
 */
export const REQUIRED_ICONS = [
  'icon-calendar',
  'icon-check',
  'icon-chevron-down',
  'icon-chevron-left',
  'icon-chevron-right',
  'icon-chevron-up',
  'icon-close',
  'icon-danger',
  'icon-delete',
  'icon-eye',
  'icon-eye-slash',
  'icon-file',
  'icon-info',
  'icon-minus',
  'icon-plus',
  'icon-search',
  'icon-upload',
] as const;

export type RequiredIconName = (typeof REQUIRED_ICONS)[number];

/**
 * Names missing from `built`, in contract order. Empty means the set is usable
 * by the component packages.
 */
export function missingRequiredIcons(built: readonly string[]): RequiredIconName[] {
  const present = new Set(built);
  return REQUIRED_ICONS.filter((name) => !present.has(name));
}

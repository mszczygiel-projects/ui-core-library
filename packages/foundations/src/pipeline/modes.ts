import { modeSlug } from './names.ts';

/**
 * What the name of a Themes mode says: `Light` and `Dark` are the schemes of the
 * base brand, `Red Light`, `Red Dark` and `Red` are the schemes of a further brand. Code reads
 * the brand from `data-brand` and the scheme from `data-theme`.
 */
export interface ThemeModeParts {
  /** The brand as `data-brand` writes it, or null for the base brand. */
  readonly brand: string | null;
  /** `light`, `dark`, or null when the name says no scheme. */
  readonly scheme: 'light' | 'dark' | null;
}

export function themeModeParts(mode: string): ThemeModeParts {
  const slug = modeSlug(mode);
  if (slug === 'light' || slug === 'dark') {
    return { brand: null, scheme: slug };
  }
  // Figma names the single mode of a new collection Default: the base brand, with no scheme.
  if (slug === 'default') {
    return { brand: null, scheme: null };
  }
  for (const scheme of ['light', 'dark'] as const) {
    if (slug.endsWith(`-${scheme}`)) {
      return { brand: slug.slice(0, -scheme.length - 1), scheme };
    }
  }
  return { brand: slug, scheme: null };
}

/**
 * What the name of a Sizes mode says: the screen, then the density when it is not
 * the base one. `Mobile` and `Desktop Compact` give `mobile` with no density and `desktop` with
 * `compact`. The screen picks a media query, the density a `data-density` value.
 */
export interface SizesModeParts {
  readonly screen: string;
  readonly density: string | null;
}

export function sizesModeParts(mode: string): SizesModeParts {
  const [screen = '', ...density] = modeSlug(mode).split('-');
  return { screen, density: density.length > 0 ? density.join('-') : null };
}

/** The screens a Sizes mode can name: the base one on `:root`, the wide one from the breakpoint. */
export const BASE_SCREEN = 'mobile';
export const WIDE_SCREEN = 'desktop';

/** The value of `data-density` that resets a nested container to the base density. */
export const BASE_DENSITY = 'comfortable';

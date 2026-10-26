import { normalizedPath } from './names.ts';

/** Figma sizes are pixels; CSS gets rem at the browser default of 16px. */
const ROOT_FONT_SIZE = 16;

export function cleanNumber(value: number, precision = 4): string {
  return parseFloat(value.toFixed(precision)).toString();
}

export function toRem(px: number): string {
  return px === 0 ? '0' : `${cleanNumber(px / ROOT_FONT_SIZE)}rem`;
}

export type PathCategory = 'line-height' | 'font-weight' | 'tracking' | 'duration' | 'other';

/** What a number means, read from the token's path, since Figma types them all as numbers. */
export function pathCategory(path: readonly string[]): PathCategory {
  const segments = normalizedPath(path).map((segment) => segment.toLowerCase());
  const last = segments[segments.length - 1] ?? '';
  if (last === 'line-height' || last.endsWith('-line-height')) {
    return 'line-height';
  }
  if (segments.some((segment) => segment.includes('font-weight'))) {
    return 'font-weight';
  }
  if (segments.some((segment) => segment === 'tracking' || segment === 'letter-spacing')) {
    return 'tracking';
  }
  if (segments.includes('duration')) {
    return 'duration';
  }
  return 'other';
}

/** A raw number in its CSS unit: rem for sizes, em for tracking, ms for durations. */
export function formatNumber(path: readonly string[], value: number): string {
  if (value === 0) {
    return '0';
  }
  switch (pathCategory(path)) {
    case 'font-weight':
      return cleanNumber(value);
    case 'tracking':
      return `${cleanNumber(value)}em`;
    case 'duration':
      return `${String(value)}ms`;
    default:
      return toRem(value);
  }
}

/** `10%`, `-2.5%`, `.5%`: Figma's letter-spacing field writes tracking as a percentage. */
const PERCENTAGE = /^-?(?:\d+(?:\.\d+)?|\.\d+)%$/;
/** A number that arrived as a string, such as `"0"`. */
const NUMERIC_STRING = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

export function formatString(path: readonly string[], value: string): string {
  const segments = normalizedPath(path).map((segment) => segment.toLowerCase());
  // A font family is a `font-family` path, or a `font/*` value of Brand.
  if (segments[0] === 'font' || segments.some((segment) => segment.includes('font-family'))) {
    return `"${value}"`;
  }
  // Tracking variables are strings in Figma, and CSS rejects `letter-spacing: 10%`: the browser
  // drops the declaration and reports nothing. 10% of the font size is exactly 0.1em.
  if (pathCategory(path) === 'tracking') {
    const trimmed = value.trim();
    if (PERCENTAGE.test(trimmed)) {
      const percent = parseFloat(trimmed);
      return percent === 0 ? '0' : `${cleanNumber(percent / 100, 6)}em`;
    }
    if (NUMERIC_STRING.test(trimmed)) {
      return formatNumber(path, parseFloat(trimmed));
    }
  }
  return value;
}

/**
 * Figma has no keyword variables, so a flag is a boolean: `text-uppercase` gives
 * `uppercase` or `none`, `text-underline` gives `underline` or `none`.
 */
export function formatBoolean(path: readonly string[], value: boolean): string {
  const segments = normalizedPath(path).map((segment) => segment.toLowerCase());
  if (segments.some((segment) => segment.includes('uppercase'))) {
    return value ? 'uppercase' : 'none';
  }
  if (segments.some((segment) => segment.includes('underline'))) {
    return value ? 'underline' : 'none';
  }
  return value ? 'true' : 'false';
}

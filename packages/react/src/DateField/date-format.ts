/**
 * Locale-aware date display formatting and forgiving text parsing for
 * ui-date-field. Built entirely on `Intl` — no i18n library.
 *
 * Display format: `dateStyle: 'medium'` (e.g. en-US "Jan 5, 2026",
 * pl-PL "5 lip 2026"). Ranges join two full medium dates with " – "
 * (space, en dash, space) so the string stays unambiguous and parseable.
 *
 * The parser accepts, in order: ISO `YYYY-MM-DD`, the locale's numeric short
 * format (part order derived from `Intl.DateTimeFormat.formatToParts`), and
 * month-name forms (long/short, including the genitive form used in full
 * dates, e.g. pl "lipca").
 */
import { parseISODate, toISODate } from '../Calendar/date-utils.js';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Range separator: dash surrounded by whitespace (en/em dash or hyphen). */
const RANGE_SPLIT_RE = /\s+[–—-]\s+/;

export function formatDateDisplay(locale: string, iso: string): string {
  const d = parseISODate(iso);
  return d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d) : '';
}

export function formatRangeDisplay(
  locale: string,
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = start ? formatDateDisplay(locale, start) : '';
  const e = end ? formatDateDisplay(locale, end) : '';
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

interface LocaleParseData {
  /** Order of numeric parts in the locale's short format, e.g. ['day','month','year']. */
  numericOrder: Array<'day' | 'month' | 'year'>;
  /** Lowercased month name (long/short/genitive, dots stripped) → month 1-12. */
  monthNames: Map<string, number>;
}

const parseDataCache = new Map<string, LocaleParseData>();

function localeParseData(locale: string): LocaleParseData {
  let data = parseDataCache.get(locale);
  if (data) return data;

  const probe = new Date(2024, 4, 15);
  const numericOrder = new Intl.DateTimeFormat(locale, { dateStyle: 'short' })
    .formatToParts(probe)
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type as 'day' | 'month' | 'year');

  const monthNames = new Map<string, number>();
  const addName = (raw: string, month: number) => {
    const key = raw.toLowerCase().replace(/\.+$/, '');
    if (key) monthNames.set(key, month);
  };
  for (let m = 1; m <= 12; m++) {
    const date = new Date(2024, m - 1, 15);
    addName(new Intl.DateTimeFormat(locale, { month: 'long' }).format(date), m);
    addName(new Intl.DateTimeFormat(locale, { month: 'short' }).format(date), m);
    // In-context forms differ in some locales (pl genitive: "lipca", "lip").
    for (const style of ['long', 'short'] as const) {
      const part = new Intl.DateTimeFormat(locale, { day: 'numeric', month: style })
        .formatToParts(date)
        .find((p) => p.type === 'month');
      if (part) addName(part.value, m);
    }
  }

  data = { numericOrder, monthNames };
  parseDataCache.set(locale, data);
  return data;
}

function buildISO(year: number, month: number, day: number): string | null {
  if (year < 100) year += 2000;
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  const iso = `${p(year, 4)}-${p(month)}-${p(day)}`;
  return parseISODate(iso) ? iso : null;
}

/** Parse a single typed date; returns ISO `YYYY-MM-DD` or null. */
export function parseDateText(locale: string, text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  const isoMatch = ISO_RE.exec(t);
  if (isoMatch) {
    const d = parseISODate(t);
    return d ? toISODate(d) : null;
  }

  const { numericOrder, monthNames } = localeParseData(locale);

  // Month-name form: one alphabetic token + day (+ optional year).
  const nameToken = t.match(/\p{L}[\p{L}.]*/u)?.[0];
  const numbers = (t.match(/\d+/g) ?? []).map(Number);
  if (nameToken) {
    const month = monthNames.get(nameToken.toLowerCase().replace(/\.+$/, ''));
    if (!month || numbers.length === 0 || numbers.length > 2) return null;
    const year = numbers.find((n) => n > 31) ?? new Date().getFullYear();
    const day = numbers.find((n) => n <= 31);
    return day ? buildISO(year, month, day) : null;
  }

  // Numeric form in the locale's short-format part order.
  if (numbers.length === 3 && numericOrder.length === 3) {
    const byType: Record<'day' | 'month' | 'year', number> = { day: 0, month: 0, year: 0 };
    numericOrder.forEach((type, i) => {
      byType[type] = numbers[i];
    });
    return buildISO(byType.year, byType.month, byType.day);
  }
  return null;
}

export interface ParsedRange {
  start: string | null;
  end: string | null;
}

/**
 * Parse a typed range ("<date> – <date>") or a lone date (open-ended range).
 * Returns null when any present side fails to parse; swaps reversed input.
 */
export function parseRangeText(locale: string, text: string): ParsedRange | null {
  const t = text.trim();
  if (!t) return { start: null, end: null };
  const sides = t.split(RANGE_SPLIT_RE);
  if (sides.length > 2) return null;
  const start = parseDateText(locale, sides[0]);
  if (!start) return null;
  if (sides.length === 1) return { start, end: null };
  const end = parseDateText(locale, sides[1]);
  if (!end) return null;
  return end < start ? { start: end, end: start } : { start, end };
}
